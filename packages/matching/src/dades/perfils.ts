// GENERAT AUTOMÀTICAMENT des de docs/diccionari — no editar a mà.
// Torna a generar-ho amb: npm run dades:genera

import type { PerfilTrastorn } from '@vincle/shared-types';

/** Pesos i direccions per trastorn. Font: docs/diccionari/perfils-trastorns.csv */
export const PERFILS: readonly PerfilTrastorn[] = [
  {
    trastorn: "tea",
    eixos: [
      { eix: "entrenabilitat", pes: 10, direccio: "suma" },
      { eix: "energia", pes: 12, direccio: "suma" },
      { eix: "calma", pes: 15, direccio: "suma" },
      { eix: "sociabilitat", pes: 25, direccio: "suma" },
      { eix: "orientacio-persona", pes: 20, direccio: "suma" },
      { eix: "alerta", pes: 10, direccio: "resta" },
      { eix: "tolerancia-entorns", pes: 8, direccio: "suma" },
    ],
  },
  {
    trastorn: "depressio",
    eixos: [
      { eix: "entrenabilitat", pes: 10, direccio: "suma" },
      { eix: "energia", pes: 20, direccio: "suma" },
      { eix: "calma", pes: 10, direccio: "suma" },
      { eix: "sociabilitat", pes: 25, direccio: "suma" },
      { eix: "orientacio-persona", pes: 15, direccio: "suma" },
      { eix: "alerta", pes: 10, direccio: "resta" },
      { eix: "tolerancia-entorns", pes: 10, direccio: "suma" },
    ],
  },
  {
    trastorn: "ansietat",
    eixos: [
      { eix: "entrenabilitat", pes: 10, direccio: "suma" },
      { eix: "energia", pes: 5, direccio: "suma" },
      { eix: "calma", pes: 40, direccio: "suma" },
      { eix: "sociabilitat", pes: 14, direccio: "suma" },
      { eix: "orientacio-persona", pes: 13, direccio: "suma" },
      { eix: "alerta", pes: 10, direccio: "resta" },
      { eix: "tolerancia-entorns", pes: 8, direccio: "suma" },
    ],
  },
  {
    trastorn: "bipolar",
    eixos: [
      { eix: "entrenabilitat", pes: 10, direccio: "suma" },
      { eix: "energia", pes: 20, direccio: "suma" },
      { eix: "calma", pes: 20, direccio: "suma" },
      { eix: "sociabilitat", pes: 15, direccio: "suma" },
      { eix: "orientacio-persona", pes: 10, direccio: "suma" },
      { eix: "alerta", pes: 10, direccio: "resta" },
      { eix: "tolerancia-entorns", pes: 15, direccio: "suma" },
    ],
  },
  {
    trastorn: "tept",
    eixos: [
      { eix: "entrenabilitat", pes: 10, direccio: "suma" },
      { eix: "energia", pes: 5, direccio: "suma" },
      { eix: "calma", pes: 30, direccio: "suma" },
      { eix: "sociabilitat", pes: 20, direccio: "suma" },
      { eix: "orientacio-persona", pes: 10, direccio: "suma" },
      { eix: "alerta", pes: 15, direccio: "resta" },
      { eix: "tolerancia-entorns", pes: 10, direccio: "suma" },
    ],
  },
  {
    trastorn: "tdah",
    eixos: [
      { eix: "entrenabilitat", pes: 10, direccio: "suma" },
      { eix: "energia", pes: 20, direccio: "suma" },
      { eix: "calma", pes: 20, direccio: "suma" },
      { eix: "sociabilitat", pes: 15, direccio: "suma" },
      { eix: "orientacio-persona", pes: 15, direccio: "suma" },
      { eix: "alerta", pes: 10, direccio: "resta" },
      { eix: "tolerancia-entorns", pes: 10, direccio: "suma" },
    ],
  },
];
