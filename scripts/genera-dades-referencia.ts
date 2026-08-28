/**
 * Genera les dades de referència del matching com a TypeScript tipat.
 *
 * El diccionari de traducció i els perfils de pesos viuen a `docs/diccionari` en
 * CSV, perquè els edita una persona amb un full de càlcul. L'aplicació, en canvi,
 * no ha de parsejar CSV en execució: ho faria a cada arrencada, seria lent i
 * podria fallar amb dades mal formades quan ja és massa tard.
 *
 * Aquest script tanca aquesta distància: llegeix els CSV un sol cop, en temps de
 * desenvolupament, i n'escup mòduls TypeScript amb els valors ja validats. Si un
 * CSV està malament, el build peta aquí i no a les mans de l'usuari.
 *
 * Cal tornar-lo a executar cada vegada que es toqui un CSV de `docs/diccionari`:
 *   npm run dades:genera
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { llegeixCsv } from './lib/csv.ts';

const DIR_DADES = 'docs/diccionari';
const DIR_SORTIDA = 'packages/matching/src/dades';

const CAPCALERA = `// GENERAT AUTOMÀTICAMENT des de docs/diccionari — no editar a mà.
// Torna a generar-ho amb: npm run dades:genera
`;

/** Els sis trastorns i els set eixos han de coincidir amb @vincle/shared-types. */
const TRASTORNS = ['tea', 'depressio', 'ansietat', 'bipolar', 'tept', 'tdah'];
const DIRECCIONS = ['suma', 'resta'];
const SINONIMS: Record<string, string> = { '1': 'suma', '0': 'resta' };

function error(missatge: string): never {
  console.error(`\nError: ${missatge}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Diccionari de traducció
// ---------------------------------------------------------------------------

function generaDiccionari(eixos: string[]): number {
  const csv = llegeixCsv(join(DIR_DADES, 'termes-temperament.csv'));

  // terme → llista d'assignacions. Un terme pot afectar dos eixos si té dues files.
  const entrades = new Map<string, { eix: string; puntuacio: number }[]>();
  const traduccions = new Map<string, string>();

  for (const fila of csv.files) {
    const terme = (fila[csv.idx.terme] ?? '').toLowerCase().trim();
    const eix = (fila[csv.idx.eix] ?? '').trim();
    const brut = (fila[csv.idx.puntuacio] ?? '').replace(',', '.').trim();
    if (!terme) continue;

    const traduccio = (fila[csv.idx.terme_ca] ?? '').trim();
    if (traduccio) traduccions.set(terme, traduccio);

    // Sense eix vol dir «ignora aquest terme»: és legítim i no és cap error.
    if (!eix) continue;

    if (!eixos.includes(eix)) error(`el terme «${terme}» té l'eix desconegut «${eix}».`);
    const puntuacio = Number(brut);
    if (!Number.isFinite(puntuacio) || puntuacio < 0 || puntuacio > 10) {
      error(`el terme «${terme}» té la puntuació «${brut}», fora de l'escala 0–10.`);
    }
    entrades.set(terme, [...(entrades.get(terme) ?? []), { eix, puntuacio }]);
  }

  const linies = [
    CAPCALERA,
    `import type { EixTemperament } from '@vincle/shared-types';`,
    ``,
    `export interface AssignacioTerme {`,
    `  readonly eix: EixTemperament;`,
    `  readonly puntuacio: number;`,
    `}`,
    ``,
    `/** Termes de \`temperament\` → eixos puntuats. Font: docs/diccionari/termes-temperament.csv */`,
    `export const DICCIONARI: Readonly<Record<string, readonly AssignacioTerme[]>> = {`,
    ...[...entrades.entries()].map(([terme, assignacions]) =>
      `  ${JSON.stringify(terme)}: [${assignacions
        .map((a) => `{ eix: ${JSON.stringify(a.eix)}, puntuacio: ${a.puntuacio} }`)
        .join(', ')}],`),
    `};`,
    ``,
    `/** Traduccions al català dels termes, per mostrar-los a la interfície (§5.2.1). */`,
    `export const TRADUCCIO_TERME: Readonly<Record<string, string>> = {`,
    ...[...traduccions.entries()].map(([t, ca]) => `  ${JSON.stringify(t)}: ${JSON.stringify(ca)},`),
    `};`,
    ``,
  ];

  writeFileSync(join(DIR_SORTIDA, 'diccionari.ts'), linies.join('\n'), 'utf8');
  return entrades.size;
}

// ---------------------------------------------------------------------------
// Perfils de pesos
// ---------------------------------------------------------------------------

function generaPerfils(eixos: string[]): number {
  const csv = llegeixCsv(join(DIR_DADES, 'perfils-trastorns.csv'));
  const perfils = new Map<string, { eix: string; pes: number; direccio: string }[]>();

  for (const fila of csv.files) {
    const trastorn = (fila[csv.idx.trastorn] ?? '').trim();
    const eix = (fila[csv.idx.eix] ?? '').trim();
    if (!trastorn) continue;

    if (!TRASTORNS.includes(trastorn)) error(`trastorn desconegut: «${trastorn}».`);
    if (!eixos.includes(eix)) error(`«${trastorn}» té l'eix desconegut «${eix}».`);

    const pes = Number((fila[csv.idx.pes] ?? '').replace(',', '.'));
    if (!Number.isFinite(pes) || pes < 0 || pes > 100) {
      error(`«${trastorn}/${eix}» té el pes «${fila[csv.idx.pes]}», fora de 0–100.`);
    }

    const brut = (fila[csv.idx.direccio] ?? '').trim();
    const direccio = SINONIMS[brut] ?? brut.toLowerCase();
    if (!DIRECCIONS.includes(direccio)) {
      error(`«${trastorn}/${eix}» té la direcció «${brut}», que no és suma ni resta.`);
    }

    perfils.set(trastorn, [...(perfils.get(trastorn) ?? []), { eix, pes, direccio }]);
  }

  // Cap perfil incomplet ni descompensat ha d'arribar a l'aplicació.
  for (const trastorn of TRASTORNS) {
    const eixosDelPerfil = perfils.get(trastorn);
    if (!eixosDelPerfil) error(`falta el perfil de «${trastorn}».`);
    if (eixosDelPerfil.length !== eixos.length) {
      error(`«${trastorn}» té ${eixosDelPerfil.length} eixos i n'hi ha d'haver ${eixos.length}.`);
    }
    const suma = eixosDelPerfil.reduce((a, e) => a + e.pes, 0);
    if (Math.abs(suma - 100) > 0.01) {
      error(`els pesos de «${trastorn}» sumen ${suma.toFixed(2)} i han de sumar 100.`);
    }
  }

  const linies = [
    CAPCALERA,
    `import type { PerfilTrastorn } from '@vincle/shared-types';`,
    ``,
    `/** Pesos i direccions per trastorn. Font: docs/diccionari/perfils-trastorns.csv */`,
    `export const PERFILS: readonly PerfilTrastorn[] = [`,
    ...TRASTORNS.flatMap((trastorn) => [
      `  {`,
      `    trastorn: ${JSON.stringify(trastorn)},`,
      `    eixos: [`,
      ...perfils.get(trastorn)!.map((e) =>
        `      { eix: ${JSON.stringify(e.eix)}, pes: ${e.pes}, direccio: ${JSON.stringify(e.direccio)} },`),
      `    ],`,
      `  },`,
    ]),
    `];`,
    ``,
  ];

  writeFileSync(join(DIR_SORTIDA, 'perfils.ts'), linies.join('\n'), 'utf8');
  return perfils.size;
}

// ---------------------------------------------------------------------------

function main(): void {
  const eixos = llegeixCsv(join(DIR_DADES, 'eixos.csv')).files.map((f) => f[0]!).filter(Boolean);
  mkdirSync(DIR_SORTIDA, { recursive: true });

  const termes = generaDiccionari(eixos);
  const perfils = generaPerfils(eixos);

  console.log(`Dades de referència generades a ${DIR_SORTIDA}:`);
  console.log(`  diccionari.ts  ${termes} termes amb eix assignat`);
  console.log(`  perfils.ts     ${perfils} trastorns × ${eixos.length} eixos`);
}

main();
