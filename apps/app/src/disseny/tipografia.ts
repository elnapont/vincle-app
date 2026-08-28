/**
 * Tipografia de Vincle: tres famílies amb rols estrictes.
 *
 * - **Instrument Serif** — títols de pantalla, xifres grans, percentatges, mètriques.
 * - **Instrument Sans** — tot el text d'interfície.
 * - **JetBrains Mono** — metadades, dates curtes, pesos, comptadors, posicions del
 *   rànquing i etiquetes de secció en majúscules.
 *
 * L'escala del handoff es transcriu aquí com a estils fets. Una pantalla demana
 * `text.titolMobil`, no «serif 30px amb interlineat 1.15»: si el disseny canvia
 * una mida, es canvia en un sol lloc.
 *
 * Nota sobre React Native: `letterSpacing` va en punts i no en `em` com al CSS del
 * prototip, així que els `.08em` de les etiquetes en majúscules es tradueixen a
 * un valor absolut calculat sobre la mida de lletra.
 */

import type { TextStyle } from 'react-native';
import { color, tinta } from './tokens.ts';

export const familia = {
  serif: 'InstrumentSerif_400Regular',
  sans: 'InstrumentSans_400Regular',
  sansMitja: 'InstrumentSans_500Medium',
  sansFort: 'InstrumentSans_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMitja: 'JetBrainsMono_500Medium',
} as const;

/** `.08em` sobre la mida de lletra, que és com ho expressa el handoff. */
const espaiatMajuscules = (mida: number) => mida * 0.08;

export const text = {
  // --- Serif: xifres i títols -----------------------------------------------

  /**
   * Percentatge protagonista del rànquing mòbil. Va baixar de 128px a 88px per
   * deixar lloc a la posició i al mesurador: a 128px la xifra es llegia com un
   * veredicte, i el recorregut real només va del 41 % al 80 %.
   */
  percentatgeProtagonista: {
    fontFamily: familia.serif, fontSize: 88, lineHeight: 88 * 0.9, color: color.tinta,
  },
  /** El decimal del percentatge protagonista, que va més petit. */
  percentatgeDecimal: {
    fontFamily: familia.serif, fontSize: 40, color: color.tinta,
  },
  /** Percentatge de fitxa i de fila de resultat, a web. */
  percentatgeFitxa: {
    fontFamily: familia.serif, fontSize: 40, lineHeight: 40, color: color.tinta,
  },
  titolWeb: {
    fontFamily: familia.serif, fontSize: 34, lineHeight: 34 * 1.1, color: color.tinta,
  },
  titolMobil: {
    fontFamily: familia.serif, fontSize: 30, lineHeight: 30 * 1.15, color: color.tinta,
  },
  metrica: {
    fontFamily: familia.serif, fontSize: 34, color: color.tinta,
  },

  // --- Sans: interfície ------------------------------------------------------

  /** Nom de raça o de gos a una llista. */
  nomLlista: {
    fontFamily: familia.sansFort, fontSize: 16, color: color.tinta,
  },
  cos: {
    fontFamily: familia.sans, fontSize: 14, lineHeight: 14 * 1.5, color: color.tinta,
  },
  cosSecundari: {
    fontFamily: familia.sans, fontSize: 13.5, lineHeight: 13.5 * 1.5, color: tinta.textSecundari,
  },
  etiquetaCamp: {
    fontFamily: familia.sansMitja, fontSize: 12, color: tinta.etiqueta,
  },
  /** Encapçalament de secció: majúscules amb espaiat, en sans. */
  encapcalamentSeccio: {
    fontFamily: familia.sansFort, fontSize: 12, letterSpacing: espaiatMajuscules(12),
    textTransform: 'uppercase', color: tinta.etiqueta,
  },
  navegacio: {
    fontFamily: familia.sansMitja, fontSize: 13.5, color: tinta.textSecundari,
  },
  navegacioActiva: {
    fontFamily: familia.sansFort, fontSize: 13.5, color: color.vermell,
  },

  // --- Mono: metadades -------------------------------------------------------

  metadada: {
    fontFamily: familia.mono, fontSize: 11.5, color: tinta.metadada,
  },
  /** Posició al rànquing, comptadors i pesos. */
  metadadaFort: {
    fontFamily: familia.monoMitja, fontSize: 11.5, color: tinta.metadada,
  },
  /**
   * Etiqueta mono d'escala dins de barres. És la mida mínima de tot el producte:
   * 10px, i només per a això.
   */
  escalaBarra: {
    fontFamily: familia.monoMitja, fontSize: 10, letterSpacing: espaiatMajuscules(10),
    color: tinta.metadada,
  },
} as const satisfies Record<string, TextStyle>;
