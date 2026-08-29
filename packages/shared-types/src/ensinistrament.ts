/**
 * Catàleg d'exercicis i seguiment (§4 i §6 del CLAUDE.md).
 *
 * El catàleg d'exercicis és contingut de REFERÈNCIA: fix, curat i validat per una
 * persona a partir de fonts fiables. L'entrenadora no en crea de nous a v1. Per
 * això el model és de només lectura i no porta camps d'autoria ni d'edició.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Exercicis
// ---------------------------------------------------------------------------

/**
 * Els cinc blocs del catàleg, en ordre. Substitueixen les quatre categories que
 * el handoff de disseny dibuixava a la pantalla 6a.
 */
export const BLOCS = [1, 2, 3, 4, 5] as const;
export const blocSchema = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5),
]);
export type Bloc = z.infer<typeof blocSchema>;

/**
 * Recomanació de pràctica.
 *
 * Té dues menes perquè el contingut real en té dues. La majoria d'exercicis donen
 * una **pauta** amb xifres —«3-4 sessions diàries durant 6 dies»—, però n'hi ha
 * que no en poden donar cap: «no es recomana cap nombre concret de sessions,
 * aquesta mesura es va aprenent fins que el cadell canvia les dents». Forçar-hi
 * un número seria inventar-lo.
 *
 * A les pautes, el període també és opcional: «1 sessió diària» sense final és
 * una recomanació vàlida per a coses que es practiquen sempre.
 */
export const recomanacioSchema = z.discriminatedUnion('tipus', [
  z.object({
    tipus: z.literal('pauta'),
    /** Mínim de sessions. Amb un valor sol, coincideix amb el màxim. */
    sessionsMin: z.number().int().positive(),
    sessionsMax: z.number().int().positive(),
    /** `diaria`: les sessions són per dia. `total`: repartides pel període. */
    frequencia: z.enum(['diaria', 'total']),
    /** Durant quants dies. `null` si la pràctica no té final marcat. */
    dies: z.number().int().positive().nullable(),
    /** Durada de cada sessió, quan consta. */
    minutsPerSessio: z.number().int().positive().nullable(),
  }),
  z.object({
    tipus: z.literal('lliure'),
    /** La recomanació tal com està escrita, quan no es pot posar en xifres. */
    text: z.string().min(1),
  }),
]);

export type Recomanacio = z.infer<typeof recomanacioSchema>;

/** Text de la recomanació per a la interfície, en català. */
export function textRecomanacio(r: Recomanacio): string {
  if (r.tipus === 'lliure') return r.text;

  const unaSola = r.sessionsMax === 1;
  const quantes = r.sessionsMin === r.sessionsMax
    ? `${r.sessionsMin}`
    : `${r.sessionsMin}–${r.sessionsMax}`;
  const paraula = unaSola ? 'sessió' : 'sessions';
  // La cadència va just darrere del nom i concorda amb ell: «1 sessió diària»,
  // «3–4 sessions diàries».
  const cadencia = r.frequencia === 'diaria' ? (unaSola ? ' diària' : ' diàries') : '';
  const durada = r.minutsPerSessio ? ` de ${r.minutsPerSessio} minuts` : '';
  const periode = r.dies === null
    ? ''
    : ` durant ${r.dies} ${r.dies === 1 ? 'dia' : 'dies'}`;

  return `${quantes} ${paraula}${cadencia}${durada}${periode}`;
}

/**
 * Sessions totals que suposa la recomanació, per comparar-hi el seguiment.
 * `null` quan no es pot saber: sense xifres o sense període no hi ha total.
 */
export function sessionsTotals(r: Recomanacio): { min: number; max: number } | null {
  if (r.tipus === 'lliure') return null;
  if (r.frequencia === 'diaria' && r.dies === null) return null;

  const factor = r.frequencia === 'diaria' ? r.dies! : 1;
  return { min: r.sessionsMin * factor, max: r.sessionsMax * factor };
}

export const exerciseSchema = z.object({
  id: z.string(),
  bloc: blocSchema,
  /** Posició dins del bloc; els exercicis d'un bloc també van ordenats. */
  ordre: z.number().int().positive(),
  nom: z.string().min(1),
  /**
   * Explicació de l'exercici, en prosa i amb reforç positiu.
   *
   * No són passos numerats: el contingut real és una explicació seguida, i
   * partir-la en passos obligaria a inventar-ne una estructura que no té.
   */
  explicacio: z.string().min(1),
  /** Nota d'adaptació o alternativa, si l'exercici en porta. */
  nota: z.string().nullable(),
  recomanacio: recomanacioSchema,
  milestoneIds: z.array(z.string()),
});

export type Exercise = z.infer<typeof exerciseSchema>;

export const blocCatalegSchema = z.object({
  bloc: blocSchema,
  nom: z.string().min(1),
  descripcio: z.string(),
  exercicis: z.array(exerciseSchema),
});

export type BlocInfo = z.infer<typeof blocCatalegSchema>;

// ---------------------------------------------------------------------------
// Seguiment
// ---------------------------------------------------------------------------

export const estatGosSchema = z.enum(['ensinistrament', 'avaluacio', 'assignat']);
export type EstatGos = z.infer<typeof estatGosSchema>;

export const ETIQUETA_ESTAT_GOS: Record<EstatGos, string> = {
  'ensinistrament': 'En ensinistrament',
  'avaluacio': 'En avaluació',
  'assignat': 'Assignat',
};

export const dogSchema = z.object({
  id: z.string(),
  nom: z.string().min(1),
  /** Raça de referència, si se'n coneix. Els mestissos poden no tenir-ne. */
  breedId: z.string().nullable(),
  breedNom: z.string().nullable(),
  dataNaixement: z.string().date(),
  estat: estatGosSchema,
  familiaAcollida: z.string().nullable(),
  fotoUrl: z.string().url().nullable(),
});

export type Dog = z.infer<typeof dogSchema>;

export const estatFitaSchema = z.enum(['assolida', 'en-curs', 'no-iniciada']);
export type EstatFita = z.infer<typeof estatFitaSchema>;

export const milestoneSchema = z.object({
  id: z.string(),
  nom: z.string().min(1),
  bloc: blocSchema,
  estat: estatFitaSchema,
  /** Assajos correctes sobre assajos necessaris. */
  assajosCorrectes: z.number().int().min(0),
  assajosNecessaris: z.number().int().positive(),
  exerciseIds: z.array(z.string()),
  criteriTancament: z.string(),
  dataAssoliment: z.string().date().nullable(),
});

export type Milestone = z.infer<typeof milestoneSchema>;

export const trainingSessionSchema = z.object({
  id: z.string(),
  dogId: z.string(),
  exerciseId: z.string().nullable(),
  data: z.string().datetime(),
  duracioSegons: z.number().int().min(0),
  /** Valoració global de la sessió, d'1 a 5. */
  valoracio: z.number().int().min(1).max(5),
  repeticionsCorrectes: z.number().int().min(0),
  intentsTotals: z.number().int().min(0),
  nota: z.string(),
});

export type TrainingSession = z.infer<typeof trainingSessionSchema>;
