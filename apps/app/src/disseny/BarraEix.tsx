/**
 * Barra d'un eix derivat — el component que implementa el patró «sense dades»
 * (pantalla `7a` del handoff).
 *
 * Un eix pot valer 5 perquè s'ha mesurat o perquè cap terme de la raça hi cau i el
 * model hi posa el neutre. **Els dos casos no es dibuixen igual.** No és cap
 * detall: passa al 76 % de les races a «calma», i les races del top 10 tenen entre
 * un i tres dels vuit eixos sense dades. Si es dibuixessin igual, la pantalla
 * ensenyaria mesures inventades.
 *
 * Per això aquest component NO accepta un número: accepta `number | null`. Fer
 * passar una absència per una mesura requeriria mentir-li explícitament.
 *
 * Tres estats:
 *
 *   - **Valor derivat** — pista plena, replè granat, xifra en mono.
 *   - **Sense dades** — pista transparent amb contorn, cap replè, guionet.
 *   - **Direcció «resta»** — replè en sorra i marcador `↓ MILLOR SI ÉS BAIX`,
 *     perquè una barra curta no sembli un defecte quan és una virtut.
 */

import { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { Direccio, Eix } from '@vincle/shared-types';
import { ETIQUETA_EIX } from '@vincle/shared-types';
import { alcadaBarra, color, durada, espai, radi, tinta } from './tokens.ts';
import { familia, text } from './tipografia.ts';

export interface BarraEixProps {
  eix: Eix;
  /** `null` vol dir que cap terme de la raça cau en aquest eix. */
  valor: number | null;
  /** Si el perfil hi assigna «resta», interessa un valor baix. */
  direccio?: Direccio;
  /**
   * Quant detall hi cap. `compacte` per a files de resultat i rànquing;
   * `fitxa` afegeix l'etiqueta «SENSE DADES» i el pes, on hi ha més espai.
   */
  detall?: 'compacte' | 'fitxa';
  /** Pes de l'eix dins del perfil, si es vol mostrar. */
  pes?: number;
  /** Etiqueta alternativa, per quan l'espai obliga a escurçar el nom. */
  etiqueta?: string;
}

const MAXIM = 10;

export function BarraEix({
  eix, valor, direccio = 'suma', detall = 'compacte', pes, etiqueta,
}: BarraEixProps) {
  const senseDades = valor === null;
  const invertit = direccio === 'resta';
  const alcada = detall === 'fitxa' ? alcadaBarra.eixFitxa : alcadaBarra.eix;

  // Les barres animen l'amplada en carregar el resultat. Amb `null` no hi ha res
  // a animar, perquè no hi ha replè.
  //
  // El valor animat va a `useMemo` i no a `useRef`: llegir `.current` d'un ref
  // durant el dibuix és el que React desaconsella, i aquí el valor es fa servir
  // per calcular l'amplada a cada render.
  const progres = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    if (senseDades) return;
    Animated.timing(progres, {
      toValue: (valor ?? 0) / MAXIM,
      duration: durada.barra,
      // L'amplada és una propietat de disposició: no pot anar pel fil natiu.
      useNativeDriver: false,
    }).start();
  }, [valor, senseDades, progres]);

  const amplada = progres.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  return (
    <View style={estils.contenidor}>
      <View style={estils.capcalera}>
        <Text
          style={[
            estils.nom,
            senseDades && { color: tinta.eixSenseDadesText },
          ]}
          numberOfLines={1}
        >
          {etiqueta ?? ETIQUETA_EIX[eix]}
        </Text>

        {invertit ? (
          <Text style={estils.marcadorInvertit}>
            {detall === 'fitxa' ? '↓ MILLOR SI ÉS BAIX' : '↓ BAIX'}
          </Text>
        ) : null}

        <View style={estils.separadorFlexible} />

        {pes !== undefined ? <Text style={estils.pes}>{`pes ${pes}%`}</Text> : null}

        <Text style={[estils.valor, senseDades && estils.guionet]}>
          {senseDades ? '—' : valor!.toFixed(1).replace('.', ',')}
        </Text>
      </View>

      {senseDades ? (
        // Pista transparent amb contorn i sense cap filla de replè. Deliberadament
        // sense `borderStyle: 'dashed'`: a Android no es dibuixa bé amb radi.
        <View style={[estils.pista, estils.pistaSenseDades, { height: alcada }]} />
      ) : (
        <View style={[estils.pista, { height: alcada }]}>
          <Animated.View
            style={[
              estils.reple,
              { width: amplada, backgroundColor: invertit ? color.sorra : color.granat },
            ]}
          />
        </View>
      )}

      {detall === 'fitxa' && senseDades ? (
        <Text style={estils.etiquetaSenseDades}>SENSE DADES</Text>
      ) : null}
    </View>
  );
}

const estils = StyleSheet.create({
  contenidor: { gap: espai.xs },
  capcalera: { flexDirection: 'row', alignItems: 'baseline', gap: espai.xs },
  separadorFlexible: { flex: 1 },
  nom: { ...text.cosSecundari, color: color.tinta },
  marcadorInvertit: {
    fontFamily: familia.monoMitja,
    fontSize: 10,
    letterSpacing: 0.8,
    color: color.vermell,
  },
  pes: { ...text.metadada },
  valor: { ...text.metadadaFort, color: color.tinta },
  guionet: { color: tinta.eixSenseDadesGuionet },
  pista: {
    backgroundColor: tinta.pistaEix,
    borderRadius: radi.barra,
    overflow: 'hidden',
  },
  pistaSenseDades: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tinta.eixSenseDadesContorn,
  },
  reple: { height: '100%', borderRadius: radi.barra },
  etiquetaSenseDades: { ...text.escalaBarra, color: tinta.eixSenseDadesText },
});
