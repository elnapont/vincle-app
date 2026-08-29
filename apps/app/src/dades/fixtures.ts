/**
 * Dades de prova del seguiment.
 *
 * **Són inventades.** Tenen la forma exacta dels tipus reals de
 * `@vincle/shared-types`, de manera que substituir-les per les dades de debò
 * —quan hi hagi gossos i sessions a Supabase— no obligarà a tocar cap component.
 *
 * Viuen aïllades en aquest fitxer a posta: mentre el catàleg d'exercicis i les
 * fites els redacta una persona, les pantalles de seguiment es poden construir i
 * revisar igualment. És el que recomana el handoff: implementar contra dades de
 * prova amb la mateixa forma i deixar la càrrega aïllada.
 *
 * Els gossos porten nom de gos i no de persona, les races són reals del catàleg i
 * les dates estan calculades respecte del dia d'avui perquè l'agenda i els
 * retards tinguin sentit sempre que s'obri l'aplicació.
 */

import type { Dog, Milestone, TrainingSession } from '@vincle/shared-types';

/** Data relativa a avui, per no haver de mantenir dates fixes que envelleixen. */
function faDies(dies: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dies);
  return d;
}

function isoData(dies: number): string {
  return faDies(dies).toISOString().slice(0, 10);
}

export const GOSSOS: Dog[] = [
  {
    id: 'g1', nom: 'Fura', breedId: '121', breedNom: 'Golden Retriever',
    dataNaixement: isoData(680), estat: 'ensinistrament',
    familiaAcollida: 'Família Roca-Puig', fotoUrl: null,
  },
  {
    id: 'g2', nom: 'Nyu', breedId: '155', breedNom: 'Labrador Retriever',
    dataNaixement: isoData(1120), estat: 'assignat',
    familiaAcollida: 'Família Serra', fotoUrl: null,
  },
  {
    id: 'g3', nom: 'Boira', breedId: '206', breedNom: 'Standard Poodle',
    dataNaixement: isoData(310), estat: 'avaluacio',
    familiaAcollida: 'Família Vidal', fotoUrl: null,
  },
  {
    id: 'g4', nom: 'Tramuntana', breedId: '18', breedNom: 'Australian Shepherd',
    dataNaixement: isoData(890), estat: 'ensinistrament',
    familiaAcollida: 'Família Camps', fotoUrl: null,
  },
  {
    id: 'g5', nom: 'Sorral', breedId: '121', breedNom: 'Golden Retriever',
    dataNaixement: isoData(430), estat: 'ensinistrament',
    familiaAcollida: null, fotoUrl: null,
  },
];

/**
 * Progrés de fites per gos. Mentre no hi hagi el llistat de fites definitiu, es
 * guarda el recompte; quan hi sigui, se substituirà per les fites de debò.
 */
export const FITES_PER_GOS: Record<string, { assolides: number; total: number }> = {
  g1: { assolides: 9, total: 14 },
  g2: { assolides: 14, total: 14 },
  g3: { assolides: 2, total: 14 },
  g4: { assolides: 11, total: 14 },
  g5: { assolides: 5, total: 14 },
};

/** Dies des de l'última sessió de cada gos. Per sobre de 7 es considera un retard. */
export const DIES_DES_DE_LA_SESSIO: Record<string, number> = {
  g1: 1, g2: 12, g3: 3, g4: 0, g5: 9,
};

export const SESSIONS: TrainingSession[] = [
  {
    id: 's1', dogId: 'g1', exerciseId: null, data: faDies(1).toISOString(),
    duracioSegons: 1500, valoracio: 4, repeticionsCorrectes: 7, intentsTotals: 10,
    nota: 'Bona resposta a la crida amb distraccions moderades.',
  },
  {
    id: 's2', dogId: 'g4', exerciseId: null, data: faDies(0).toISOString(),
    duracioSegons: 1200, valoracio: 5, repeticionsCorrectes: 9, intentsTotals: 10,
    nota: 'Ha mantingut la posició tota l\'estona al vestíbul de l\'estació.',
  },
  {
    id: 's3', dogId: 'g3', exerciseId: null, data: faDies(3).toISOString(),
    duracioSegons: 900, valoracio: 3, repeticionsCorrectes: 4, intentsTotals: 10,
    nota: 'Es distreu amb altres gossos. Repetir en entorn més tranquil.',
  },
];

/** Cites d'avui, amb l'hora en format de 24 h. */
export const AGENDA_AVUI: { hora: string; gosId: string; titol: string }[] = [
  { hora: '09:30', gosId: 'g1', titol: 'Ancoratge tàctil · sessió guiada' },
  { hora: '11:00', gosId: 'g4', titol: 'Socialització a l\'estació' },
  { hora: '16:15', gosId: 'g3', titol: 'Avaluació inicial de temperament' },
];

/** Coses que reclamen atenció, ordenades per urgència. */
export const ATENCIO: { gosId: string; motiu: string; urgent: boolean }[] = [
  { gosId: 'g2', motiu: 'Sense sessió des de fa 12 dies', urgent: true },
  { gosId: 'g5', motiu: 'Incidència de comportament oberta', urgent: true },
  { gosId: 'g3', motiu: 'Avaluació pendent de tancar', urgent: false },
];

export const FITES: Milestone[] = [
  {
    id: 'f1', nom: 'Crida fiable amb distraccions', bloc: 1, estat: 'assolida',
    assajosCorrectes: 10, assajosNecessaris: 10, exerciseIds: [],
    criteriTancament: 'Deu crides correctes seguides en tres entorns diferents.',
    dataAssoliment: isoData(21),
  },
  {
    id: 'f2', nom: 'Manteniment de la posició en públic', bloc: 2, estat: 'en-curs',
    assajosCorrectes: 7, assajosNecessaris: 10, exerciseIds: [],
    criteriTancament: 'Deu minuts quiet en un espai concorregut.',
    dataAssoliment: null,
  },
  {
    id: 'f3', nom: 'Ancoratge sota tensió', bloc: 3, estat: 'no-iniciada',
    assajosCorrectes: 0, assajosNecessaris: 10, exerciseIds: [],
    criteriTancament: 'Manté l\'ancoratge davant d\'un estímul inesperat.',
    dataAssoliment: null,
  },
];

// ---------------------------------------------------------------------------
// Càlculs derivats
// ---------------------------------------------------------------------------

/** Edat en anys i mesos, com l'ensenya la llista de gossos. */
export function edat(dataNaixement: string): string {
  const naixement = new Date(dataNaixement);
  const ara = new Date();
  const mesos = (ara.getFullYear() - naixement.getFullYear()) * 12
    + (ara.getMonth() - naixement.getMonth());
  const anys = Math.floor(mesos / 12);
  const resta = mesos % 12;

  if (anys === 0) return `${resta} mesos`;
  if (resta === 0) return anys === 1 ? '1 any' : `${anys} anys`;
  return `${anys} ${anys === 1 ? 'any' : 'anys'} i ${resta} mesos`;
}

/** Text de l'última sessió. Per sobre d'una setmana, es considera un retard. */
export function ultimaSessio(gosId: string): { text: string; retard: boolean } {
  const dies = DIES_DES_DE_LA_SESSIO[gosId] ?? 0;
  const retard = dies > 7;

  if (dies === 0) return { text: 'avui', retard };
  if (dies === 1) return { text: 'ahir', retard };
  return { text: `fa ${dies} dies`, retard };
}

export const METRIQUES = {
  gossosEnSeguiment: GOSSOS.filter((g) => g.estat === 'ensinistrament').length,
  sessionsSetmana: 12,
  fitesDelMes: 4,
  incidenciesObertes: ATENCIO.filter((a) => a.urgent).length,
};
