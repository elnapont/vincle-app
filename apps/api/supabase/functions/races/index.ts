/**
 * Funció `races` — proxy amb cache de The Dog API.
 *
 * El client no crida mai l'API pública directament (§3 del CLAUDE.md). Hi va
 * sempre per aquí, per tres motius:
 *
 *   1. **El token no ha de sortir del servidor.** Si el client cridés l'API, la
 *      clau viatjaria a cada navegador que obrís l'aplicació.
 *   2. **Normalització.** El que surt d'aquí és el model intern `Breed`, no la
 *      forma de The Dog API. Si l'API canvia, es toca `normalitza.ts` i prou.
 *   3. **Disponibilitat.** Si la crida externa falla, es respon amb l'última
 *      còpia i la seva data. Això és el que dibuixa l'estat d'error de `5c`, on
 *      el contingut cachejat es veu atenuat amb la marca temporal. Mai una
 *      pantalla d'error buida.
 *
 * Corre sobre Deno, que és el que fan servir les Edge Functions de Supabase. En
 * desenvolupament corre dins d'un contenidor Docker que aixeca `supabase start`,
 * i el mateix codi es pot desplegar auto-allotjat amb la imatge
 * `supabase/edge-runtime`.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { normalitza, type Breed } from './normalitza.ts';

const API = 'https://api.thedogapi.com/v1/breeds';
/** L'API talla a 500 resultats per pàgina i el catàleg en té 631: cal paginar. */
const MIDA_PAGINA = 500;

/** Quant de temps es considera fresca la còpia abans de tornar a demanar-la. */
const FRESCOR_HORES = 24;

interface Resposta {
  races: Breed[];
  total: number;
  /** Data de la còpia que s'està servint. */
  actualitzatEl: string;
  /**
   * `true` quan la crida externa ha fallat i es respon amb la còpia guardada.
   * La interfície ho fa servir per ensenyar la banda d'avís de `5c`.
   */
  esCopiaCache: boolean;
}

const capçaleres = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Descarrega el catàleg sencer de The Dog API, paginant fins al final. */
async function descarrega(token: string): Promise<Breed[]> {
  const totes: Breed[] = [];

  for (let pagina = 0; ; pagina += 1) {
    const resposta = await fetch(`${API}?limit=${MIDA_PAGINA}&page=${pagina}`, {
      headers: { 'x-api-key': token },
    });
    if (!resposta.ok) {
      throw new Error(`The Dog API ha respost ${resposta.status} ${resposta.statusText}`);
    }

    const bloc = await resposta.json() as unknown[];
    for (const externa of bloc) {
      const raça = normalitza(externa as Parameters<typeof normalitza>[0]);
      // Les races sense identificador o sense nom es descarten en silenci: no hi
      // ha res a fer-hi i no val la pena tombar tota la resposta per una.
      if (raça) totes.push(raça);
    }

    if (bloc.length < MIDA_PAGINA) break;
  }

  return totes;
}

Deno.serve(async (peticio) => {
  if (peticio.method === 'OPTIONS') return new Response('ok', { headers: capçaleres });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    // La clau de servei salta les polítiques RLS, que és el que cal per escriure
    // a la cache. No surt mai d'aquesta funció.
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Es llegeix la còpia abans de res: serveix tant per estalviar la crida externa
  // com per tenir una reserva si aquesta falla.
  const { data: copia } = await supabase
    .from('cataleg_races')
    .select('races, total, actualitzat_el')
    .eq('id', 'races')
    .maybeSingle();

  const edatHores = copia
    ? (Date.now() - new Date(copia.actualitzat_el).getTime()) / 36e5
    : Infinity;
  const forcaRefresc = new URL(peticio.url).searchParams.get('refresca') === '1';

  if (copia && edatHores < FRESCOR_HORES && !forcaRefresc) {
    return Response.json({
      races: copia.races,
      total: copia.total,
      actualitzatEl: copia.actualitzat_el,
      esCopiaCache: false,
    } satisfies Resposta, { headers: capçaleres });
  }

  const token = Deno.env.get('DOG_API_KEY');
  if (!token && !copia) {
    return Response.json(
      { error: 'Falta DOG_API_KEY i no hi ha cap còpia del catàleg.' },
      { status: 500, headers: capçaleres },
    );
  }

  try {
    if (!token) throw new Error('Falta DOG_API_KEY');

    const races = await descarrega(token);
    const ara = new Date().toISOString();

    await supabase.from('cataleg_races').upsert({
      id: 'races', races, total: races.length, actualitzat_el: ara,
    });

    return Response.json({
      races, total: races.length, actualitzatEl: ara, esCopiaCache: false,
    } satisfies Resposta, { headers: capçaleres });
  } catch (error) {
    // Si hi ha còpia, es respon amb ella: val més el catàleg d'ahir que un error.
    if (copia) {
      console.error('The Dog API ha fallat; se serveix la còpia guardada.', error);
      return Response.json({
        races: copia.races,
        total: copia.total,
        actualitzatEl: copia.actualitzat_el,
        esCopiaCache: true,
      } satisfies Resposta, { headers: capçaleres });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : 'Error desconegut' },
      { status: 502, headers: capçaleres },
    );
  }
});
