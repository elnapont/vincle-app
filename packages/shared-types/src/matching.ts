/**
 * Model intern de raça i tipus del matching (§5.2 i §5.2.3 del CLAUDE.md).
 *
 * `Breed` és el model PROPI del projecte, no el de The Dog API. La capa d'API
 * normalitza la resposta externa cap aquí, de manera que si canvia el tier o
 * l'API només s'ha de tocar la traducció i no la lògica de matching (§2.2).
 */

import { z } from 'zod';
import { eixSchema, eixTemperamentSchema, trastornSchema } from './eixos.ts';

// ---------------------------------------------------------------------------
// Raça
// ---------------------------------------------------------------------------

export const breedSchema = z.object({
  id: z.string(),
  nom: z.string(),
  /** Termes de `temperament` normalitzats a minúscules, tal com arriben de l'API. */
  termes: z.array(z.string()),
  /** Grup canònic, ja normalitzat des dels 27 valors bruts de `breed_group`. */
  grup: z.string().nullable(),
  /** Pes mitjà adult en kg. Base del filtre de pes màxim (§5.2.4). */
  pesKg: z.number().positive().nullable(),
  /** Esperança de vida mitjana en anys. Base de l'eix de longevitat (§5.2.5). */
  anysVida: z.number().positive().nullable(),
  alcadaCm: z.number().positive().nullable(),
  descripcio: z.string().nullable(),
  historia: z.string().nullable(),
  origen: z.string().nullable(),
  imatgeUrl: z.string().url().nullable(),
});

export type Breed = z.infer<typeof breedSchema>;

// ---------------------------------------------------------------------------
// Eixos derivats
// ---------------------------------------------------------------------------

/**
 * Valor d'un eix per a una raça.
 *
 * `valor` és `null` quan cap terme del temperament de la raça cau en aquest eix.
 * Això NO és el mateix que un 5: la interfície ha de dibuixar l'absència com a
 * absència (patró «sense dades» de la pantalla 7a del handoff). El motor, per
 * puntuar, hi fa servir el neutre internament, però el que surt cap a fora és
 * `null` perquè la pantalla pugui distingir-ho.
 */
export const eixDerivatSchema = z.object({
  eix: eixSchema,
  valor: z.number().min(0).max(10).nullable(),
  /** Termes que han contribuït al valor. Buit si no se n'ha derivat cap. */
  termes: z.array(z.string()),
});

export type EixDerivat = z.infer<typeof eixDerivatSchema>;

// ---------------------------------------------------------------------------
// Perfils de pesos
// ---------------------------------------------------------------------------

/**
 * Direcció d'un eix dins d'un perfil. És binària a posta: amb valors derivats
 * d'un diccionari de 49 termes, graduar un ideal de 0 a 10 seria precisió falsa
 * (§5.2.3).
 */
export const direccioSchema = z.enum(['suma', 'resta']);
export type Direccio = z.infer<typeof direccioSchema>;

export const pesEixSchema = z.object({
  eix: eixTemperamentSchema,
  /** 0–100. Els set eixos d'un mateix trastorn sumen 100 entre ells. */
  pes: z.number().min(0).max(100),
  direccio: direccioSchema,
});

export const perfilTrastornSchema = z.object({
  trastorn: trastornSchema,
  eixos: z.array(pesEixSchema).length(7),
});

export type PesEix = z.infer<typeof pesEixSchema>;
export type PerfilTrastorn = z.infer<typeof perfilTrastornSchema>;

// ---------------------------------------------------------------------------
// Resultat
// ---------------------------------------------------------------------------

/** Contribució d'un eix al resultat, per poder explicar la puntuació. */
export const contribucioSchema = z.object({
  eix: eixSchema,
  valor: z.number().min(0).max(10).nullable(),
  pes: z.number(),
  direccio: direccioSchema,
  /** Punts que aquest eix aporta al percentatge final. */
  aportacio: z.number(),
});

export const matchResultSchema = z.object({
  breedId: z.string(),
  nom: z.string(),
  /** Compatibilitat 0–100. A la pràctica el recorregut real és d'uns 41 a 80. */
  puntuacio: z.number().min(0).max(100),
  /** Posició dins del rànquing complet, d'1 endavant. */
  posicio: z.number().int().positive(),
  totalAvaluades: z.number().int().positive(),
  eixos: z.array(eixDerivatSchema),
  contribucions: z.array(contribucioSchema),
  /** Quants eixos han quedat sense dades. Es mostra a la fila de resultat. */
  eixosSenseDades: z.number().int().min(0),
  /** Motiu pel qual la raça baixa al final del rànquing, si és el cas. */
  penalitzacio: z.string().nullable(),
});

export type Contribucio = z.infer<typeof contribucioSchema>;
export type MatchResult = z.infer<typeof matchResultSchema>;

// ---------------------------------------------------------------------------
// Entrada del qüestionari
// ---------------------------------------------------------------------------

export const TASQUES = [
  'ancoratge-tactil',
  'evitar-fugues',
  'pressio-profunda',
  'interrompre-estereotipies',
  'rutines-diaries',
  'cerca-localitzacio',
  'companyia-nocturna',
] as const;

export const ENTORNS = ['casa', 'escola', 'transport'] as const;

/**
 * El que recull el qüestionari de matching (pantalla 7e i següents). El trastorn
 * és l'únic camp obligatori: és el punt de partida del matching (§5).
 */
export const matchProfileSchema = z.object({
  trastorn: trastornSchema,
  /** Màxim tres tasques, tal com fixa el disseny. */
  tasques: z.array(z.enum(TASQUES)).max(3),
  entorns: z.array(z.enum(ENTORNS)),
  /**
   * Filtre de pes màxim en kg. Les races que el superen no desapareixen: baixen
   * al final amb el motiu visible (§5.2.4).
   */
  pesMaximKg: z.number().positive().nullable(),
});

export type MatchProfile = z.infer<typeof matchProfileSchema>;

// ---------------------------------------------------------------------------
// Grups de raça
// ---------------------------------------------------------------------------

/**
 * Etiquetes en català dels grups canònics.
 *
 * El camp `breed_group` de The Dog API arriba amb 27 valors bruts on conviuen
 * sinònims del mateix grup; la capa d'API els redueix a aquests onze codis. Les
 * etiquetes segueixen la terminologia fixada a `docs/diccionari/traduccions-ca.csv`.
 */
export const ETIQUETA_GRUP: Readonly<Record<string, string>> = {
  'sabues': 'Coniller',
  'llebrer': 'Llebrer',
  'treball': 'Treball',
  'pastor': 'Pastor',
  'mostra-cobrament': 'Mostra i cobrament',
  'terrier': 'Terrier',
  'miniatura': 'Miniatura',
  'companyia': 'Companyia',
  'no-esportiu': 'No esportiu',
  'spitz-primitiu': 'Spitz i tipus primitius',
  'mestis': 'Mestís',
  'sense-classificar': 'Sense classificar',
};

/** Nom llegible d'un grup; si no el coneixem, es mostra el codi tal qual. */
export function etiquetaGrup(grup: string | null): string {
  if (!grup) return 'Sense classificar';
  return ETIQUETA_GRUP[grup] ?? grup;
}
