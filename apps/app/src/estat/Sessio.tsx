/**
 * Sessió d'usuari.
 *
 * Manté l'estat d'autenticació i el sincronitza amb Supabase. La distinció que
 * importa és entre **«encara no ho sabem»** i **«no hi ha sessió»**: en arrencar,
 * recuperar la sessió guardada triga un instant, i durant aquell instant no s'ha
 * de fer fora ningú cap a la pantalla d'entrada.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../dades/supabase.ts';

interface EstatSessio {
  /** `undefined` mentre encara no sabem si hi ha sessió. */
  sessio: Session | null | undefined;
  /**
   * Nom de la persona, tal com es va desar al compte. `null` quan el compte no
   * en porta cap.
   *
   * Serveix per saludar. No es dedueix del correu: de `elna@vincle.cat` se'n
   * podria treure «Elna», però de `info@fundacio.org` en sortiria «Info», i
   * saludar algú per un nom inventat és pitjor que no saludar-lo.
   */
  nom: string | null;
  /**
   * El que s'ensenya a la barra de navegació: el nom si n'hi ha i, si no, el
   * correu, que sempre hi és. Buit si no hi ha sessió, cas en què la barra no
   * es dibuixa.
   */
  usuari: string;
  entra: (correu: string, contrasenya: string) => Promise<{ error: string | null }>;
  surt: () => Promise<void>;
}

const Context = createContext<EstatSessio | null>(null);

/** Missatges d'error de Supabase traduïts al català i sense tecnicismes. */
function tradueixError(missatge: string): string {
  if (/invalid login credentials/i.test(missatge)) {
    return 'El correu o la contrasenya no són correctes.';
  }
  if (/email not confirmed/i.test(missatge)) {
    return 'Aquest compte encara no s\'ha confirmat.';
  }
  if (/failed to fetch|network/i.test(missatge)) {
    return 'No hem pogut connectar amb el servidor.';
  }
  return missatge;
}

export function ProveidorSessio({ children }: { children: ReactNode }) {
  const [sessio, setSessio] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessio(data.session));

    // Manté l'estat al dia si la sessió caduca, es refresca o es tanca en una
    // altra pestanya.
    const { data } = supabase.auth.onAuthStateChange((_esdeveniment, nova) => {
      setSessio(nova);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const valor = useMemo<EstatSessio>(() => {
    // El nom viu a `user_metadata`, que és on el deixa qui crea el compte:
    //   {"email":"...","password":"...","email_confirm":true,
    //    "user_metadata":{"nom":"Elna Pont"}}
    // Es comprova que sigui text i que no sigui buit, perquè `user_metadata` és
    // JSON lliure i hi pot haver qualsevol cosa.
    const brut = sessio?.user?.user_metadata?.nom;
    const nom = typeof brut === 'string' && brut.trim() !== '' ? brut.trim() : null;
    const correuDelCompte = sessio?.user?.email ?? null;

    return {
      sessio,
      nom,
      usuari: nom ?? correuDelCompte ?? '',
      entra: async (correu, contrasenya) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: correu, password: contrasenya,
        });
        return { error: error ? tradueixError(error.message) : null };
      },
      surt: async () => { await supabase.auth.signOut(); },
    };
  }, [sessio]);

  return <Context.Provider value={valor}>{children}</Context.Provider>;
}

export function useSessio(): EstatSessio {
  const context = useContext(Context);
  if (!context) throw new Error('useSessio s\'ha de fer servir dins de ProveidorSessio.');
  return context;
}
