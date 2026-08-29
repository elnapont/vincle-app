/**
 * Progrés d'un gos pel catàleg d'exercicis.
 *
 * Respon la pregunta que es fa l'entrenadora cada dia: **per on va i què toca
 * ara**. Es calcula amb el que ja hi ha —les sessions guarden quin exercici s'ha
 * practicat i el catàleg té els blocs ordenats—, sense cap dada nova.
 *
 * No depèn de les fites, que encara no existeixen (§9). Quan hi siguin, el criteri
 * d'assoliment podrà passar a ser el seu i no el nombre de sessions.
 */

import type { Exercise } from '@vincle/shared-types';
import { sessionsTotals } from '@vincle/shared-types';
import { BLOCS_CATALEG, EXERCICIS } from './exercicis.ts';
import type { Sessio } from './sessions.ts';

export type EstatExercici = 'assolit' | 'en-curs' | 'no-iniciat';

export interface ProgresExercici {
  exercici: Exercise;
  estat: EstatExercici;
  sessionsFetes: number;
  /**
   * Sessions que recomana la pauta. `null` quan la recomanació és qualitativa o
   * no té període: llavors no es pot dir que l'exercici estigui «acabat».
   */
  sessionsRecomanades: { min: number; max: number } | null;
  /** De 0 a 1. `null` quan no hi ha res contra què mesurar. */
  fraccio: number | null;
}

export interface ProgresBloc {
  bloc: number;
  nom: string;
  exercicis: ProgresExercici[];
  assolits: number;
  encetats: number;
  total: number;
}

export interface Progres {
  blocs: ProgresBloc[];
  /** El primer exercici que no està assolit: on som del recorregut. */
  seguent: Exercise | null;
  assolits: number;
  total: number;
}

/**
 * Calcula el progrés a partir de les sessions d'un gos.
 *
 * Un exercici es considera **assolit** quan té almenys el mínim de sessions que
 * recomana la pauta. S'agafa el mínim i no el màxim perquè les pautes donen un
 * rang —«3-4 sessions diàries»— i exigir sempre el sostre faria que res no
 * s'acabés mai.
 *
 * Els exercicis amb recomanació qualitativa **no poden arribar a assolits**: no hi
 * ha cap xifra contra la qual comparar, i inventar-ne una seria pitjor que dir
 * quantes sessions porta.
 */
export function calculaProgres(sessions: readonly Sessio[]): Progres {
  const fetesPerExercici = new Map<string, number>();
  for (const s of sessions) {
    if (!s.exerciciId) continue;
    fetesPerExercici.set(s.exerciciId, (fetesPerExercici.get(s.exerciciId) ?? 0) + 1);
  }

  const blocs: ProgresBloc[] = BLOCS_CATALEG.map((b) => {
    const exercicis: ProgresExercici[] = EXERCICIS
      .filter((e) => e.bloc === b.bloc)
      .map((exercici) => {
        const fetes = fetesPerExercici.get(exercici.id) ?? 0;
        const recomanades = sessionsTotals(exercici.recomanacio);

        const estat: EstatExercici =
          fetes === 0 ? 'no-iniciat'
            : recomanades !== null && fetes >= recomanades.min ? 'assolit'
              : 'en-curs';

        return {
          exercici,
          estat,
          sessionsFetes: fetes,
          sessionsRecomanades: recomanades,
          fraccio: recomanades === null
            ? null
            : Math.min(1, fetes / recomanades.min),
        };
      });

    return {
      bloc: b.bloc,
      nom: b.nom,
      exercicis,
      assolits: exercicis.filter((e) => e.estat === 'assolit').length,
      encetats: exercicis.filter((e) => e.estat !== 'no-iniciat').length,
      total: exercicis.length,
    };
  });

  const tots = blocs.flatMap((b) => b.exercicis);

  return {
    blocs,
    // El següent és el primer que no està assolit, seguint l'ordre dels blocs i
    // dels exercicis dins de cada bloc.
    seguent: tots.find((e) => e.estat !== 'assolit')?.exercici ?? null,
    assolits: tots.filter((e) => e.estat === 'assolit').length,
    total: tots.length,
  };
}
