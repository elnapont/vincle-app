/**
 * Qüestionari de matching, pas 2: tasques, entorn i pes màxim.
 *
 * Cap d'aquests tres camps no entra encara al càlcul de compatibilitat, tret del
 * pes màxim: el matching v1 depèn només del trastorn i dels eixos del gos (§5).
 * Les tasques i l'entorn es recullen perquè el `MatchProfile` els preveu i perquè
 * són el lloc natural on encaixaria la mida si algun dia ha d'influir en la
 * puntuació (§5.2.4).
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ENTORNS, TASQUES } from '@vincle/shared-types';
import {
  ETIQUETA_ENTORN, ETIQUETA_TASCA, MAXIM_TASQUES, PES,
} from '../../dades/questionari.ts';
import { useQuestionari } from '../../estat/Questionari.tsx';
import {
  Boto, CapcaleraPas, ControlLliscant, Seccio, Xip,
  color, espai, text, tinta,
} from '../../disseny/index.ts';

export default function PasTasques() {
  const router = useRouter();
  const {
    tasques, entorns, pesMaximKg, commutaTasca, commutaEntorn, posaPesMaxim, perfil,
  } = useQuestionari();

  const alMaxim = tasques.length >= MAXIM_TASQUES;

  return (
    <SafeAreaView style={estils.pantalla} edges={['top', 'bottom']}>
      <CapcaleraPas pas={2} total={3} onEnrere={() => router.back()} />

      <ScrollView contentContainerStyle={estils.contingut}>
        <View style={estils.encapcalament}>
          <Text style={text.titolMobil}>Què ha de fer el gos?</Text>
          <Text style={text.cosSecundari}>
            Tria fins a {MAXIM_TASQUES} tasques i digues on treballarà.
          </Text>
        </View>

        <View style={estils.bloc}>
          <View style={estils.filaSeccio}>
            <Seccio>Tasques</Seccio>
            <Text style={text.metadadaFort}>{tasques.length}/{MAXIM_TASQUES}</Text>
          </View>
          <View style={estils.xips}>
            {TASQUES.map((t) => {
              const triada = tasques.includes(t);
              return (
                <Xip
                  key={t}
                  to={triada ? 'actiu' : 'neutre'}
                  // Arribat al màxim, les no triades deixen de respondre: és més
                  // clar que substituir-ne una en silenci.
                  onPress={triada || !alMaxim ? () => commutaTasca(t) : undefined}
                >
                  {ETIQUETA_TASCA[t]}
                </Xip>
              );
            })}
          </View>
        </View>

        <View style={estils.bloc}>
          <Seccio>Entorn habitual</Seccio>
          <View style={estils.xips}>
            {ENTORNS.map((e) => (
              <Xip
                key={e}
                to={entorns.includes(e) ? 'exit' : 'neutre'}
                onPress={() => commutaEntorn(e)}
              >
                {ETIQUETA_ENTORN[e]}
              </Xip>
            ))}
          </View>
        </View>

        <View style={estils.bloc}>
          <Seccio>Mida</Seccio>
          <ControlLliscant
            valor={pesMaximKg}
            minim={PES.minim}
            maxim={PES.maxim}
            onCanvi={posaPesMaxim}
            referencia={{ valor: PES.mediana, etiqueta: `MEDIANA ${PES.mediana}` }}
            formata={(v) => `${v} kg`}
            etiquetaAccessible="Pes màxim del gos en quilos"
          />
          <Text style={estils.nota}>
            Depèn de l'entorn on viurà el gos, no del trastorn. Les races que el
            superen no desapareixen: baixen al final amb el motiu visible.
          </Text>
        </View>
      </ScrollView>

      <View style={estils.peu}>
        <Boto
          titol="Veure compatibilitats"
          desactivat={perfil === null}
          onPress={() => router.push('/resultats')}
          estil={estils.botoPeu}
        />
      </View>
    </SafeAreaView>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: { padding: espai.xl, paddingTop: espai.xxl, gap: espai.xxl },
  encapcalament: { gap: espai.s },
  bloc: { gap: espai.m },
  filaSeccio: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  xips: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs },
  nota: { ...text.cosSecundari, fontSize: 12.5, lineHeight: 18 },
  peu: {
    padding: espai.xl,
    paddingTop: espai.m,
    borderTopWidth: 1,
    borderTopColor: tinta.separador,
    backgroundColor: color.paper,
  },
  botoPeu: { height: 52 },
});
