/**
 * Tasca preparatòria §5.3 del CLAUDE.md — extracció de valors dels camps de text
 * de The Dog API per construir la plantilla del diccionari de traducció.
 *
 * IMPORTANT: aquesta és una tasca ÚNICA de preparació de dades. NO forma part de
 * l'aplicació en execució. Vincle, un cop en marxa, farà servir el diccionari ja
 * construït i no tornarà a extreure res d'aquí.
 *
 * Què fa:
 *   1. Es connecta a The Dog API i recupera TOTES les races (amb paginació).
 *   2. Del camp `temperament`, parteix cada valor per comes i construeix la llista
 *      única de termes normalitzats de tot el catàleg.
 *   3. Per a cada terme compta la freqüència (nombre de races que el contenen).
 *   4. Fa el mateix, per separat, amb `breed_group` i `bred_for`.
 *   5. Exporta cada llista a un CSV treballable amb full de càlcul, amb les
 *      columnes buides que ha d'omplir la responsable del projecte.
 *
 * Ús:
 *   DOG_API_KEY=... node --experimental-strip-types scripts/extreu-termes.ts
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Configuració
// ---------------------------------------------------------------------------

const API_BASE = 'https://api.thedogapi.com/v1';

/** Màxim de resultats per pàgina que accepta l'API (per sobre, els retalla). */
const MIDA_PAGINA = 500;

/** Carpeta de sortida, relativa a l'arrel del repositori. */
const DIR_SORTIDA = 'docs/diccionari';

/**
 * Fitxer opcional amb les traduccions al català dels termes de `temperament`.
 * Si existeix, s'utilitza per emplenar la columna `terme_ca` dels CSV generats.
 * Format: CSV amb capçalera `terme,terme_ca`.
 */
const FITXER_TRADUCCIONS = join(DIR_SORTIDA, 'traduccions-ca.csv');

/**
 * Llista tancada d'eixos (§5 del CLAUDE.md). Serveix perquè el full de càlcul
 * pugui fer validació de dades i la responsable no hagi d'escriure'ls a mà.
 * `mida` NO hi surt: és l'únic eix que es calcula directament de `weight`/`height`
 * i no es deriva de cap paraula del temperament.
 */
const EIXOS = [
  { clau: 'entrenabilitat', descripcio: 'Facilitat d\'aprenentatge i voluntat de cooperar' },
  { clau: 'energia', descripcio: 'Nivell d\'activitat i necessitat d\'exercici' },
  { clau: 'calma', descripcio: 'Estabilitat i capacitat de quedar-se quiet i relaxat' },
  { clau: 'sociabilitat', descripcio: 'Afabilitat amb persones i altres animals' },
  { clau: 'reactivitat', descripcio: 'Intensitat de resposta davant d\'estímuls inesperats' },
  { clau: 'orientacio-persona', descripcio: 'Atenció i vincle cap a la persona de referència' },
  { clau: 'alerta', descripcio: 'Vigilància i tendència a avisar o lladrar' },
  { clau: 'tolerancia-entorns', descripcio: 'Seguretat en entorns nous, sorollosos o concorreguts' },
  { clau: 'manteniment', descripcio: 'Necessitats de cura, pèl i manteniment diari' },
] as const;

/**
 * Proposta d'agrupació canònica de `breed_group`. El camp arriba brut de l'API:
 * hi conviuen sinònims i variants tipogràfiques del mateix grup («scenthound» i
 * «scent hound», «spitz», «spitz-type» i «spitz and primitive types»…). Aquest
 * mapa els redueix a un conjunt tancat perquè el grup pugui fer-se servir com a
 * filtre o com a pista de propòsit sense duplicats.
 *
 * És una PROPOSTA: la responsable del projecte l'ha de revisar i pot canviar-la.
 */
const GRUP_CANONIC: Record<string, string> = {
  'hound': 'sabues',
  'scenthound': 'sabues',
  'scent hound': 'sabues',
  'sighthound': 'llebrer',
  'sighthound & pariah': 'llebrer',
  'working': 'treball',
  'guardian': 'treball',
  'utility': 'treball',
  'herding': 'pastor',
  'pastoral/herding': 'pastor',
  'sporting': 'mostra-cobrament',
  'terrier': 'terrier',
  'toy': 'miniatura',
  'companion': 'companyia',
  'non-sporting': 'no-esportiu',
  'spitz': 'spitz-primitiu',
  'spitz-type': 'spitz-primitiu',
  'spitz and primitive types': 'spitz-primitiu',
  'northern': 'spitz-primitiu',
  'primitive': 'spitz-primitiu',
  'primitive/wild canid': 'spitz-primitiu',
  'pariah': 'spitz-primitiu',
  'landrace': 'spitz-primitiu',
  'mixed': 'mestis',
  'mixed breed': 'mestis',
  'foundation stock service': 'sense-classificar',
  'unknown': 'sense-classificar',
};

// ---------------------------------------------------------------------------
// Tipus de la resposta de l'API (només el que ens interessa d'aquesta tasca)
// ---------------------------------------------------------------------------

interface RaçaApi {
  id: number | string;
  name: string;
  temperament?: string | null;
  breed_group?: string | null;
  bred_for?: string | null;
}

/** Recompte d'un terme: quantes races el contenen i un parell d'exemples. */
interface Recompte {
  terme: string;
  frequencia: number;
  exemples: string[];
}

// ---------------------------------------------------------------------------
// 1. Descàrrega de totes les races (amb paginació)
// ---------------------------------------------------------------------------

async function descarregaRaces(clau: string): Promise<RaçaApi[]> {
  // L'API informa del total de races a la capçalera `pagination-count`, però com
  // que no la retorna a totes les crides, anem demanant pàgines fins que una en
  // torni menys de les demanades (senyal que hem arribat al final).
  const totes: RaçaApi[] = [];
  let pagina = 0;

  while (true) {
    const url = `${API_BASE}/breeds?limit=${MIDA_PAGINA}&page=${pagina}`;
    const resposta = await fetch(url, { headers: { 'x-api-key': clau } });

    if (!resposta.ok) {
      throw new Error(`The Dog API ha respost ${resposta.status} ${resposta.statusText} a ${url}`);
    }

    const bloc = (await resposta.json()) as RaçaApi[];
    totes.push(...bloc);
    console.log(`  pàgina ${pagina}: ${bloc.length} races (acumulat: ${totes.length})`);

    if (bloc.length < MIDA_PAGINA) break;
    pagina += 1;
  }

  return totes;
}

// ---------------------------------------------------------------------------
// 2. Normalització i extracció de termes
// ---------------------------------------------------------------------------

/**
 * Normalitza un terme perquè variants tipogràfiques no comptin com a termes
 * diferents: minúscules, sense espais sobrants ni duplicats interns, sense punt
 * final i amb els apòstrofs tipogràfics unificats.
 */
function normalitza(brut: string): string {
  return brut
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\.+$/, '')
    .trim()
    .toLowerCase();
}

/**
 * Compta, per a un camp de text donat, quantes races contenen cada terme.
 * `separaPerComes` distingeix els camps que són llistes (`temperament`,
 * `bred_for`) dels que són un valor únic (`breed_group`).
 */
function comptaTermes(
  races: RaçaApi[],
  camp: keyof RaçaApi,
  separaPerComes: boolean,
): Recompte[] {
  const acumulat = new Map<string, { frequencia: number; exemples: string[] }>();

  for (const raça of races) {
    const valor = raça[camp];
    if (typeof valor !== 'string' || valor.trim() === '') continue;

    const trossos = separaPerComes ? valor.split(',') : [valor];

    // `Set` per raça: si una raça repeteix un terme, només compta un cop.
    const termesDeLaRaça = new Set(
      trossos.map(normalitza).filter((t) => t.length > 0),
    );

    for (const terme of termesDeLaRaça) {
      const entrada = acumulat.get(terme) ?? { frequencia: 0, exemples: [] };
      entrada.frequencia += 1;
      if (entrada.exemples.length < 3) entrada.exemples.push(raça.name);
      acumulat.set(terme, entrada);
    }
  }

  // Ordenat per freqüència descendent perquè la responsable pugui prioritzar els
  // termes més habituals, i alfabèticament en cas d'empat.
  return [...acumulat.entries()]
    .map(([terme, dades]) => ({ terme, ...dades }))
    .sort((a, b) => b.frequencia - a.frequencia || a.terme.localeCompare(b.terme));
}

// ---------------------------------------------------------------------------
// 3. Escriptura dels CSV
// ---------------------------------------------------------------------------

/** Escapa un valor perquè sigui segur dins d'un CSV (cometes, comes, salts). */
function cel·la(valor: string | number): string {
  const text = String(valor);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function escriuCsv(camiFitxer: string, capçaleres: string[], files: (string | number)[][]): void {
  const linies = [capçaleres, ...files].map((fila) => fila.map(cel·la).join(','));
  // BOM UTF-8 perquè Excel obri correctament els accents i la ela geminada.
  writeFileSync(camiFitxer, '﻿' + linies.join('\n') + '\n', 'utf8');
  console.log(`  escrit: ${camiFitxer} (${files.length} files)`);
}

/** Llegeix el fitxer de traduccions si existeix; retorna un mapa terme → terme_ca. */
function carregaTraduccions(): Map<string, string> {
  const mapa = new Map<string, string>();
  if (!existsSync(FITXER_TRADUCCIONS)) return mapa;

  const contingut = readFileSync(FITXER_TRADUCCIONS, 'utf8').replace(/^﻿/, '');
  const linies = contingut.split('\n').slice(1); // saltem la capçalera

  for (const linia of linies) {
    if (!linia.trim()) continue;
    // Partició simple: els termes no contenen comes ni cometes.
    const [terme, traduccio] = linia.split(',').map((t) => t.trim());
    if (terme && traduccio) mapa.set(normalitza(terme), traduccio);
  }

  console.log(`  traduccions carregades: ${mapa.size}`);
  return mapa;
}

// ---------------------------------------------------------------------------
// Programa principal
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const clau = process.env.DOG_API_KEY;
  if (!clau) {
    throw new Error('Falta la variable d\'entorn DOG_API_KEY amb el token de The Dog API.');
  }

  console.log('Descarregant races de The Dog API…');
  const races = await descarregaRaces(clau);
  console.log(`Total de races: ${races.length}\n`);

  mkdirSync(DIR_SORTIDA, { recursive: true });
  const traduccions = carregaTraduccions();

  // --- temperament: la font principal del diccionari -----------------------
  const temperaments = comptaTermes(races, 'temperament', true);
  escriuCsv(
    join(DIR_SORTIDA, 'termes-temperament.csv'),
    ['terme', 'terme_ca', 'frequencia', 'eix', 'puntuacio', 'notes', 'races_exemple'],
    temperaments.map((r) => [
      r.terme,
      traduccions.get(r.terme) ?? '',
      r.frequencia,
      '', // eix — a omplir (valors vàlids a eixos.csv)
      '', // puntuacio — a omplir (0–10)
      '', // notes
      r.exemples.join(' · '),
    ]),
  );

  // --- breed_group: pistes de propòsit -------------------------------------
  const grups = comptaTermes(races, 'breed_group', false);
  escriuCsv(
    join(DIR_SORTIDA, 'termes-breed-group.csv'),
    ['terme', 'terme_ca', 'grup_canonic', 'frequencia', 'eix', 'puntuacio', 'notes', 'races_exemple'],
    grups.map((r) => [
      r.terme,
      traduccions.get(r.terme) ?? '',
      GRUP_CANONIC[r.terme] ?? '',
      r.frequencia,
      '',
      '',
      '',
      r.exemples.join(' · '),
    ]),
  );

  // --- bred_for: pistes d'instint ------------------------------------------
  // NOTA: al tier d'estudiant aquest camp arriba buit a TOTES les races. El CSV
  // es genera igualment (encara que quedi sense files) per deixar constància
  // documentada de la comprovació al treball de recerca.
  const propositss = comptaTermes(races, 'bred_for', true);
  escriuCsv(
    join(DIR_SORTIDA, 'termes-bred-for.csv'),
    ['terme', 'terme_ca', 'frequencia', 'eix', 'puntuacio', 'notes', 'races_exemple'],
    propositss.map((r) => [
      r.terme,
      traduccions.get(r.terme) ?? '',
      r.frequencia,
      '',
      '',
      '',
      r.exemples.join(' · '),
    ]),
  );
  if (propositss.length === 0) {
    console.log('  AVÍS: `bred_for` arriba buit a totes les races; no aporta res al diccionari.');
  }

  // --- eixos: llista tancada per a la validació de dades del full ----------
  escriuCsv(
    join(DIR_SORTIDA, 'eixos.csv'),
    ['eix', 'descripcio'],
    EIXOS.map((e) => [e.clau, e.descripcio]),
  );

  // --- cobertura: quantes races es queden sense dades ----------------------
  const senseTemperament = races.filter((r) => !r.temperament?.trim()).length;
  const senseGrup = races.filter((r) => !r.breed_group?.trim()).length;
  const senseBredFor = races.filter((r) => !r.bred_for?.trim()).length;

  console.log('\nResum:');
  console.log(`  races totals ................. ${races.length}`);
  console.log(`  termes únics de temperament .. ${temperaments.length}`);
  console.log(`  valors únics de breed_group .. ${grups.length}`);
  console.log(`  valors únics de bred_for ..... ${propositss.length}`);
  console.log(`  races sense temperament ...... ${senseTemperament}`);
  console.log(`  races sense breed_group ...... ${senseGrup}`);
  console.log(`  races sense bred_for ......... ${senseBredFor}`);
}

main().catch((error) => {
  console.error('\nError:', error instanceof Error ? error.message : error);
  process.exit(1);
});
