/**
 * Converteix el catàleg d'exercicis de Markdown a TypeScript tipat.
 *
 * Els exercicis els escriu una persona (§6.1 del CLAUDE.md): són contingut curat
 * i validat, no generat. Viuen en Markdown a `docs/exercicis/` perquè els passos
 * són prosa i escriure prosa dins d'un full de càlcul és incòmode, mentre que en
 * Markdown s'escriu com s'escriuria al treball i el `git diff` ensenya què ha
 * canviat d'una versió a l'altra.
 *
 * Aquest script els llegeix, els valida i n'escup un mòdul que l'aplicació pot
 * importar. Si en falta algun camp obligatori —la font, per exemple, que el §6.1
 * fa imprescindible— la generació falla aquí i no a les mans de l'usuari.
 *
 *   npm run exercicis:genera
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR_ORIGEN = 'docs/exercicis';
const FITXER_SORTIDA = 'apps/app/src/dades/exercicis.ts';

const DIFICULTATS = ['inicial', 'intermedia', 'avancada'];

/** Quants exercicis ha de tenir cada bloc, segons el que va fixar l'equip. */
const EXERCICIS_PER_BLOC: Record<number, number> = { 1: 3, 2: 5, 3: 4, 4: 3, 5: 4 };

const problemes: string[] = [];
const avisos: string[] = [];
/** Fitxers que encara són la plantilla sense tocar. */
const senseOmplir: string[] = [];

// ---------------------------------------------------------------------------
// Lectura del Markdown
// ---------------------------------------------------------------------------

interface Pas { ordre: number; titol: string; descripcio: string }

interface Exercici {
  id: string;
  bloc: number;
  ordre: number;
  nom: string;
  dificultat: string;
  objectiu: string;
  passos: Pas[];
  criteriAssoliment: string;
  recomanacio: { sessions: number; minutsPerSessio: number; dies: number };
  milestoneIds: string[];
  font: string;
}

/**
 * Capdamunt del fitxer: claus planes entre dues línies de `---`.
 *
 * S'ha triat pla i no imbricat perquè s'omple a mà: `sessions: 15` en tres línies
 * és més fàcil d'escriure sense equivocar-se que una estructura amb claus.
 */
function llegeixCapdamunt(text: string, fitxer: string): Record<string, string> {
  const coincidencia = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!coincidencia) {
    problemes.push(`${fitxer}: no té el bloc de dades entre --- al capdamunt.`);
    return {};
  }

  const camps: Record<string, string> = {};
  for (const linia of coincidencia[1]!.split('\n')) {
    if (!linia.trim() || linia.trimStart().startsWith('#')) continue;
    const tall = linia.indexOf(':');
    if (tall < 0) continue;
    camps[linia.slice(0, tall).trim()] = linia.slice(tall + 1).trim();
  }
  return camps;
}

/**
 * Contingut d'una secció `## Títol` fins a la següent del mateix nivell.
 *
 * Es parteix el text pels encapçalaments en comptes de fer-ho amb una expressió
 * regular amb mirada endavant. Amb la marca multilínia, `$` vol dir «final de
 * línia» i no «final de text», i la secció es tallava a la primera línia.
 */
function seccio(text: string, titol: string): string {
  for (const tros of text.split(/^## /m).slice(1)) {
    const salt = tros.indexOf('\n');
    const capcalera = (salt < 0 ? tros : tros.slice(0, salt)).trim();
    if (capcalera === titol) return (salt < 0 ? '' : tros.slice(salt + 1)).trim();
  }
  return '';
}

/** Passos numerats: `### 1. Títol` seguit de la descripció. */
function llegeixPassos(text: string, fitxer: string): Pas[] {
  const blocPassos = seccio(text, 'Passos');
  const passos: Pas[] = [];

  const trossos = blocPassos.split(/^### /m).slice(1);
  for (const [i, tros] of trossos.entries()) {
    const salt = tros.indexOf('\n');
    const capcalera = (salt < 0 ? tros : tros.slice(0, salt)).trim();
    const descripcio = (salt < 0 ? '' : tros.slice(salt + 1)).trim();

    // El número del títol és opcional: si hi és, es respecta; si no, es dedueix.
    const ambNumero = capcalera.match(/^(\d+)[.)]\s*(.+)$/);
    const titol = ambNumero ? ambNumero[2]!.trim() : capcalera;

    if (!titol) { problemes.push(`${fitxer}: hi ha un pas sense títol.`); continue; }
    if (!descripcio) { problemes.push(`${fitxer}: el pas «${titol}» no té descripció.`); }

    passos.push({ ordre: i + 1, titol, descripcio });
  }

  if (passos.length === 0) problemes.push(`${fitxer}: no té cap pas.`);
  return passos;
}

function nombre(camps: Record<string, string>, clau: string, fitxer: string): number {
  const brut = camps[clau];
  const valor = Number((brut ?? '').replace(',', '.'));
  if (!brut || !Number.isFinite(valor) || valor <= 0) {
    problemes.push(`${fitxer}: «${clau}» ha de ser un número positiu (ara: «${brut ?? ''}»).`);
    return 0;
  }
  return valor;
}

function llegeixExercici(fitxer: string, cami: string): Exercici | null {
  const text = readFileSync(cami, 'utf8');
  const camps = llegeixCapdamunt(text, fitxer);
  if (Object.keys(camps).length === 0) return null;

  const nom = camps.nom ?? '';

  // Plantilla encara sense tocar: es diu un cop i no set vegades. Amb dinou
  // fitxers buits, la llista detallada d'errors seria inservible.
  if (!nom && !camps.font && !camps.dificultat) {
    senseOmplir.push(fitxer);
    return null;
  }

  if (!nom) problemes.push(`${fitxer}: falta el nom.`);

  const dificultat = camps.dificultat ?? '';
  if (!DIFICULTATS.includes(dificultat)) {
    problemes.push(`${fitxer}: dificultat «${dificultat}» desconeguda. Vàlides: ${DIFICULTATS.join(', ')}.`);
  }

  const objectiu = seccio(text, 'Objectiu');
  if (!objectiu) problemes.push(`${fitxer}: falta la secció «## Objectiu».`);

  const criteri = seccio(text, "Criteri d'assoliment");
  if (!criteri) problemes.push(`${fitxer}: falta la secció «## Criteri d'assoliment».`);

  // La font és obligatòria: el §6.1 exigeix que el contingut d'ensinistrament
  // estigui validat per una persona i que la font quedi documentada.
  const font = camps.font ?? '';
  if (!font) problemes.push(`${fitxer}: falta la font. El §6.1 la fa obligatòria.`);

  const bloc = nombre(camps, 'bloc', fitxer);
  const ordre = nombre(camps, 'ordre', fitxer);

  return {
    id: `e${bloc}-${ordre}`,
    bloc, ordre, nom, dificultat, objectiu,
    passos: llegeixPassos(text, fitxer),
    criteriAssoliment: criteri,
    recomanacio: {
      sessions: nombre(camps, 'sessions', fitxer),
      minutsPerSessio: nombre(camps, 'minuts', fitxer),
      dies: nombre(camps, 'dies', fitxer),
    },
    // Les fites encara no estan definides (§9). El camp queda buit i s'omplirà
    // sense haver de tocar els fitxers dels exercicis.
    milestoneIds: [],
    font,
  };
}

// ---------------------------------------------------------------------------

function main(): void {
  if (!existsSync(DIR_ORIGEN)) {
    console.error(`No hi ha la carpeta ${DIR_ORIGEN}.`);
    process.exit(1);
  }

  const fitxers = readdirSync(DIR_ORIGEN)
    .filter((f) => /^\d-\d+\.md$/.test(f))
    .sort();

  const exercicis = fitxers
    .map((f) => llegeixExercici(f, join(DIR_ORIGEN, f)))
    .filter((e): e is Exercici => e !== null)
    .sort((a, b) => a.bloc - b.bloc || a.ordre - b.ordre);

  // Els blocs i els seus noms viuen en un fitxer a part.
  const blocs = llegeixBlocs();

  // Comprovacions de conjunt: que no en falti cap i que no n'hi hagi de repetits.
  const vistos = new Set<string>();
  for (const e of exercicis) {
    if (vistos.has(e.id)) problemes.push(`Hi ha dos exercicis amb bloc ${e.bloc} i ordre ${e.ordre}.`);
    vistos.add(e.id);
  }
  for (const [bloc, esperats] of Object.entries(EXERCICIS_PER_BLOC)) {
    const n = exercicis.filter((e) => e.bloc === Number(bloc)).length;
    if (n !== esperats) {
      avisos.push(`El bloc ${bloc} té ${n} exercicis i n'hauria de tenir ${esperats}.`);
    }
  }

  console.log(`Exercicis llegits: ${exercicis.length} de ${fitxers.length} fitxers`);
  if (senseOmplir.length > 0) {
    console.log(`Encara són plantilles sense omplir: ${senseOmplir.length}`
      + ` (${senseOmplir.join(', ')})`);
  }
  if (problemes.length) {
    console.log(`\nERRORS (${problemes.length}):`);
    problemes.forEach((p) => console.log('  ✗ ' + p));
  }
  if (avisos.length) {
    console.log(`\nAVISOS (${avisos.length}):`);
    avisos.forEach((a) => console.log('  ! ' + a));
  }

  // Amb errors no s'escriu res: val més quedar-se amb el fitxer d'abans que
  // generar-ne un d'incomplet.
  if (problemes.length) {
    console.log('\nNo s\'ha generat res. Arregla els errors i torna-ho a executar.');
    process.exit(1);
  }

  if (exercicis.length === 0) {
    console.log('\nCap exercici omplert encara: no hi ha res a generar.');
    process.exit(0);
  }

  escriu(exercicis, blocs);
  console.log(`\nEscrit: ${FITXER_SORTIDA}`);
}

interface Bloc { bloc: number; nom: string; descripcio: string }

function llegeixBlocs(): Bloc[] {
  const cami = join(DIR_ORIGEN, 'blocs.md');
  if (!existsSync(cami)) {
    problemes.push('Falta docs/exercicis/blocs.md amb els noms dels cinc blocs.');
    return [];
  }

  const blocs: Bloc[] = [];
  const text = readFileSync(cami, 'utf8');
  // Cada bloc és `## N. Nom` i, a sota, la descripció.
  for (const tros of text.split(/^## /m).slice(1)) {
    const salt = tros.indexOf('\n');
    const capcalera = (salt < 0 ? tros : tros.slice(0, salt)).trim();
    const descripcio = (salt < 0 ? '' : tros.slice(salt + 1)).trim();

    // Encapçalament sense nom encara: és la plantilla sense omplir, no un error.
    if (/^\d+[.)]?\s*$/.test(capcalera)) continue;

    const m = capcalera.match(/^(\d+)[.)]\s*(.+)$/);
    if (!m) { problemes.push(`blocs.md: no entenc l'encapçalament «${capcalera}».`); continue; }
    blocs.push({ bloc: Number(m[1]), nom: m[2]!.trim(), descripcio });
  }

  // Només s'exigeixen els cinc quan ja s'ha començat a omplir.
  if (blocs.length > 0 && blocs.length !== 5) {
    problemes.push(`blocs.md: hi ha ${blocs.length} blocs amb nom i n'hi ha d'haver 5.`);
  }
  return blocs;
}

function escriu(exercicis: Exercici[], blocs: Bloc[]): void {
  const j = (v: unknown) => JSON.stringify(v);

  const linies = [
    '// GENERAT AUTOMÀTICAMENT des de docs/exercicis — no editar a mà.',
    '// Torna a generar-ho amb: npm run exercicis:genera',
    '',
    "import type { BlocInfo, Exercise } from '@vincle/shared-types';",
    '',
    '/** Noms i descripcions dels cinc blocs del catàleg. */',
    'export const BLOCS_CATALEG: readonly { bloc: number; nom: string; descripcio: string }[] = [',
    ...blocs.map((b) => `  { bloc: ${b.bloc}, nom: ${j(b.nom)}, descripcio: ${j(b.descripcio)} },`),
    '];',
    '',
    '/** Catàleg curat d\'exercicis. Contingut de referència: l\'app no en crea de nous.',
    ' *  Font de cada exercici documentada al seu fitxer de `docs/exercicis`. */',
    'export const EXERCICIS: readonly Exercise[] = [',
    ...exercicis.flatMap((e) => [
      '  {',
      `    id: ${j(e.id)},`,
      `    bloc: ${e.bloc},`,
      `    ordre: ${e.ordre},`,
      `    nom: ${j(e.nom)},`,
      `    dificultat: ${j(e.dificultat)},`,
      `    objectiu: ${j(e.objectiu)},`,
      '    passos: [',
      ...e.passos.map((p) =>
        `      { ordre: ${p.ordre}, titol: ${j(p.titol)}, descripcio: ${j(p.descripcio)} },`),
      '    ],',
      `    criteriAssoliment: ${j(e.criteriAssoliment)},`,
      `    recomanacio: { sessions: ${e.recomanacio.sessions}, `
        + `minutsPerSessio: ${e.recomanacio.minutsPerSessio}, dies: ${e.recomanacio.dies} },`,
      `    milestoneIds: [],`,
      `    font: ${j(e.font)},`,
      '  },',
    ]),
    '];',
    '',
    '/** Els exercicis d\'un bloc, en ordre. */',
    'export function exercicisDelBloc(bloc: number): readonly Exercise[] {',
    '  return EXERCICIS.filter((e) => e.bloc === bloc);',
    '}',
    '',
    'export type { BlocInfo };',
    '',
  ];

  mkdirSync(join(FITXER_SORTIDA, '..'), { recursive: true });
  writeFileSync(FITXER_SORTIDA, linies.join('\n'), 'utf8');
}

main();
