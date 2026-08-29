/**
 * Accés als gossos en seguiment.
 *
 * A diferència del catàleg de races, que és públic i passa per la capa d'API,
 * els gossos són dades pròpies de l'entrenador i es llegeixen directament de
 * Supabase amb la sessió de l'usuari. Les polítiques d'accés de la base de dades
 * són les que garanteixen que ningú no vegi els gossos d'un altre: l'aplicació no
 * hi ha de posar cap filtre, i si l'hi posés seria una comoditat, no seguretat.
 */

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import type { Dog } from '@vincle/shared-types';
import { estatGosSchema } from '@vincle/shared-types';
import { supabase } from './supabase.ts';

/** Forma de la fila tal com arriba de Postgres, amb els noms de columna en snake_case. */
const filaSchema = z.object({
  id: z.string(),
  nom: z.string(),
  breed_id: z.string().nullable(),
  breed_nom: z.string().nullable(),
  data_naixement: z.string(),
  estat: estatGosSchema,
  familia_acollida: z.string().nullable(),
  foto_url: z.string().nullable(),
});

function aDog(fila: z.infer<typeof filaSchema>): Dog {
  return {
    id: fila.id,
    nom: fila.nom,
    breedId: fila.breed_id,
    breedNom: fila.breed_nom,
    dataNaixement: fila.data_naixement,
    estat: fila.estat,
    familiaAcollida: fila.familia_acollida,
    fotoUrl: fila.foto_url,
  };
}

export interface GosNou {
  nom: string;
  breedId: string | null;
  breedNom: string | null;
  dataNaixement: string;
  estat: Dog['estat'];
  familiaAcollida: string | null;
}

export async function creaGos(gos: GosNou): Promise<{ error: string | null }> {
  const { error } = await supabase.from('gossos').insert({
    nom: gos.nom.trim(),
    breed_id: gos.breedId,
    breed_nom: gos.breedNom,
    data_naixement: gos.dataNaixement,
    estat: gos.estat,
    familia_acollida: gos.familiaAcollida?.trim() || null,
  });

  if (!error) return { error: null };

  // Els errors de restricció de la base de dades no són per llegir-los tal qual.
  if (/data_naixement_check/.test(error.message)) {
    return { error: 'La data de naixement no pot ser al futur.' };
  }
  if (/row-level security/.test(error.message)) {
    return { error: 'Cal haver entrat per afegir un gos.' };
  }
  return { error: error.message };
}

export type EstatGossos =
  | { fase: 'carregant' }
  | { fase: 'llest'; gossos: Dog[] }
  | { fase: 'error'; missatge: string };

export function useGossos(): { estat: EstatGossos; recarrega: () => void } {
  const [estat, setEstat] = useState<EstatGossos>({ fase: 'carregant' });
  const [intent, setIntent] = useState(0);

  useEffect(() => {
    let viu = true;
    setEstat({ fase: 'carregant' });

    supabase
      .from('gossos')
      .select('id, nom, breed_id, breed_nom, data_naixement, estat, familia_acollida, foto_url')
      .order('creat_el', { ascending: true })
      .then(({ data, error }) => {
        if (!viu) return;
        if (error) { setEstat({ fase: 'error', missatge: error.message }); return; }

        const analitzat = z.array(filaSchema).safeParse(data);
        if (!analitzat.success) {
          setEstat({ fase: 'error', missatge: 'Les dades dels gossos no tenen la forma esperada.' });
          return;
        }
        setEstat({ fase: 'llest', gossos: analitzat.data.map(aDog) });
      });

    return () => { viu = false; };
  }, [intent]);

  const recarrega = useCallback(() => setIntent((n) => n + 1), []);
  return { estat, recarrega };
}
