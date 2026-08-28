/**
 * Eixos de temperament i trastorns coberts (§5.0 i §5.2.2 del CLAUDE.md).
 *
 * Aquests dos conjunts són tancats i estan al centre de tot el matching: el
 * diccionari tradueix termes a eixos, i els perfils diuen quant pesa cada eix per
 * a cada trastorn.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Eixos
// ---------------------------------------------------------------------------

/**
 * Els set eixos que es deriven del camp `temperament` de The Dog API a través
 * del diccionari de traducció.
 *
 * `reactivitat` i `manteniment` es van retirar perquè cap terme del vocabulari de
 * l'API hi queia: totes les races hi sortien al valor neutre i no ordenaven res.
 */
export const EIXOS_TEMPERAMENT = [
  'entrenabilitat',
  'energia',
  'calma',
  'sociabilitat',
  'orientacio-persona',
  'alerta',
  'tolerancia-entorns',
] as const;

/**
 * La longevitat NO es deriva del diccionari: es calcula de `life_span`. Té un pes
 * fix del 10 % igual a tots els perfils, perquè no depèn del trastorn (§5.2.5).
 */
export const EIX_LONGEVITAT = 'longevitat' as const;

/** Tots els eixos que entren a la puntuació. */
export const EIXOS = [...EIXOS_TEMPERAMENT, EIX_LONGEVITAT] as const;

export const eixTemperamentSchema = z.enum(EIXOS_TEMPERAMENT);
export const eixSchema = z.enum(EIXOS);

export type EixTemperament = z.infer<typeof eixTemperamentSchema>;
export type Eix = z.infer<typeof eixSchema>;

/** Etiquetes per a la interfície, en català (§1). */
export const ETIQUETA_EIX: Record<Eix, string> = {
  'entrenabilitat': 'Entrenabilitat',
  'energia': 'Energia',
  'calma': 'Calma',
  'sociabilitat': 'Sociabilitat',
  'orientacio-persona': 'Orientació a la persona',
  'alerta': 'Alerta',
  'tolerancia-entorns': 'Tolerància a entorns',
  'longevitat': 'Longevitat',
};

// ---------------------------------------------------------------------------
// Trastorns
// ---------------------------------------------------------------------------

/**
 * Els sis trastorns coberts a v1. El TOC formava part de la llista inicial de set
 * i es va retirar per manca de vinculació documentada amb l'assistència amb
 * gossos (§5.0).
 */
export const TRASTORNS = [
  'tea',
  'depressio',
  'ansietat',
  'bipolar',
  'tept',
  'tdah',
] as const;

export const trastornSchema = z.enum(TRASTORNS);
export type Trastorn = z.infer<typeof trastornSchema>;

export const ETIQUETA_TRASTORN: Record<Trastorn, string> = {
  'tea': "Trastorn de l'espectre autista",
  'depressio': 'Depressió',
  'ansietat': "Trastorns d'ansietat",
  'bipolar': 'Trastorn bipolar',
  'tept': "Trastorn d'estrès posttraumàtic",
  'tdah': "Trastorn de dèficit d'atenció amb hiperactivitat",
};

/** Forma curta per als xips i els selectors, on no hi cap el nom sencer. */
export const ETIQUETA_TRASTORN_CURTA: Record<Trastorn, string> = {
  'tea': 'TEA',
  'depressio': 'Depressió',
  'ansietat': 'Ansietat',
  'bipolar': 'Bipolar',
  'tept': 'TEPT',
  'tdah': 'TDAH',
};
