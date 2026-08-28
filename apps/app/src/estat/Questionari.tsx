/**
 * Estat del qüestionari de matching.
 *
 * Viu en un context i no a la URL perquè el flux són tres passos d'una mateixa
 * decisió: si l'usuari torna enrere al pas 1, ha de retrobar el que ja havia
 * triat al pas 2. El `MatchProfile` només es dona per bo quan es valida amb Zod
 * en sortir del qüestionari, que és la frontera on el §7 demana validació.
 */

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { MatchProfile, Trastorn } from '@vincle/shared-types';
import { matchProfileSchema } from '@vincle/shared-types';
import { MAXIM_TASQUES, PES, type Entorn, type Tasca } from '../dades/questionari.ts';

interface EstatQuestionari {
  trastorn: Trastorn | null;
  tasques: Tasca[];
  entorns: Entorn[];
  pesMaximKg: number;

  triaTrastorn: (t: Trastorn) => void;
  commutaTasca: (t: Tasca) => void;
  commutaEntorn: (e: Entorn) => void;
  posaPesMaxim: (kg: number) => void;
  reinicia: () => void;

  /** `null` mentre el qüestionari no estigui prou complet per calcular res. */
  perfil: MatchProfile | null;
}

const Context = createContext<EstatQuestionari | null>(null);

export function ProveidorQuestionari({ children }: { children: ReactNode }) {
  const [trastorn, setTrastorn] = useState<Trastorn | null>(null);
  const [tasques, setTasques] = useState<Tasca[]>([]);
  const [entorns, setEntorns] = useState<Entorn[]>([]);
  const [pesMaximKg, setPesMaximKg] = useState<number>(PES.defecte);

  const valor = useMemo<EstatQuestionari>(() => {
    /** Afegeix o treu un element d'una llista de selecció múltiple. */
    const commuta = <T,>(llista: T[], element: T, maxim?: number): T[] => {
      if (llista.includes(element)) return llista.filter((x) => x !== element);
      // Amb límit, arribat al màxim la tria deixa d'afegir en comptes de fer fora
      // el més antic: és menys sorprenent per a qui la fa.
      if (maxim !== undefined && llista.length >= maxim) return llista;
      return [...llista, element];
    };

    // El perfil només és vàlid amb trastorn triat, que és el punt de partida
    // obligatori del matching (§5).
    const candidat = { trastorn, tasques, entorns, pesMaximKg };
    const validat = trastorn === null ? null : matchProfileSchema.safeParse(candidat);

    return {
      trastorn, tasques, entorns, pesMaximKg,
      triaTrastorn: setTrastorn,
      commutaTasca: (t) => setTasques((prev) => commuta(prev, t, MAXIM_TASQUES)),
      commutaEntorn: (e) => setEntorns((prev) => commuta(prev, e)),
      posaPesMaxim: setPesMaximKg,
      reinicia: () => {
        setTrastorn(null); setTasques([]); setEntorns([]); setPesMaximKg(PES.defecte);
      },
      perfil: validat?.success ? validat.data : null,
    };
  }, [trastorn, tasques, entorns, pesMaximKg]);

  return <Context.Provider value={valor}>{children}</Context.Provider>;
}

export function useQuestionari(): EstatQuestionari {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useQuestionari s\'ha de fer servir dins de ProveidorQuestionari.');
  }
  return context;
}
