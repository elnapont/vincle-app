/**
 * Contingut del qüestionari de matching (pantalla `7e` i pas 2).
 *
 * Les tasques típiques de cada trastorn són text de la interfície, no dades del
 * model: no intervenen en el càlcul. Serveixen perquè qui tria el trastorn
 * reconegui de què s'està parlant. Surten del handoff de disseny.
 */

import type { Trastorn } from '@vincle/shared-types';
import { ENTORNS, TASQUES } from '@vincle/shared-types';

/** Segona línia de cada targeta de trastorn: què sol fer el gos en aquell cas. */
export const TASQUES_TIPIQUES: Record<Trastorn, string> = {
  'tea': "Ancoratge, interrupció d'estereotípies, seguretat",
  'depressio': 'Activació conductual, rutina, companyia',
  'ansietat': "Pressió profunda, alerta a l'escalada",
  'bipolar': 'Rutina de son, recordatori de medicació',
  'tept': "Cobertura d'esquena, interrupció de malsons",
  'tdah': "Rutines, contenció de l'impuls, energia continguda",
};

export type Tasca = (typeof TASQUES)[number];
export type Entorn = (typeof ENTORNS)[number];

export const ETIQUETA_TASCA: Record<Tasca, string> = {
  'ancoratge-tactil': 'Ancoratge tàctil',
  'evitar-fugues': 'Evitar fugues',
  'pressio-profunda': 'Pressió profunda',
  'interrompre-estereotipies': 'Interrompre estereotípies',
  'rutines-diaries': 'Rutines diàries',
  'cerca-localitzacio': 'Cerca i localització',
  'companyia-nocturna': 'Companyia nocturna',
};

export const ETIQUETA_ENTORN: Record<Entorn, string> = {
  'casa': 'Casa',
  'escola': 'Escola',
  'transport': 'Transport',
};

/** Màxim de tasques seleccionables, tal com fixa el disseny. */
export const MAXIM_TASQUES = 3;

/**
 * Extrems del control lliscant de pes màxim. Surten de la distribució real del
 * catàleg: la raça més lleugera en fa 2 kg i la més pesada, 79. La mediana, 22.
 */
export const PES = { minim: 2, maxim: 79, mediana: 22, defecte: 32 } as const;
