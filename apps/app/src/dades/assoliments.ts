/**
 * Exercicis donats per assolits manualment.
 *
 * El camí calcula l'assoliment comptant sessions contra la pauta, però els
 * exercicis amb pauta qualitativa no tenen cap xifra contra la qual comparar i
 * s'hi encallarien per sempre. Un assoliment manual preval sobre el recompte.
 */

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { supabase } from './supabase.ts';

const filaSchema = z.object({
  exercici_id: z.string(),
  data_assoliment: z.string(),
});

export interface Assoliment {
  exerciciId: string;
  data: Date;
}

export async function marcaAssolit(
  gosId: string,
  exerciciId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('assoliments')
    .insert({ gos_id: gosId, exercici_id: exerciciId });

  if (!error) return { error: null };
  // La restricció d'unicitat vol dir que ja hi era: no és cap error per a qui ho fa.
  if (/duplicate key/.test(error.message)) return { error: null };
  if (/row-level security/.test(error.message)) {
    return { error: 'Aquest gos no és teu.' };
  }
  return { error: error.message };
}

export async function desfesAssoliment(
  gosId: string,
  exerciciId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('assoliments')
    .delete()
    .eq('gos_id', gosId)
    .eq('exercici_id', exerciciId);

  return { error: error ? error.message : null };
}

export function useAssoliments(gosId: string | undefined): {
  assolits: Map<string, Date>;
  carregant: boolean;
  recarrega: () => void;
} {
  const [assolits, setAssolits] = useState<Map<string, Date>>(new Map());
  const [carregat, setCarregat] = useState(false);
  const [intent, setIntent] = useState(0);

  // Sense gos no hi ha res a carregar, i es deriva en comptes de posar-ho amb un
  // `setState` dins de l'efecte, que provocaria un dibuix de més.
  const carregant = Boolean(gosId) && !carregat;

  useEffect(() => {
    if (!gosId) return;
    let viu = true;

    supabase
      .from('assoliments')
      .select('exercici_id, data_assoliment')
      .eq('gos_id', gosId)
      .then(({ data, error }) => {
        if (!viu) return;
        setCarregat(true);
        if (error) return;

        const analitzat = z.array(filaSchema).safeParse(data);
        if (!analitzat.success) return;
        setAssolits(new Map(
          analitzat.data.map((f) => [f.exercici_id, new Date(f.data_assoliment)]),
        ));
      });

    return () => { viu = false; };
  }, [gosId, intent]);

  const recarrega = useCallback(() => setIntent((n) => n + 1), []);
  return { assolits, carregant, recarrega };
}
