/**
 * Capçalera dels passos del qüestionari: fletxa enrere, barra de progrés de 4px i
 * comptador mono.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, espai, radi, tinta, TOCABLE_MINIM } from './tokens.ts';
import { familia, text } from './tipografia.ts';

export function CapcaleraPas({
  pas, total, onEnrere,
}: {
  pas: number;
  total: number;
  onEnrere?: () => void;
}) {
  return (
    <View style={estils.contenidor}>
      <Pressable
        onPress={onEnrere}
        disabled={!onEnrere}
        accessibilityRole="button"
        accessibilityLabel="Torna enrere"
        style={estils.enrere}
      >
        <Text style={[estils.fletxa, !onEnrere && { opacity: 0.25 }]}>←</Text>
      </Pressable>

      <View style={estils.pista}>
        <View style={[estils.progres, { width: `${(pas / total) * 100}%` }]} />
      </View>

      <Text style={estils.comptador}>{pas}/{total}</Text>
    </View>
  );
}

const estils = StyleSheet.create({
  contenidor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espai.ml,
    paddingHorizontal: espai.xl,
    paddingTop: espai.l,
  },
  enrere: {
    width: TOCABLE_MINIM, height: TOCABLE_MINIM,
    alignItems: 'flex-start', justifyContent: 'center',
    marginLeft: -espai.xs,
  },
  fletxa: { fontFamily: familia.sans, fontSize: 22, color: color.granat },
  pista: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(102,20,20,.13)', overflow: 'hidden',
  },
  progres: { height: '100%', backgroundColor: color.vermell, borderRadius: radi.barra },
  comptador: { ...text.metadadaFort, fontSize: 12, color: tinta.etiqueta },
});
