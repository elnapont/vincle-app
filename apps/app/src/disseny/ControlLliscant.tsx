/**
 * Control lliscant del filtre de pes màxim.
 *
 * És propi i no una llibreria externa perquè el disseny en fixa l'aspecte fins al
 * detall —valor en mono vermell, marca de la mediana del catàleg, etiquetes
 * d'escala de 10px— i lluitar contra l'estil d'un component natiu hauria costat
 * més que dibuixar-lo. `PanResponder` funciona igual a mòbil i a web.
 */

import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { alcadaBarra, color, espai, radi, tinta, TOCABLE_MINIM } from './tokens.ts';
import { text } from './tipografia.ts';

export interface ControlLliscantProps {
  valor: number;
  minim: number;
  maxim: number;
  onCanvi: (valor: number) => void;
  /** Valor de referència que es marca a la pista, com la mediana del catàleg. */
  referencia?: { valor: number; etiqueta: string };
  formata?: (valor: number) => string;
  etiquetaAccessible?: string;
}

const DIAMETRE_POM = 22;

export function ControlLliscant({
  valor, minim, maxim, onCanvi, referencia, formata = (v) => String(v), etiquetaAccessible,
}: ControlLliscantProps) {
  const [amplada, setAmplada] = useState(0);
  // La referència s'ha de llegir dins del PanResponder, que es crea un sol cop.
  const referencies = useRef({ amplada: 0, onCanvi });
  referencies.current = { amplada, onCanvi };

  const fraccio = (valor - minim) / (maxim - minim);

  const desDePosicio = (x: number): number => {
    const ample = referencies.current.amplada;
    if (ample <= 0) return valor;
    const f = Math.max(0, Math.min(1, x / ample));
    return Math.round(minim + f * (maxim - minim));
  };

  const responedor = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        referencies.current.onCanvi(desDePosicio(e.nativeEvent.locationX));
      },
      onPanResponderMove: (e) => {
        referencies.current.onCanvi(desDePosicio(e.nativeEvent.locationX));
      },
    }),
  ).current;

  const mida = (e: LayoutChangeEvent) => setAmplada(e.nativeEvent.layout.width);

  return (
    <View style={estils.contenidor}>
      <View style={estils.capcalera}>
        <Text style={text.etiquetaCamp}>Pes màxim</Text>
        <Text style={estils.valor}>{formata(valor)}</Text>
      </View>

      <View
        style={estils.zonaTocable}
        onLayout={mida}
        accessibilityRole="adjustable"
        accessibilityLabel={etiquetaAccessible ?? 'Pes màxim'}
        accessibilityValue={{ min: minim, max: maxim, now: valor }}
        {...responedor.panHandlers}
      >
        <View style={estils.pista}>
          <View style={[estils.reple, { width: `${fraccio * 100}%` }]} />
        </View>

        {referencia ? (
          <View
            pointerEvents="none"
            style={[
              estils.marcaReferencia,
              { left: `${((referencia.valor - minim) / (maxim - minim)) * 100}%` },
            ]}
          />
        ) : null}

        <View
          pointerEvents="none"
          style={[estils.pom, { left: `${fraccio * 100}%` }]}
        />
      </View>

      <View style={estils.escala}>
        <Text style={text.escalaBarra}>{formata(minim)}</Text>
        {referencia ? <Text style={text.escalaBarra}>{referencia.etiqueta}</Text> : null}
        <Text style={text.escalaBarra}>{formata(maxim)}</Text>
      </View>
    </View>
  );
}

const estils = StyleSheet.create({
  contenidor: { gap: espai.s },
  capcalera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  valor: { ...text.metadadaFort, fontSize: 13, color: color.vermell },
  zonaTocable: { height: TOCABLE_MINIM, justifyContent: 'center' },
  pista: {
    height: alcadaBarra.eix,
    backgroundColor: tinta.pistaEix,
    borderRadius: radi.barra,
    overflow: 'hidden',
  },
  reple: { height: '100%', backgroundColor: color.granat, borderRadius: radi.barra },
  marcaReferencia: {
    position: 'absolute',
    width: 2, height: 14,
    marginLeft: -1,
    backgroundColor: tinta.eixSenseDadesContorn,
  },
  pom: {
    position: 'absolute',
    width: DIAMETRE_POM, height: DIAMETRE_POM,
    marginLeft: -DIAMETRE_POM / 2,
    borderRadius: DIAMETRE_POM / 2,
    backgroundColor: color.blanc,
    borderWidth: 2,
    borderColor: color.granat,
  },
  escala: { flexDirection: 'row', justifyContent: 'space-between' },
});
