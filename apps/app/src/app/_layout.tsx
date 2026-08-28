/**
 * Arrel de l'aplicació: carrega les tres tipografies del sistema abans de
 * dibuixar res.
 *
 * Si es dibuixés abans que les fonts estiguin llestes, la interfície faria un salt
 * visible en substituir la tipografia del sistema per Instrument Serif. Amb un
 * disseny on la tipografia carrega tant el pes de la identitat, val la pena
 * esperar-se.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
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
    // Amaguem la pantalla de càrrega tant si les fonts han carregat com si han
    // fallat: val més la interfície amb la tipografia del sistema que no pas una
    // aplicació encallada.
    if (fontsLlestes || errorFonts) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLlestes, errorFonts]);

  if (!fontsLlestes && !errorFonts) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.paper },
        }}
      />
    </>
  );
}
