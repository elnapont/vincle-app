/**
 * Les seccions de Vincle: l'única llista de destinacions de navegació.
 *
 * Viu fora dels dos components de barra perquè totes dues n'han de sortir. Quan
 * cada pantalla es portava la seva còpia, sis còpies de la mateixa llista van
 * acabar com havien d'acabar: una es va desviar i «Gossos» portava a llocs
 * diferents segons d'on venies.
 *
 * L'inici hi és com una secció més encara que a web no en tingui pestanya: allà
 * hi porta la marca de la barra. A mòbil no hi ha marca, així que necessita el
 * seu lloc a la barra de pestanyes.
 */

import type { Href } from 'expo-router';

export interface SeccioNavegacio {
  etiqueta: string;
  desti: Href;
}

export const SECCIONS: SeccioNavegacio[] = [
  { etiqueta: 'Inici', desti: '/' },
  { etiqueta: 'Gossos', desti: '/gossos' },
  { etiqueta: 'Races', desti: '/races' },
  { etiqueta: 'Compatibilitats', desti: '/compatibilitats' },
  { etiqueta: 'Exercicis', desti: '/exercicis' },
];

/** Les seccions amb pestanya pròpia a la barra web, on l'inici el cobreix la marca. */
export const SECCIONS_WEB = SECCIONS.filter((s) => s.etiqueta !== 'Inici');
