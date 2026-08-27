/**
 * Validació dels perfils de pesos per trastorn (§5.0 i §5.2.3 del CLAUDE.md).
 *
 * Comprova que `docs/diccionari/perfils-trastorns.csv` estigui complet i sigui
 * coherent abans de programar el motor de matching contra ell.
 *
 * Igual que el validador del diccionari, és tolerant amb el format que exporten
 * els fulls de càlcul (separador i salts de línia variables) i pot normalitzar-lo.
 *
 * Ús:
 *   node --experimental-strip-types scripts/valida-perfils.ts
 *   node --experimental-strip-types scripts/valida-perfils.ts --normalitza
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'docs/diccionari';
const FITXER_EIXOS = join(DIR, 'eixos.csv');

/** Es pot passar un CSV alternatiu com a argument, útil per provar variants. */
const FITXER_PERFILS = process.argv.slice(2).find((a) => a.endsWith('.csv'))
  ?? join(DIR, 'perfils-trastorns.csv');

/** Els set trastorns coberts a v1 (§5.0 del CLAUDE.md). */
const TRASTORNS = ['tea', 'depressio', 'ansietat', 'bipolar', 'tept', 'tdah'];

/**
 * Direcció de l'eix: `suma` = com més alt millor; `resta` = com més baix millor.
 * És un binari a posta (§5.2.3): amb dades tan gruixudes, graduar l'ideal de 0 a 10
 * seria precisió falsa.
 *
 * S'accepten `1`/`0` com a sinònims perquè és el que surt de manera natural en un
 * full de càlcul, però es normalitzen a les paraules, que s'expliquen soles.
 */
const DIRECCIONS = ['suma', 'resta'];
const SINONIMS_DIRECCIO: Record<string, string> = { '1': 'suma', '0': 'resta' };
const normalitzaDireccio = (v: string): string =>
  SINONIMS_DIRECCIO[v.trim()] ?? v.trim().toLowerCase();

/**
 * Eixos on el valor mínim derivable coincideix amb el neutre 5, perquè cap terme
 * del diccionari hi puntua baix. Posar-hi `resta` premia les races de les quals no
 * en sabem res, així que el validador n'avisa (§5.2.3).
 */
const MINIM_ES_NEUTRE: Record<string, string> = {
  energia: 'cap raça baixa de 5,0; el 37 % hi és exactament',
  alerta: 'cap raça baixa de 5,0; el 40 % hi és exactament',
};

/**
 * `mida` NO és un eix del perfil. La mida no depèn del trastorn sinó de l'entorn
 * on ha de viure i treballar el gos, i actua només com a **filtre de pes màxim**
 * (§5.2.4). Els eixos vàlids del perfil són exactament els d'`eixos.csv`.
 */
const EIXOS_ESPERATS_PER_TRASTORN = 7;

// ---------------------------------------------------------------------------
// Lectura tolerant de CSV (mateix criteri que valida-diccionari.ts)
// ---------------------------------------------------------------------------

/**
 * Parteix una línia de CSV respectant les cometes dobles, perquè les columnes de
 * justificació contenen prosa amb comes. Un `""` dins d'un camp entre cometes és
 * una cometa literal (RFC 4180).
 */
function parteixLinia(linia: string, separador: string): string[] {
  const camps: string[] = [];
  let actual = '';
  let dinsCometes = false;

  for (let i = 0; i < linia.length; i++) {
    const c = linia[i];
    if (dinsCometes) {
      if (c === '"') {
        if (linia[i + 1] === '"') { actual += '"'; i++; } else { dinsCometes = false; }
      } else actual += c;
    } else if (c === '"') {
      dinsCometes = true;
    } else if (c === separador) {
      camps.push(actual.trim());
      actual = '';
    } else actual += c;
  }
  camps.push(actual.trim());
  return camps;
}

function detectaSeparador(capçalera: string): ';' | ',' | '\t' {
  const candidats = [';', ',', '\t'] as const;
  let millor: ';' | ',' | '\t' = ',';
  let maxim = 0;
  for (const sep of candidats) {
    const n = capçalera.split(sep).length - 1;
    if (n > maxim) { maxim = n; millor = sep; }
  }
  return millor;
}

interface CsvLlegit {
  capçaleres: string[];
  files: string[][];
  separador: string;
  teniaCrlf: boolean;
  teniaBom: boolean;
  /** Columnes buides al final que ha afegit el full de càlcul i s'han descartat. */
  columnesFantasma: number;
}

function llegeixCsv(cami: string): CsvLlegit {
  const brut = readFileSync(cami, 'utf8');
  const teniaBom = brut.charCodeAt(0) === 0xfeff;
  const teniaCrlf = brut.includes('\r\n');
  const text = (teniaBom ? brut.slice(1) : brut).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const linies = text.split('\n').filter((l) => l.trim() !== '');
  const separador = detectaSeparador(linies[0]);
  const [capçalera, ...resta] = linies;

  let capçaleres = parteixLinia(capçalera, separador);
  let files = resta.map((l) => parteixLinia(l, separador));

  // Excel arrossega columnes buides si el full n'ha tingut mai contingut o format.
  // Es descarten les columnes finals que no tenen ni nom ni cap valor.
  let columnesFantasma = 0;
  while (
    capçaleres.length > 0 &&
    capçaleres[capçaleres.length - 1] === '' &&
    files.every((f) => (f[capçaleres.length - 1] ?? '') === '')
  ) {
    capçaleres = capçaleres.slice(0, -1);
    files = files.map((f) => f.slice(0, capçaleres.length));
    columnesFantasma += 1;
  }

  return { capçaleres, files, separador, teniaCrlf, teniaBom, columnesFantasma };
}

// ---------------------------------------------------------------------------

const problemes: string[] = [];
const avisos: string[] = [];

function main(): void {
  const eixosValids = llegeixCsv(FITXER_EIXOS).files.map((f) => f[0]).filter(Boolean);

  const csv = llegeixCsv(FITXER_PERFILS);
  const idx = Object.fromEntries(csv.capçaleres.map((c, i) => [c, i]));

  for (const col of ['trastorn', 'eix', 'pes', 'direccio']) {
    if (!(col in idx)) problemes.push(`Falta la columna «${col}» a la capçalera.`);
  }
  if (problemes.length) { informa(csv); return; }

  // Plantilla encara sense omplir: informar-ne una vegada val més que escopir
  // dos errors per fila.
  const buida = csv.files.every((f) => !(f[idx.pes] ?? '').trim() && !(f[idx.direccio] ?? '').trim());
  if (buida) {
    console.log(`\nLa plantilla encara és buida: ${csv.files.length} files sense pes ni direcció.`);
    console.log('Omple les columnes «pes» i «direccio» i torna a executar-ho.');
    console.log(`Direcció: ${DIRECCIONS.join(' o ')}. Els pesos de cada trastorn han de sumar 100.`);
    process.exit(0);
  }

  // pesos[trastorn][eix] = pes; serveix per comprovar completesa i suma.
  const pesos = new Map<string, Map<string, number>>();
  const senseJustificacio: string[] = [];
  const senseFont: string[] = [];

  csv.files.forEach((fila, i) => {
    const linia = i + 2;
    const trastorn = (fila[idx.trastorn] ?? '').trim();
    const eix = (fila[idx.eix] ?? '').trim();
    const pesBrut = (fila[idx.pes] ?? '').trim();
    const direccio = normalitzaDireccio(fila[idx.direccio] ?? '');

    if (!TRASTORNS.includes(trastorn)) {
      problemes.push(`Línia ${linia}: trastorn «${trastorn}» desconegut. Vàlids: ${TRASTORNS.join(', ')}.`);
      return;
    }
    if (!eixosValids.includes(eix)) {
      const extra = eix === 'mida'
        ? ' La mida no és un eix del perfil: només actua com a filtre de pes màxim (§5.2.4).'
        : '';
      problemes.push(`Línia ${linia}: eix «${eix}» desconegut. Vàlids: ${eixosValids.join(', ')}.${extra}`);
      return;
    }

    const perTrastorn = pesos.get(trastorn) ?? new Map<string, number>();
    if (perTrastorn.has(eix)) {
      problemes.push(`Línia ${linia}: «${trastorn}» ja té una fila per a l'eix «${eix}».`);
      return;
    }

    // Els fulls de càlcul poden escriure els decimals amb coma.
    const pes = Number(pesBrut.replace(',', '.'));

    if (!pesBrut || !Number.isFinite(pes) || pes < 0 || pes > 100) {
      problemes.push(`Línia ${linia}: pes «${pesBrut}» no vàlid (ha de ser un número de 0 a 100).`);
    }
    if (!DIRECCIONS.includes(direccio)) {
      problemes.push(`Línia ${linia}: direcció «${direccio}» no vàlida. Ha de ser ${DIRECCIONS.join(' o ')}.`);
    }

    // Un eix amb pes 0 no influeix: cal que sigui una decisió, no un descuit.
    if (pes === 0) {
      avisos.push(`«${trastorn}» dona pes 0 a «${eix}»: aquest eix no hi influirà gens.`);
    }

    // «resta» en un eix on el mínim derivable és el neutre premia la manca de dades.
    if (direccio === 'resta' && MINIM_ES_NEUTRE[eix] && pes > 0) {
      avisos.push(
        `«${trastorn}» posa «resta» a «${eix}» amb pes ${pes}: ${MINIM_ES_NEUTRE[eix]}.\n    ` +
        `Amb «resta», les races que puntuen més alt en aquest eix són les que NO tenen cap terme ` +
        `que hi caigui, o sigui aquelles de les quals no en sabem res.`,
      );
    }
    if (!(fila[idx.justificacio] ?? '').trim()) senseJustificacio.push(`${trastorn}/${eix}`);
    if (!(fila[idx.font] ?? '').trim()) senseFont.push(`${trastorn}/${eix}`);

    perTrastorn.set(eix, Number.isFinite(pes) ? pes : 0);
    pesos.set(trastorn, perTrastorn);
  });

  // Si hi ha columnes de proposta alternativa, se'n comprova la suma igualment.
  if (idx.pes_proposta !== undefined) {
    const sumaProposta = new Map<string, number>();
    csv.files.forEach((fila) => {
      const t = (fila[idx.trastorn] ?? '').trim();
      const p = Number((fila[idx.pes_proposta] ?? '').replace(',', '.'));
      if (TRASTORNS.includes(t) && Number.isFinite(p)) {
        sumaProposta.set(t, (sumaProposta.get(t) ?? 0) + p);
      }
      const d = normalitzaDireccio(fila[idx.direccio_proposta] ?? '');
      if (d && !DIRECCIONS.includes(d)) {
        problemes.push(`Proposta de «${t}»: direcció «${d}» no vàlida.`);
      }
    });
    for (const [t, s] of sumaProposta) {
      if (Math.abs(s - 100) > 0.01) {
        problemes.push(`Els pesos de la PROPOSTA per a «${t}» sumen ${s.toFixed(2)}, no 100.`);
      }
    }
  }

  // Completesa i suma: cada trastorn ha de tenir tots els eixos i sumar 100.
  for (const trastorn of TRASTORNS) {
    const perTrastorn = pesos.get(trastorn);
    if (!perTrastorn) {
      problemes.push(`El trastorn «${trastorn}» no té cap fila.`);
      continue;
    }
    const falten = eixosValids.filter((e) => !perTrastorn.has(e));
    if (falten.length) {
      problemes.push(`«${trastorn}» no té fila per als eixos: ${falten.join(', ')}.`);
    }
    const suma = [...perTrastorn.values()].reduce((a, b) => a + b, 0);
    // Tolerància petita per als decimals: 99,999 ha de passar.
    if (Math.abs(suma - 100) > 0.01) {
      problemes.push(`Els pesos de «${trastorn}» sumen ${suma.toFixed(2)}, no 100.`);
    }
  }

  if (senseJustificacio.length) {
    avisos.push(
      `${senseJustificacio.length} fila(es) sense justificació. El treball de recerca ha de poder ` +
      `defensar per què cada eix pesa el que pesa.`,
    );
  }
  if (senseFont.length) {
    avisos.push(
      `${senseFont.length} fila(es) sense font. La correlació trastorn → eixos s'ha de poder ` +
      `sustentar en fonts sobre gossos d'assistència (§5.0).`,
    );
  }

  informa(csv);

  if (process.argv.includes('--normalitza')) {
    const cel·la = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    // La direcció es desa sempre amb paraula, encara que s'hagi escrit com a 1/0.
    const files = csv.files.map((f) => {
      const copia = [...f];
      if (idx.direccio !== undefined) copia[idx.direccio] = normalitzaDireccio(copia[idx.direccio] ?? '');
      return copia;
    });
    const linies = [csv.capçaleres, ...files].map((f) => f.map(cel·la).join(','));
    writeFileSync(FITXER_PERFILS, '﻿' + linies.join('\n') + '\n', 'utf8');
    console.log(`\nFitxer normalitzat → ${FITXER_PERFILS}`);
  }

  process.exit(problemes.length ? 1 : 0);
}

function informa(csv: CsvLlegit): void {
  console.log(
    `Format detectat: separador «${csv.separador === '\t' ? 'tab' : csv.separador}»` +
    `, salts ${csv.teniaCrlf ? 'CRLF' : 'LF'}, BOM ${csv.teniaBom ? 'sí' : 'no'}` +
    (csv.columnesFantasma ? `, ${csv.columnesFantasma} columna(es) buida(es) descartada(es)` : ''),
  );
  console.log(
    `Files: ${csv.files.length} (esperades: ${TRASTORNS.length} trastorns × ` +
    `${EIXOS_ESPERATS_PER_TRASTORN} eixos = ${TRASTORNS.length * EIXOS_ESPERATS_PER_TRASTORN})`,
  );

  if (problemes.length) {
    console.log(`\nERRORS (${problemes.length}):`);
    problemes.forEach((p) => console.log('  ✗ ' + p));
  }
  if (avisos.length) {
    console.log(`\nAVISOS (${avisos.length}):`);
    avisos.forEach((a) => console.log('  ! ' + a));
  }
  if (!problemes.length && !avisos.length) console.log('\nTot correcte.');
}

main();
