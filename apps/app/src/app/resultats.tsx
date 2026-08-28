/**
 * Rànquing de compatibilitat (pantalla `7d`).
 *
 * Provisional: encara no hi ha catàleg de races a l'aplicació. La capa d'API amb
 * el proxy de The Dog API és el pas següent; mentrestant, aquesta pantalla
 * confirma que el qüestionari arriba fins aquí amb un `MatchProfile` validat.
 */
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ETIQUETA_TRASTORN } from '@vincle/shared-types';
import { useQuestionari } from '../estat/Questionari.tsx';
import { Boto, CapcaleraPas, Targeta, color, espai, text } from '../disseny/index.ts';

export default function Resultats() {
  const router = useRouter();
  const { perfil } = useQuestionari();

  return (
    <SafeAreaView style={estils.pantalla} edges={['top', 'bottom']}>
      <CapcaleraPas pas={3} total={3} onEnrere={() => router.back()} />
      <View style={estils.contingut}>
        <Text style={text.titolMobil}>Races més compatibles</Text>
        {perfil ? (
          <Targeta mobil franja="absencia">
            <Text style={text.cos}>
              Perfil validat: {ETIQUETA_TRASTORN[perfil.trastorn]}
              {perfil.tasques.length ? ` · ${perfil.tasques.length} tasques` : ''}
              {` · fins a ${perfil.pesMaximKg} kg`}
            </Text>
            <Text style={text.cosSecundari}>
              El rànquing arribarà amb el catàleg de races, quan hi hagi la capa d'API.
            </Text>
          </Targeta>
        ) : (
          <Text style={text.cosSecundari}>Encara no hi ha cap trastorn triat.</Text>
        )}
        <Boto titol="Torna a començar" to="secundari" onPress={() => router.dismissAll()} />
      </View>
    </SafeAreaView>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: { padding: espai.xl, paddingTop: espai.xxl, gap: espai.l },
});
