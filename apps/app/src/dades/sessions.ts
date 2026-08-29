/**
 * Sessions d'ensinistrament.
 *
 * Tanca el bucle del §6: consultar l'exercici, practicar-lo i registrar-lo. Com
 * els gossos, són dades pròpies de l'entrenador i les polítiques de la base de
 * dades garanteixen l'aïllament.
 */

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { supabase } from './supabase.ts';

const filaSchema = z.object({
  id: z.string(),
  gos_id: z.string(),
  exercici_id: z.string().nullable(),
  exercici_nom: z.string().nullable(),
  data: z.string(),
  duracio_segons: z.number().int(),
  valoracio: z.number().int().nullable(),
  repeticions_correctes: z.number().int(),
  intents_totals: z.number().int(),
  nota: z.string(),
});

export interface Sessio {
  id: string;
  gosId: string;
  exerciciId: string | null;
  exerciciNom: string | null;
  data: Date;
  duracioSegons: number;
  valoracio: number | null;
  repeticionsCorrectes: number;
  intentsTotals: number;
  nota: string;
}

function aSessio(f: z.infer<typeof filaSchema>): Sessio {
  return {
    id: f.id,
    gosId: f.gos_id,
    exerciciId: f.exercici_id,
    exerciciNom: f.exercici_nom,
    data: new Date(f.data),
    duracioSegons: f.duracio_segons,
    valoracio: f.valoracio,
    repeticionsCorrectes: f.repeticions_correctes,
    intentsTotals: f.intents_totals,
    nota: f.nota,
  };
}

export interface SessioNova {
  gosId: string;
  exerciciId: string | null;
  exerciciNom: string | null;
  duracioSegons: number;
  valoracio: number | null;
  repeticionsCorrectes: number;
  intentsTotals: number;
  nota: string;
}

export async function registraSessio(s: SessioNova): Promise<{ error: string | null }> {
  const { error } = await supabase.from('sessions').insert({
    gos_id: s.gosId,
    exercici_id: s.exerciciId,
    exercici_nom: s.exerciciNom,
    duracio_segons: s.duracioSegons,
    valoracio: s.valoracio,
    repeticions_correctes: s.repeticionsCorrectes,
    intents_totals: s.intentsTotals,
    nota: s.nota.trim(),
  });

  if (!error) return { error: null };

  // Els errors de restricció no són per llegir-los tal qual.
  if (/repeticions_coherents/.test(error.message)) {
    return { error: 'No pot haver-hi més repeticions correctes que intents.' };
  }
  if (/row-level security/.test(error.message)) {
    return { error: 'Aquest gos no és teu, o la sessió ha caducat.' };
  }
  return { error: error.message };
}

export type EstatSessions =
  | { fase: 'carregant' }
  | { fase: 'llest'; sessions: Sessio[] }
  | { fase: 'error'; missatge: string };

/** Sessions de l'entrenador, de la més recent a la més antiga. */
export function useSessions(gosId?: string): { estat: EstatSessions; recarrega: () => void } {
  const [estat, setEstat] = useState<EstatSessions>({ fase: 'carregant' });
  const [intent, setIntent] = useState(0);

  useEffect(() => {
    let viu = true;

    let consulta = supabase
      .from('sessions')
      .select('id, gos_id, exercici_id, exercici_nom, data, duracio_segons, valoracio, '
        + 'repeticions_correctes, intents_totals, nota')
      .order('data', { ascending: false });

    if (gosId) consulta = consulta.eq('gos_id', gosId);

    consulta.then(({ data, error }) => {
      if (!viu) return;
      if (error) { setEstat({ fase: 'error', missatge: error.message }); return; }

      const analitzat = z.array(filaSchema).safeParse(data);
      if (!analitzat.success) {
        setEstat({ fase: 'error', missatge: 'Les dades de les sessions no tenen la forma esperada.' });
        return;
      }
      setEstat({ fase: 'llest', sessions: analitzat.data.map(aSessio) });
    });

    return () => { viu = false; };
  }, [intent, gosId]);

  const recarrega = useCallback(() => {
    setEstat({ fase: 'carregant' });
    setIntent((n) => n + 1);
  }, []);

  return { estat, recarrega };
}

// ---------------------------------------------------------------------------

/** Durada en format de cronòmetre: `12:05`. */
export function formataDurada(segons: number): string {
  const m = Math.floor(segons / 60);
  const s = segons % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Text relatiu de la data d'una sessió.
 *
 * L'instant de referència es passa des de fora perquè el dibuix sigui pur: si es
 * llegís el rellotge aquí, el text podria canviar entre dos dibuixos sense que
 * hagués canviat cap dada.
 */
export function quanVaSer(data: Date, ara: number): string {
  const dies = diesDes(data, ara);
  if (dies <= 0) return 'avui';
  if (dies === 1) return 'ahir';
  if (dies < 7) return `fa ${dies} dies`;
  return data.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' });
}

/** Dies sencers entre una data i l'instant de referència. */
export function diesDes(data: Date, ara: number): number {
  return Math.floor((ara - data.getTime()) / 86400000);
}

/** A partir d'una setmana sense sessió es considera un retard. */
export const DIES_DE_RETARD = 7;
