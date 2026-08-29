/**
 * Arrel de l'aplicació.
 *
 * Fa tres coses abans que es vegi res: carrega les tres tipografies del sistema,
 * recupera la sessió guardada i decideix si qui arriba pot passar. Si es dibuixés
 * abans que les fonts estiguin llestes, la interfície faria un salt visible en
 * substituir la tipografia del sistema per Instrument Serif.
 */

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { color } from '../disseny/index.ts';
import { ProveidorQuestionari } from '../estat/Questionari.tsx';
import { ProveidorSessio, useSessio } from '../estat/Sessio.tsx';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Si la pantalla de càrrega ja s'ha amagat, no és cap problema.
});

export default function ArrelLayout() {
  const [fontsLlestes, errorFonts] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    // S'amaga la pantalla de càrrega tant si les fonts han carregat com si han
    // fallat: val més la interfície amb la tipografia del sistema que no pas una
    // aplicació encallada.
    if (fontsLlestes || errorFonts) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLlestes, errorFonts]);

  if (!fontsLlestes && !errorFonts) return null;

  return (
    <ProveidorSessio>
      <ProveidorQuestionari>
        <StatusBar style="dark" />
        <Guardia />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: color.paper },
          }}
        />
      </ProveidorQuestionari>
    </ProveidorSessio>
  );
}

/**
 * Porta d'entrada.
 *
 * La distinció important és entre «encara no sabem si hi ha sessió» i «no n'hi
 * ha». Recuperar la sessió guardada triga un instant, i durant aquell instant no
 * s'ha de fer fora ningú: si no, qui ja havia entrat veuria la pantalla d'entrada
 * un moment a cada arrencada.
 */
function Guardia() {
  const { sessio } = useSessio();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (sessio === undefined) return;

    const aLEntrada = segments[0] === 'entrada';
    if (!sessio && !aLEntrada) router.replace('/entrada');
    if (sessio && aLEntrada) router.replace('/');
  }, [sessio, segments, router]);

  return null;
}
