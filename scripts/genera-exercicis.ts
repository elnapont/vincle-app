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

const FREQUENCIES = ['diaria', 'total'];

/** Quants exercicis ha de tenir cada bloc, segons el que va fixar l'equip. */
const EXERCICIS_PER_BLOC: Record<number, number> = { 1: 3, 2: 5, 3: 4, 4: 3, 5: 4 };

const problemes: string[] = [];
const avisos: string[] = [];
/** Fitxers que encara són la plantilla sense tocar. */
const senseOmplir: string[] = [];

// ---------------------------------------------------------------------------
// Lectura del Markdown
// ---------------------------------------------------------------------------

interface Exercici {
  id: string;
  bloc: number;
  ordre: number;
  nom: string;
  explicacio: string;
  nota: string | null;
  recomanacio: {
    sessionsMin: number;
    sessionsMax: number;
    frequencia: string;
    dies: number;
    minutsPerSessio: number | null;
  };
  milestoneIds: string[];
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
    if (capcalera === titol) {
      const cos = salt < 0 ? '' : tros.slice(salt + 1);
      // Els comentaris de la plantilla són ajudes per a qui omple, no contingut:
      // si no es treien, una plantilla sense tocar semblaria plena.
      return cos.replace(/<!--[\s\S]*?-->/g, '').trim();
    }
  }
  return '';
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

/**
 * Nombre de sessions, que pot ser un valor sol o un rang: «3-4» vol dir de tres
 * a quatre. Amb un valor sol, el mínim i el màxim coincideixen.
 */
function rangSessions(brut: string, fitxer: string): { min: number; max: number } {
  const parts = brut.split(/\s*[-–]\s*/).map((p) => Number(p.trim()));
  const valids = parts.every((n) => Number.isInteger(n) && n > 0);

  if (!brut || parts.length > 2 || !valids) {
    problemes.push(`${fitxer}: «sessions» ha de ser un número o un rang com «3-4» (ara: «${brut}»).`);
    return { min: 0, max: 0 };
  }

  const [a, b] = [parts[0]!, parts[1] ?? parts[0]!];
  if (a > b) {
    problemes.push(`${fitxer}: el rang de sessions va del gran al petit («${brut}»).`);
    return { min: b, max: a };
  }
  return { min: a, max: b };
}

function llegeixExercici(fitxer: string, cami: string): Exercici | null {
  const text = readFileSync(cami, 'utf8');
  const camps = llegeixCapdamunt(text, fitxer);
  if (Object.keys(camps).length === 0) return null;

  const nom = camps.nom ?? '';
  const explicacio = seccio(text, 'Explicació');

  // Plantilla encara sense tocar: es diu un cop i no cinc vegades. Amb dinou
  // fitxers buits, la llista detallada d'errors seria inservible.
  if (!nom && !camps.sessions && !explicacio) {
    senseOmplir.push(fitxer);
    return null;
  }

  if (!nom) problemes.push(`${fitxer}: falta el nom.`);
  if (!explicacio) problemes.push(`${fitxer}: falta la secció «## Explicació».`);

  const frequencia = camps.frequencia ?? '';
  if (!FREQUENCIES.includes(frequencia)) {
    problemes.push(`${fitxer}: freqüència «${frequencia}» desconeguda. Vàlides: ${FREQUENCIES.join(', ')}.`);
  }

  const bloc = nombre(camps, 'bloc', fitxer);
  const ordre = nombre(camps, 'ordre', fitxer);
  const sessions = rangSessions(camps.sessions ?? '', fitxer);

  // Els minuts són opcionals: hi ha recomanacions que no diuen quant dura cada
  // sessió, i inventar-ho seria pitjor que deixar-ho en blanc.
  const minutsBrut = camps.minuts ?? '';
  const minuts = minutsBrut ? nombre(camps, 'minuts', fitxer) : null;

  // La nota també és opcional: molts exercicis no en tenen.
  const nota = seccio(text, 'Nota');

  return {
    id: `e${bloc}-${ordre}`,
    bloc, ordre, nom, explicacio,
    nota: nota || null,
    recomanacio: {
      sessionsMin: sessions.min,
      sessionsMax: sessions.max,
      frequencia,
      dies: nombre(camps, 'dies', fitxer),
      minutsPerSessio: minuts,
    },
    // Les fites encara no estan definides (§9). El camp queda buit i s'omplirà
    // sense haver de tocar els fitxers dels exercicis.
    milestoneIds: [],
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
  for (const e of exercicis) {
    if (!blocs.some((b) => b.bloc === e.bloc)) {
      problemes.push(`El bloc ${e.bloc} té exercicis però no té nom a blocs.md.`);
      break;
    }
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

  // Mentre s'omple, tenir-ne menys de cinc és normal i no ha de bloquejar res.
  if (blocs.length > 0 && blocs.length < 5) {
    avisos.push(`blocs.md: ${blocs.length} de 5 blocs tenen nom.`);
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
    ' *  Escrit per la responsable del projecte com a part del marc pràctic del TR. */',
    'export const EXERCICIS: readonly Exercise[] = [',
    ...exercicis.flatMap((e) => [
      '  {',
      `    id: ${j(e.id)},`,
      `    bloc: ${e.bloc},`,
      `    ordre: ${e.ordre},`,
      `    nom: ${j(e.nom)},`,
      `    explicacio: ${j(e.explicacio)},`,
      `    nota: ${j(e.nota)},`,
      `    recomanacio: { sessionsMin: ${e.recomanacio.sessionsMin}, `
        + `sessionsMax: ${e.recomanacio.sessionsMax}, `
        + `frequencia: ${j(e.recomanacio.frequencia)}, dies: ${e.recomanacio.dies}, `
        + `minutsPerSessio: ${e.recomanacio.minutsPerSessio} },`,
      `    milestoneIds: [],`,
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
