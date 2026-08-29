/**
 * Fotografia d'una raça.
 *
 * Les imatges de The Dog API tenen relacions d'aspecte molt diferents: van de
 * 0,51 —més del doble d'altes que amples— a 2,16, i el 14 % són verticals. Amb un
 * marc d'alçada fixa i retallat centrat, a les verticals se'ls menja el cap i
 * només se'n veu una franja del mig. Per això el retallat s'ancora **a dalt**: a
 * les fotografies de gossos el cap gairebé sempre és a la part superior.
 *
 * Es fa servir `expo-image` i no el component bàsic perquè gestiona el
 * `contentPosition`, encadena una transició en carregar i deixa posar un color de
 * fons mentre arriba, que amb 24 imatges alhora es nota.
 */

import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ImageStyle, ViewStyle } from 'react-native';
import { radi, tinta } from './tokens.ts';
import { text } from './tipografia.ts';

/** Color dels marcadors de posició del handoff, mentre la imatge no arriba. */
const FONS_IMATGE = '#e6ddd2';

export function FotoRaca({
  url, nom, alcada, estil,
}: {
  url: string | null;
  nom: string;
  alcada: number;
  estil?: StyleProp<ImageStyle>;
}) {
  if (!url) {
    return (
      <View style={[estils.marc as StyleProp<ViewStyle>, estils.buida, { height: alcada }]}>
        <Text style={text.metadada}>sense fotografia</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={[estils.marc, { height: alcada }, estil]}
      contentFit="cover"
      // A dalt i centrat: on sol ser el cap del gos.
      contentPosition="top center"
      transition={200}
      placeholderContentFit="cover"
      accessibilityLabel={`Fotografia d'un ${nom}`}
      // Evita el parpelleig en tornar a una pantalla ja visitada.
      cachePolicy="memory-disk"
    />
  );
}

const estils = StyleSheet.create({
  marc: {
    width: '100%',
    borderRadius: radi.targeta,
    backgroundColor: FONS_IMATGE,
    borderWidth: 1,
    borderColor: tinta.vora,
  },
  buida: { alignItems: 'center', justifyContent: 'center' },
});
