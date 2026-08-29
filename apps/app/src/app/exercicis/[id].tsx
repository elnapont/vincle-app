/**
 * Pantalla `6b` — fitxa d'exercici.
 *
 * **Adaptada al contingut real**, com el catàleg. El handoff dibuixa xips de
 * dificultat, una targeta d'objectiu, una llista de passos numerats amb cercles
 * granats i una targeta de criteri d'assoliment. El contingut escrit no té res
 * d'això: cada exercici és una explicació seguida, amb una nota opcional i una
 * recomanació de pràctica.
 *
 * L'estructura visual es manté —franja oliva a la targeta principal, capçalera
 * amb bloc en mono i títol serif, xips— però el que hi ha a dins és el que
 * existeix. Inventar passos per omplir el disseny seria fabricar contingut
 * d'ensinistrament, que és exactament el que el §6.1 prohibeix.
 *
 * La segona meitat de `6b`, la sessió guiada, encara no s'ha fet: necessita la
 * taula de sessions, que no existeix.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sessionsTotals, textRecomanacio } from '@vincle/shared-types';
import { BLOCS_CATALEG, EXERCICIS } from '../../dades/exercicis.ts';
import {
  Boto, Seccio, Targeta, Xip,
  color, espai, text, tinta,
} from '../../disseny/index.ts';

export default function FitxaExercici() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const exercici = EXERCICIS.find((e) => e.id === id);

  if (!exercici) {
    return (
      <SafeAreaView style={estils.pantalla} edges={['top', 'bottom']}>
        <View style={estils.contingut}>
          <Text style={text.titolMobil}>Aquest exercici no hi és</Text>
          <Text style={text.cosSecundari}>
            Pot ser que encara no s'hagi redactat.
          </Text>
          <Boto titol="Torna al catàleg" to="secundari" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const nomBloc = BLOCS_CATALEG.find((b) => b.bloc === exercici.bloc)?.nom ?? '';
  const totals = sessionsTotals(exercici.recomanacio);

  return (
    <SafeAreaView style={estils.pantalla} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={estils.contingut}>
        <View style={estils.encapcalament}>
          <Text style={estils.eyebrow}>
            {`${nomBloc.toUpperCase()} · EXERCICI ${exercici.ordre}`}
          </Text>
          <Text style={text.titolMobil}>{exercici.nom}</Text>
        </View>

        <View style={estils.xips}>
          <Xip to="calid">{textRecomanacio(exercici.recomanacio)}</Xip>
          {totals ? (
            <Xip to="neutre">
              {totals.min === totals.max
                ? `${totals.min} sessions en total`
                : `${totals.min}–${totals.max} sessions en total`}
            </Xip>
          ) : null}
        </View>

        {/* La targeta principal porta la franja oliva que el handoff reservava a
            l'objectiu: aquí hi va l'explicació, que és el que hi ha. */}
        <Targeta mobil franja="oliva">
          <Seccio>Com es fa</Seccio>
          <Text style={estils.explicacio}>{exercici.explicacio}</Text>
        </Targeta>

        {exercici.nota ? (
          <Targeta mobil franja="absencia">
            <Seccio>Nota</Seccio>
            <Text style={estils.explicacio}>{exercici.nota}</Text>
          </Targeta>
        ) : null}

        <Targeta mobil>
          <Seccio>Recomanació de pràctica</Seccio>
          <Text style={estils.recomanacio}>{textRecomanacio(exercici.recomanacio)}</Text>
          {totals === null ? (
            <Text style={estils.matis}>
              Aquesta pauta no es pot comptar en sessions: depèn del gos i del seu
              moment.
            </Text>
          ) : null}
        </Targeta>

        <Boto
          titol="Torna al catàleg"
          to="sobreGranat"
          onPress={() => router.back()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: {
    padding: espai.xl, paddingTop: espai.xxl, gap: espai.m,
    maxWidth: 620, width: '100%', alignSelf: 'center',
  },
  encapcalament: { gap: espai.xs },
  eyebrow: { ...text.escalaBarra },
  xips: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs },
  // Interlineat més ample que el text de targeta: són paràgrafs per llegir, no
  // metadades per fullejar.
  explicacio: { ...text.cos, lineHeight: 23 },
  recomanacio: { ...text.nomLlista, fontSize: 15, color: color.granat },
  matis: { ...text.cosSecundari, fontSize: 12.5, color: tinta.textSecundari },
});
