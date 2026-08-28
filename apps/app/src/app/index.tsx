/**
 * Pantalla `7e` — qüestionari de matching, pas 1: el trastorn.
 *
 * És el punt de partida obligatori de tot el matching (§5 del CLAUDE.md): a
 * partir del trastorn es decideixen quins eixos de temperament es prioritzen i
 * amb quin pes. Per això no es pot continuar sense triar-ne un.
 *
 * Sis targetes en una sola columna. El TOC va sortir del projecte (v0.15), i amb
 * ell la graella de dues columnes que compartia amb el TDAH a h1.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { Trastorn } from '@vincle/shared-types';
import { ETIQUETA_TRASTORN, TRASTORNS } from '@vincle/shared-types';
import { TASQUES_TIPIQUES } from '../dades/questionari.ts';
import { useQuestionari } from '../estat/Questionari.tsx';
import { Boto, CapcaleraPas, color, espai, text, tinta } from '../disseny/index.ts';

export default function PasTrastorn() {
  const router = useRouter();
  const { trastorn, triaTrastorn } = useQuestionari();

  return (
    <SafeAreaView style={estils.pantalla} edges={['top', 'bottom']}>
      <CapcaleraPas pas={1} total={3} />

      <ScrollView contentContainerStyle={estils.contingut}>
        <View style={estils.encapcalament}>
          <Text style={text.titolMobil}>Per a quin trastorn treballem?</Text>
          <Text style={text.cosSecundari}>
            A partir d'aquí prioritzem uns eixos de temperament o uns altres.
          </Text>
        </View>

        <View style={estils.llista}>
          {TRASTORNS.map((t) => (
            <TargetaTrastorn
              key={t}
              trastorn={t}
              seleccionat={trastorn === t}
              onPress={() => triaTrastorn(t)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={estils.peu}>
        <Boto
          titol="Continua"
          desactivat={trastorn === null}
          onPress={() => router.push('/questionari/tasques')}
          estil={estils.botoPeu}
        />
      </View>
    </SafeAreaView>
  );
}

function TargetaTrastorn({
  trastorn, seleccionat, onPress,
}: {
  trastorn: Trastorn;
  seleccionat: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionat }}
      style={({ pressed }) => [
        estils.targeta,
        seleccionat ? estils.targetaActiva : estils.targetaInactiva,
        pressed ? { transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <Text style={[estils.nomTrastorn, seleccionat && { color: color.blanc }]}>
        {ETIQUETA_TRASTORN[trastorn]}
      </Text>
      <Text
        style={[
          estils.tasquesTipiques,
          seleccionat && { color: 'rgba(255,255,255,.72)' },
        ]}
      >
        {TASQUES_TIPIQUES[trastorn]}
      </Text>
    </Pressable>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: { padding: espai.xl, paddingTop: espai.xxl, gap: espai.xl },
  encapcalament: { gap: espai.s },
  llista: { gap: espai.s },
  targeta: {
    borderRadius: 13,
    paddingVertical: 15,
    paddingHorizontal: espai.l,
    gap: espai.xxs,
  },
  targetaInactiva: {
    backgroundColor: color.blanc,
    borderWidth: 1,
    borderColor: 'rgba(36,26,22,.14)',
  },
  targetaActiva: {
    backgroundColor: color.vermell,
    borderWidth: 1.5,
    borderColor: color.vermell,
  },
  nomTrastorn: { ...text.nomLlista, fontSize: 15 },
  tasquesTipiques: { ...text.cosSecundari, fontSize: 12.5, lineHeight: 17 },
  peu: {
    padding: espai.xl,
    paddingTop: espai.m,
    borderTopWidth: 1,
    borderTopColor: tinta.separador,
    backgroundColor: color.paper,
  },
  botoPeu: { height: 52 },
});
