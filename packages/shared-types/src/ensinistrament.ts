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

export const dificultatSchema = z.enum(['inicial', 'intermedia', 'avancada']);
export type Dificultat = z.infer<typeof dificultatSchema>;

export const ETIQUETA_DIFICULTAT: Record<Dificultat, string> = {
  'inicial': 'Inicial',
  'intermedia': 'Intermèdia',
  'avancada': 'Avançada',
};

/**
 * Recomanació de pràctica, del tipus «15 sessions de 20 minuts durant 3 dies».
 *
 * Es guarda descomposta i no com a text lliure perquè el seguiment hi pugui
 * comparar el que s'ha fet de debò: quantes sessions porta el gos, quants minuts
 * i en quants dies.
 */
export const recomanacioSchema = z.object({
  sessions: z.number().int().positive(),
  minutsPerSessio: z.number().int().positive(),
  dies: z.number().int().positive(),
});

export type Recomanacio = z.infer<typeof recomanacioSchema>;

/** Text de la recomanació per a la interfície, en català. */
export function textRecomanacio(r: Recomanacio): string {
  const sessions = `${r.sessions} ${r.sessions === 1 ? 'sessió' : 'sessions'}`;
  const dies = `${r.dies} ${r.dies === 1 ? 'dia' : 'dies'}`;
  return `${sessions} de ${r.minutsPerSessio} minuts durant ${dies}`;
}

/** Un pas de l'exercici, sempre amb reforç positiu (§6.1). */
export const pasSchema = z.object({
  ordre: z.number().int().positive(),
  titol: z.string().min(1),
  descripcio: z.string().min(1),
});

export const exerciseSchema = z.object({
  id: z.string(),
  bloc: blocSchema,
  /** Posició dins del bloc; els exercicis d'un bloc també van ordenats. */
  ordre: z.number().int().positive(),
  nom: z.string().min(1),
  dificultat: dificultatSchema,
  /** Què es vol aconseguir amb l'exercici. */
  objectiu: z.string().min(1),
  /** L'explicació desenvolupada, amb els passos de reforç positiu. */
  passos: z.array(pasSchema).min(1),
  /** Com se sap que el gos l'ha assolit. */
  criteriAssoliment: z.string().min(1),
  recomanacio: recomanacioSchema,
  milestoneIds: z.array(z.string()),
  /**
   * Font del contingut. El §6.1 exigeix que l'ensinistrament el curi i el validi
   * una persona i que la font quedi documentada; per això no és opcional.
   */
  font: z.string().min(1),
});

export type Pas = z.infer<typeof pasSchema>;
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
