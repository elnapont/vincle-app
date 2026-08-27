/**
 * Previsualització del rànquing de compatibilitat (§5.2.3 del CLAUDE.md).
 *
 * Aplica el diccionari de traducció i els perfils de pesos sobre TOTES les races
 * de The Dog API i ensenya com queda el rànquing de cada trastorn. Serveix per
 * validar els perfils ABANS de dissenyar i implementar la interfície: si un perfil
 * dona resultats estranys o si totes les races puntuen igual, es veu aquí i surt
 * molt més barat corregir-ho ara.
 *
 * NO és el motor de producció. La lògica de derivació i puntuació d'aquest fitxer
 * és la que després viurà al mòdul de matching de la capa d'API pròpia; aquí està
 * aïllada perquè es pugui executar i explicar sense muntar el monorepo.
 *
 * Ús:
 *   DOG_API_KEY=... node --experimental-strip-types scripts/previsualitza-ranquing.ts
 *   ... --proposta     compara els pesos de l'equip amb els de la proposta
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { llegeixCsv } from './lib/csv.ts';

const DIR = 'docs/diccionari';
const FITXER_INFORME = join(DIR, 'previsualitzacio-ranquing.md');

/** Valor d'un eix quan cap terme de la raça hi cau: «no ho sabem» (§5.2). */
const NEUTRE = 5;

/**
 * Pes reservat a la longevitat, IGUAL per a tots els trastorns (§5.2.5).
 *
 * La longevitat no depèn del trastorn, així que no té sentit posar-la a la
 * plantilla de perfils. En comptes d'això, el motor en reserva un percentatge fix
 * i reescala els pesos de temperament perquè el total continuï sent 100. Els 42
 * pesos del CSV segueixen dient «com es reparteixen els 7 eixos de temperament
 * entre ells», que és el que la responsable del projecte hi va decidir.
 */
const PES_LONGEVITAT = Number(
  process.argv.find((a) => a.startsWith('--longevitat='))?.split('=')[1] ?? 10,
);

/**
 * Punts d'ancoratge esperança de vida → valor 0–10, amb interpolació lineal.
 *
 * Raonament: un gos d'assistència necessita uns 2 anys d'ensinistrament, de manera
 * que la longevitat es tradueix directament en anys de feina útil. L'escala és
 * deliberadament plana per dalt i abrupta per baix: el 76 % del catàleg viu entre
 * 12 i 15 anys i no cal esmicolar-lo, mentre que les races que no arriben als 9
 * anys sí que s'han de penalitzar de debò.
 */
const ANCORES_VIDA: [number, number][] = [[7, 0], [9, 3], [11, 6], [13, 8.5], [15, 10]];

function valorLongevitat(anys: number | null): number {
  // Sense dada, el mateix criteri que a la resta d'eixos: neutre «no ho sabem».
  if (anys === null) return NEUTRE;
  if (anys <= ANCORES_VIDA[0][0]) return ANCORES_VIDA[0][1];
  if (anys >= ANCORES_VIDA[ANCORES_VIDA.length - 1][0]) return 10;
  for (let i = 0; i < ANCORES_VIDA.length - 1; i++) {
    const [x1, y1] = ANCORES_VIDA[i], [x2, y2] = ANCORES_VIDA[i + 1];
    if (anys <= x2) return y1 + (anys - x1) * (y2 - y1) / (x2 - x1);
  }
  return 10;
}

/** Nom intern de l'eix de longevitat; no surt a `eixos.csv` (no ve del diccionari). */
const EIX_LONGEVITAT = 'longevitat';

// ---------------------------------------------------------------------------
// Càrrega de les dades de referència
// ---------------------------------------------------------------------------

interface Assignacio { eix: string; puntuacio: number }

/** terme (en minúscules) → eixos que afecta amb la seva puntuació. */
function carregaDiccionari(): Map<string, Assignacio[]> {
  const csv = llegeixCsv(join(DIR, 'termes-temperament.csv'));
  const mapa = new Map<string, Assignacio[]>();

  for (const fila of csv.files) {
    const terme = (fila[csv.idx.terme] ?? '').toLowerCase();
    const eix = fila[csv.idx.eix] ?? '';
    const punt = Number((fila[csv.idx.puntuacio] ?? '').replace(',', '.'));
    if (!terme || !eix || !Number.isFinite(punt)) continue;

    // Un terme pot tenir més d'una fila si afecta dos eixos (§5.2).
    mapa.set(terme, [...(mapa.get(terme) ?? []), { eix, puntuacio: punt }]);
  }
  return mapa;
}

interface PesEix { eix: string; pes: number; direccio: string }
interface Perfil { clau: string; nom: string; eixos: PesEix[] }

/** Carrega els perfils. `proposta` tria el joc de columnes alternatiu. */
function carregaPerfils(proposta: boolean): Perfil[] {
  const csv = llegeixCsv(join(DIR, 'perfils-trastorns.csv'));
  const colPes = proposta ? 'pes_proposta' : 'pes';
  const colDir = proposta ? 'direccio_proposta' : 'direccio';

  if (csv.idx[colPes] === undefined) {
    throw new Error(`El fitxer de perfils no té la columna «${colPes}».`);
  }

  const perfils = new Map<string, Perfil>();
  for (const fila of csv.files) {
    const clau = fila[csv.idx.trastorn] ?? '';
    if (!clau) continue;

    const perfil = perfils.get(clau) ?? {
      clau, nom: fila[csv.idx.trastorn_nom] ?? clau, eixos: [],
    };
    perfil.eixos.push({
      eix: fila[csv.idx.eix] ?? '',
      pes: Number((fila[csv.idx[colPes]] ?? '').replace(',', '.')) || 0,
      // `1`/`0` s'accepten com a sinònims de suma/resta.
      direccio: ({ '1': 'suma', '0': 'resta' } as Record<string, string>)[fila[csv.idx[colDir]] ?? '']
        ?? (fila[csv.idx[colDir]] ?? '').toLowerCase(),
    });
    perfils.set(clau, perfil);
  }
  return [...perfils.values()];
}

// ---------------------------------------------------------------------------
// Derivació d'eixos i puntuació — el nucli conceptual del treball
// ---------------------------------------------------------------------------

interface Raça { nom: string; termes: string[]; kg: number | null; anys: number | null }

/**
 * Deriva els eixos d'una raça: agrupa els termes del seu `temperament` per eix i
 * en fa la MITJANA. Els eixos que cap terme no toca queden al neutre.
 */
function derivaEixos(
  raça: Raça, diccionari: Map<string, Assignacio[]>, eixos: string[],
): { valors: Map<string, number>; derivats: Set<string> } {
  const acumulat = new Map<string, number[]>();

  for (const terme of raça.termes) {
    for (const { eix, puntuacio } of diccionari.get(terme) ?? []) {
      acumulat.set(eix, [...(acumulat.get(eix) ?? []), puntuacio]);
    }
  }

  const valors = new Map<string, number>();
  const derivats = new Set<string>();
  for (const eix of eixos) {
    const v = acumulat.get(eix);
    if (v?.length) {
      valors.set(eix, v.reduce((a, b) => a + b, 0) / v.length);
      derivats.add(eix);
    } else {
      valors.set(eix, NEUTRE);
    }
  }

  // La longevitat no ve del diccionari: es calcula de `life_span`.
  valors.set(EIX_LONGEVITAT, valorLongevitat(raça.anys));
  if (raça.anys !== null) derivats.add(EIX_LONGEVITAT);

  return { valors, derivats };
}

/**
 * Reescala els pesos de temperament per deixar lloc a la longevitat, de manera
 * que el total continuï sumant 100 i la fórmula de la §5.2.3 no canviï.
 */
function ambLongevitat(perfil: Perfil): Perfil {
  if (PES_LONGEVITAT <= 0) return perfil;
  const factor = (100 - PES_LONGEVITAT) / 100;
  return {
    ...perfil,
    eixos: [
      ...perfil.eixos.map((e) => ({ ...e, pes: e.pes * factor })),
      { eix: EIX_LONGEVITAT, pes: PES_LONGEVITAT, direccio: 'suma' },
    ],
  };
}

/**
 * Compatibilitat 0–100 segons la fórmula de la §5.2.3: mitjana ponderada dels
 * eixos amb la direcció aplicada.
 */
function compatibilitat(valors: Map<string, number>, perfil: Perfil): number {
  let numerador = 0;
  let pesTotal = 0;
  for (const { eix, pes, direccio } of perfil.eixos) {
    const valor = valors.get(eix) ?? NEUTRE;
    numerador += pes * (direccio === 'resta' ? 10 - valor : valor);
    pesTotal += pes;
  }
  return (numerador / (pesTotal * 10)) * 100;
}

// ---------------------------------------------------------------------------
// Descàrrega del catàleg
// ---------------------------------------------------------------------------

async function descarregaRaces(clau: string): Promise<Raça[]> {
  const totes: Raça[] = [];
  for (let pagina = 0; ; pagina += 1) {
    const r = await fetch(`https://api.thedogapi.com/v1/breeds?limit=500&page=${pagina}`, {
      headers: { 'x-api-key': clau },
    });
    if (!r.ok) throw new Error(`The Dog API ha respost ${r.status}`);
    const bloc = (await r.json()) as any[];

    for (const b of bloc) {
      const nums = (b.weight?.metric ?? '').match(/\d+(\.\d+)?/g)?.map(Number);
      // `life_span` arriba com «12-15» o «12 - 15 years»; en prenem el punt mitjà.
      const vida = (b.life_span ?? '').match(/\d+/g)?.map(Number);
      totes.push({
        nom: b.name,
        termes: (b.temperament ?? '').split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean),
        kg: nums?.length ? (Math.min(...nums) + Math.max(...nums)) / 2 : null,
        anys: vida?.length ? (Math.min(...vida) + Math.max(...vida)) / 2 : null,
      });
    }
    if (bloc.length < 500) break;
  }
  return totes;
}

// ---------------------------------------------------------------------------
// Estadística de suport
// ---------------------------------------------------------------------------

function resum(valors: number[]) {
  const ord = [...valors].sort((a, b) => a - b);
  const mitjana = ord.reduce((a, b) => a + b, 0) / ord.length;
  return {
    min: ord[0],
    max: ord[ord.length - 1],
    mitjana,
    desviacio: Math.sqrt(ord.reduce((a, b) => a + (b - mitjana) ** 2, 0) / ord.length),
    p25: ord[Math.floor(ord.length * 0.25)],
    p75: ord[Math.floor(ord.length * 0.75)],
    recorregut: ord[ord.length - 1] - ord[0],
  };
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const clau = process.env.DOG_API_KEY;
  if (!clau) throw new Error("Falta DOG_API_KEY amb el token de The Dog API.");

  const usaProposta = process.argv.includes('--proposta');
  const diccionari = carregaDiccionari();
  const eixos = llegeixCsv(join(DIR, 'eixos.csv')).files.map((f) => f[0]).filter(Boolean);

  console.log('Descarregant el catàleg…');
  const races = await descarregaRaces(clau);
  console.log(`${races.length} races · ${diccionari.size} termes al diccionari · ${eixos.length} eixos\n`);

  // Els eixos es deriven un sol cop per raça: no depenen del trastorn.
  const derivacions = races.map((r) => ({ raça: r, ...derivaEixos(r, diccionari, eixos) }));

  // Total d'eixos avaluats: els del diccionari més la longevitat, si està activada.
  const totalEixos = eixos.length + (PES_LONGEVITAT > 0 ? 1 : 0);

  const vides = races.map((r) => r.anys).filter((a): a is number => a !== null);
  const mitjanaVidaCataleg = vides.reduce((a, b) => a + b, 0) / vides.length;

  const jocs: { etiqueta: string; perfils: Perfil[] }[] = [
    { etiqueta: 'equip', perfils: carregaPerfils(false).map(ambLongevitat) },
  ];
  if (usaProposta) jocs.push({ etiqueta: 'proposta', perfils: carregaPerfils(true).map(ambLongevitat) });

  console.log(PES_LONGEVITAT > 0
    ? `Longevitat: ${PES_LONGEVITAT} % del pes a tots els perfils; la resta es reescala.\n`
    : 'Longevitat: desactivada.\n');

  const linies: string[] = [
    '# Previsualització del rànquing de compatibilitat',
    '',
    'Generat per `scripts/previsualitza-ranquing.ts` sobre les dades reals de The Dog API.',
    'Serveix per validar els perfils abans de dissenyar i implementar la interfície.',
    '',
    `Catàleg: **${races.length} races**. Diccionari: **${diccionari.size} termes**. Eixos: **${eixos.length}**.`,
    '',
  ];

  for (const joc of jocs) {
    console.log(`${'='.repeat(70)}\nPESOS: ${joc.etiqueta.toUpperCase()}\n${'='.repeat(70)}`);
    linies.push(`## Pesos: ${joc.etiqueta}`, '');

    for (const perfil of joc.perfils) {
      const puntuades = derivacions
        .map((d) => ({ ...d, punts: compatibilitat(d.valors, perfil) }))
        .sort((a, b) => b.punts - a.punts);

      const e = resum(puntuades.map((p) => p.punts));

      console.log(`\n${perfil.nom} (${perfil.clau})`);
      console.log(`  distribució: mín ${e.min.toFixed(1)}%  p25 ${e.p25.toFixed(1)}%  ` +
        `mitjana ${e.mitjana.toFixed(1)}%  p75 ${e.p75.toFixed(1)}%  màx ${e.max.toFixed(1)}%  ` +
        `· recorregut ${e.recorregut.toFixed(1)} punts · desviació ${e.desviacio.toFixed(2)}`);
      console.log('  top 10:');
      puntuades.slice(0, 10).forEach((p, i) => {
        const desconeguts = totalEixos - p.derivats.size;
        console.log(`   ${String(i + 1).padStart(2)}. ${p.punts.toFixed(1)}%  ${p.raça.nom.padEnd(30)}` +
          `${p.raça.kg ? p.raça.kg.toFixed(0).padStart(3) + ' kg' : '  ? kg'}` +
          `  ${desconeguts ? `${desconeguts} eix(os) sense dades` : 'tots els eixos derivats'}`);
      });
      console.log('  cua (3 últimes):');
      puntuades.slice(-3).forEach((p) => console.log(`       ${p.punts.toFixed(1)}%  ${p.raça.nom}`));

      // Esperança de vida mitjana del top 10 vs la del catàleg: un gos d'assistència
      // necessita uns 2 anys d'ensinistrament, així que la longevitat és rellevant.
      const vidaTop = puntuades.slice(0, 10).map((p) => p.raça.anys).filter((a): a is number => a !== null);
      const mitjanaVidaTop = vidaTop.length ? vidaTop.reduce((a, b) => a + b, 0) / vidaTop.length : null;

      linies.push(
        `### ${perfil.nom}`, '',
        `Distribució: mín **${e.min.toFixed(1)} %** · mitjana **${e.mitjana.toFixed(1)} %** · ` +
        `màx **${e.max.toFixed(1)} %** · recorregut **${e.recorregut.toFixed(1)} punts**`,
        mitjanaVidaTop
          ? `\nEsperança de vida mitjana del top 10: **${mitjanaVidaTop.toFixed(1)} anys** ` +
            `(mitjana del catàleg: ${mitjanaVidaCataleg.toFixed(1)} anys)`
          : '',
        '',
        '| # | Raça | Compatibilitat | Pes | Vida | Eixos sense dades |',
        '|---|---|---|---|---|---|',
        ...puntuades.slice(0, 15).map((p, i) =>
          `| ${i + 1} | ${p.raça.nom} | ${p.punts.toFixed(1)} % | ` +
          `${p.raça.kg ? p.raça.kg.toFixed(0) + ' kg' : '—'} | ` +
          `${p.raça.anys ? p.raça.anys.toFixed(1) + ' anys' : '—'} | ${totalEixos - p.derivats.size} |`),
        '',
      );
    }
  }

  // -------------------------------------------------------------------------
  // Diagnòstic de validesa
  // -------------------------------------------------------------------------
  // Dues comprovacions que diuen si el model mesura el que volem que mesuri.

  /**
   * Races que la literatura documenta com les que realment es fan servir per a
   * assistència psiquiàtrica (Rodriguez2020a: «predominantment labradors o
   * mestissos»; també caniche gegant i pastor alemany a la resta de fonts).
   * Si el nostre rànquing les deixa al fons, alguna cosa no mesura bé.
   */
  const REFERENCIA = [
    'Labrador Retriever', 'Golden Retriever', 'Standard Poodle', 'Poodle',
    'German Shepherd Dog', 'Labradoodle', 'Goldendoodle',
  ];

  console.log(`\n${'='.repeat(70)}\nDIAGNÒSTIC DE VALIDESA\n${'='.repeat(70)}`);
  linies.push('## Diagnòstic de validesa', '');

  for (const joc of jocs) {
    console.log(`\nPosició de les races que la literatura documenta (pesos: ${joc.etiqueta})`);
    linies.push(`### Races documentades a la literatura — pesos: ${joc.etiqueta}`, '',
      '| Raça | ' + joc.perfils.map((p) => p.clau).join(' | ') + ' |',
      '|---|' + joc.perfils.map(() => '---|').join(''));

    for (const nom of REFERENCIA) {
      const posicions = joc.perfils.map((perfil) => {
        const ord = derivacions
          .map((d) => ({ nom: d.raça.nom, punts: compatibilitat(d.valors, perfil) }))
          .sort((a, b) => b.punts - a.punts);
        const i = ord.findIndex((x) => x.nom === nom);
        return i < 0 ? null : { pos: i + 1, punts: ord[i].punts, total: ord.length };
      });
      if (posicions.every((p) => p === null)) continue;

      console.log('  ' + nom.padEnd(22) + posicions
        .map((p, i) => `${joc.perfils[i].clau}: ${p ? `#${p.pos}/${p.total}` : '—'}`)
        .join('  '));
      linies.push(`| ${nom} | ` + posicions.map((p) => p ? `#${p.pos}` : '—').join(' | ') + ' |');
    }
    linies.push('');
  }

  // Correlació entre «quants eixos té sense dades» i la puntuació. Si és positiva,
  // el model premia la ignorància: no saber res d'una raça la fa pujar.
  console.log('\nCorrelació entre eixos SENSE dades i puntuació');
  console.log('  (positiva = el model premia les races de les quals no en sabem res)');
  linies.push('### Correlació entre eixos sense dades i puntuació', '',
    'Una correlació positiva vol dir que **no tenir dades fa pujar** la raça al rànquing.', '',
    '| Trastorn | Correlació (pesos equip) |', '|---|---|');

  for (const perfil of jocs[0].perfils) {
    const punts = derivacions.map((d) => compatibilitat(d.valors, perfil));
    const buits = derivacions.map((d) => totalEixos - d.derivats.size);
    const mx = buits.reduce((a, b) => a + b, 0) / buits.length;
    const my = punts.reduce((a, b) => a + b, 0) / punts.length;
    const cov = buits.reduce((a, b, i) => a + (b - mx) * (punts[i] - my), 0);
    const sx = Math.sqrt(buits.reduce((a, b) => a + (b - mx) ** 2, 0));
    const sy = Math.sqrt(punts.reduce((a, b) => a + (b - my) ** 2, 0));
    const r = cov / (sx * sy);
    console.log(`  ${perfil.clau.padEnd(11)} r = ${r >= 0 ? '+' : ''}${r.toFixed(3)}`);
    linies.push(`| ${perfil.nom} | ${r >= 0 ? '+' : ''}${r.toFixed(3)} |`);
  }
  linies.push('');

  // Si s'han calculat els dos jocs, quant es mouen realment els resultats?
  if (jocs.length === 2) {
    console.log(`\n${'='.repeat(70)}\nQUANT CANVIA EL RÀNQUING ENTRE ELS DOS JOCS DE PESOS\n${'='.repeat(70)}`);
    linies.push('## Comparació entre els dos jocs de pesos', '',
      '| Trastorn | Races compartides al top 10 | Canvi de la 1a posició |', '|---|---|---|');

    for (const perfil of jocs[0].perfils) {
      const altre = jocs[1].perfils.find((p) => p.clau === perfil.clau)!;
      const top = (p: Perfil) => derivacions
        .map((d) => ({ nom: d.raça.nom, punts: compatibilitat(d.valors, p) }))
        .sort((a, b) => b.punts - a.punts);

      const a = top(perfil), b = top(altre);
      const compartides = a.slice(0, 10).filter((x) => b.slice(0, 10).some((y) => y.nom === x.nom)).length;
      const mateixaPrimera = a[0].nom === b[0].nom;

      console.log(`  ${perfil.clau.padEnd(11)} ${compartides}/10 races compartides al top 10 · ` +
        `1a posició: ${mateixaPrimera ? 'la mateixa' : `${a[0].nom} → ${b[0].nom}`}`);
      linies.push(`| ${perfil.nom} | ${compartides}/10 | ` +
        `${mateixaPrimera ? 'sense canvi' : `${a[0].nom} → ${b[0].nom}`} |`);
    }
    linies.push('');
  }

  writeFileSync(FITXER_INFORME, linies.join('\n'), 'utf8');
  console.log(`\nInforme escrit a ${FITXER_INFORME}`);
}

main().catch((e) => {
  console.error('Error:', e instanceof Error ? e.message : e);
  process.exit(1);
});
