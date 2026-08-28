/**
 * Accés al catàleg de races.
 *
 * Sempre a través de la capa d'API pròpia, mai directament a The Dog API (§3 del
 * CLAUDE.md). El client no coneix ni el token ni la forma de l'API externa: rep
 * `Breed` ja normalitzat.
 */

import { breedSchema, type Breed } from '@vincle/shared-types';
import { z } from 'zod';

/**
 * En desenvolupament, l'stack local de Supabase sempre aixeca als mateixos ports
 * i amb la mateixa clau anònima de demostració: no és cap secret, és pública i
 * idèntica a totes les instal·lacions. Per això hi ha valors per defecte, perquè
 * qui es baixi el repositori només hagi de fer `supabase start`.
 */
const URL_BASE = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const CLAU_ANONIMA = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/**
 * El que respon la funció. `esCopiaCache` és el senyal que dispara la banda
 * d'avís de `5c`: vol dir que l'API externa ha fallat i el que es mostra és
 * l'última còpia guardada.
 */
const respostaSchema = z.object({
  races: z.array(breedSchema),
  total: z.number().int(),
  actualitzatEl: z.string(),
  esCopiaCache: z.boolean(),
});

export interface CatalegRaces {
  races: Breed[];
  total: number;
  actualitzatEl: Date;
  esCopiaCache: boolean;
}

export async function carregaCataleg(opcions?: { refresca?: boolean }): Promise<CatalegRaces> {
  const url = new URL(`${URL_BASE}/functions/v1/races`);
  if (opcions?.refresca) url.searchParams.set('refresca', '1');

  const resposta = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLAU_ANONIMA}`,
      'Content-Type': 'application/json',
    },
  });

  if (!resposta.ok) {
    throw new Error(`La capa d'API ha respost ${resposta.status}.`);
  }

  // Tota entrada externa es valida amb Zod (§7). Si la funció canviés de forma,
  // val més saber-ho aquí que veure-ho petar dins d'una pantalla.
  const dades = respostaSchema.parse(await resposta.json());

  return {
    races: dades.races,
    total: dades.total,
    actualitzatEl: new Date(dades.actualitzatEl),
    esCopiaCache: dades.esCopiaCache,
  };
}
