/**
 * Client de Supabase compartit.
 *
 * La sessió es guarda a `AsyncStorage`, que a mòbil és emmagatzematge natiu i a
 * web es tradueix a `localStorage`. Així la casella «Mantén la sessió oberta» té
 * sentit: sense persistència, tancar l'aplicació obligaria a entrar cada vegada.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Els valors per defecte són els de l'stack local que aixeca `supabase start`:
 * són públics i idèntics a totes les instal·lacions, de manera que qui es baixi
 * el repositori pot entrar sense configurar res.
 */
const URL_BASE = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const CLAU_ANONIMA = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/**
 * El render estàtic de la web executa l'aplicació dins de Node, on no hi ha
 * `window` ni `localStorage`. `AsyncStorage`, que a web n'és una capa fina,
 * peta en aquest entorn.
 *
 * La solució és no intentar persistir res quan no hi ha finestra: al servidor
 * no hi ha ningú amb sessió i el que es genera és HTML per a un usuari anònim.
 * En arribar al navegador, el client es torna a crear amb l'emmagatzematge de
 * debò i recupera la sessió guardada.
 */
const hiHaFinestra = typeof window !== 'undefined';

const magatzemBuit = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient(URL_BASE, CLAU_ANONIMA, {
  auth: {
    storage: hiHaFinestra ? AsyncStorage : magatzemBuit,
    autoRefreshToken: hiHaFinestra,
    persistSession: hiHaFinestra,
    // A web, Supabase mira la URL per recollir el testimoni dels enllaços de
    // confirmació; a mòbil no hi ha URL on mirar, i al servidor tampoc.
    detectSessionInUrl: Platform.OS === 'web' && hiHaFinestra,
  },
});
