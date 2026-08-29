/**
 * Pantalla `6a` — catàleg d'exercicis.
 *
 * **Adaptada al contingut real.** El handoff dibuixa quatre categories, xips de
 * dificultat i un peu amb «N passos», però el catàleg que ha escrit la
 * responsable del projecte té cinc blocs, no té dificultat i no té passos
 * numerats: cada exercici és una explicació seguida. Dibuixar xips de dificultat
 * buits o comptar passos que no existeixen seria ensenyar dades inventades, que
 * és justament el que la resta del producte evita.
 *
 * El que sí que hi ha —el bloc, la recomanació de pràctica i l'explicació— ocupa
 * el lloc d'allò altre amb el mateix vocabulari visual.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import type { Exercise } from '@vincle/shared-types';
import { textRecomanacioCurt } from '@vincle/shared-types';
import { BLOCS_CATALEG, EXERCICIS } from '../../dades/exercicis.ts';
import { useSessio } from '../../estat/Sessio.tsx';
import {
  BarraNavegacio, Seccio, Targeta, Xip,
  color, espai, text, useTrencament,
} from '../../disseny/index.ts';

const PESTANYES = [
  { etiqueta: 'Gossos', desti: '/gossos' as const },
  { etiqueta: 'Races', desti: '/races' as const },
  { etiqueta: 'Compatibilitats', desti: '/compatibilitats' as const },
  { etiqueta: 'Exercicis', desti: '/exercicis' as const },
];

/** Quants exercicis ha de tenir cada bloc quan el catàleg estigui complet. */
const PREVISTOS: Record<number, number> = { 1: 3, 2: 5, 3: 4, 4: 3, 5: 4 };

export default function CatalegExercicis() {
  const { esMobil, lateralASobre } = useTrencament();
  const { surt } = useSessio();
  const [bloc, setBloc] = useState<number | null>(null);

  const visibles = useMemo(
    () => (bloc === null ? EXERCICIS : EXERCICIS.filter((e) => e.bloc === bloc)),
    [bloc],
  );

  const compta = (n: number) => EXERCICIS.filter((e) => e.bloc === n).length;
  const totalPrevistos = Object.values(PREVISTOS).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={estils.pantalla} edges={['top']}>
      {!esMobil ? <BarraNavegacio pestanyes={PESTANYES} activa="Exercicis" onSortir={surt} /> : null}

      <ScrollView contentContainerStyle={estils.desplacament}>
        <View style={[estils.columnes, lateralASobre && estils.apilades]}>
          {/* Panell lateral: blocs i la nota fixa sobre el catàleg */}
          <View style={[estils.lateral, lateralASobre && estils.plena]}>
            <Targeta>
              <Seccio>Blocs</Seccio>
              <Pressable onPress={() => setBloc(null)} style={estils.filaBloc}>
                <Text style={[estils.nomBloc, bloc === null && estils.blocActiu]}>Tots</Text>
                <Text style={text.metadadaFort}>{EXERCICIS.length}</Text>
              </Pressable>

              {BLOCS_CATALEG.map((b) => (
                <Pressable key={b.bloc} onPress={() => setBloc(b.bloc)} style={estils.filaBloc}>
                  <Text
                    style={[estils.nomBloc, bloc === b.bloc && estils.blocActiu]}
                    numberOfLines={1}
                  >
                    {b.nom}
                  </Text>
                  <Text style={text.metadadaFort}>
                    {`${compta(b.bloc)}/${PREVISTOS[b.bloc] ?? '?'}`}
                  </Text>
                </Pressable>
              ))}
            </Targeta>

            <Targeta franja="absencia">
              <Seccio>Catàleg de referència</Seccio>
              <Text style={estils.nota}>
                Els exercicis són contingut fix i revisat: es consulten, no es creen
                des de l'aplicació. Els ha preparat l'equip com a part del marc
                pràctic del treball.
              </Text>
            </Targeta>

            {EXERCICIS.length < totalPrevistos ? (
              <Targeta franja="absencia">
                <Seccio>En redacció</Seccio>
                <Text style={estils.nota}>
                  {`${EXERCICIS.length} de ${totalPrevistos} exercicis escrits. `}
                  Els blocs que encara no hi són s'aniran afegint.
                </Text>
              </Targeta>
            ) : null}
          </View>

          {/* Contingut: la graella d'exercicis */}
          <View style={estils.contingut}>
            <View style={estils.encapcalament}>
              <Text style={esMobil ? text.titolMobil : text.titolWeb}>
                Guia d'ensinistrament
              </Text>
              <Text style={text.cosSecundari}>
                Consulta com fer cada exercici abans de practicar-lo.
              </Text>
            </View>

            {visibles.length === 0 ? (
              <Targeta franja="absencia">
                <Text style={text.nomLlista}>Aquest bloc encara no té exercicis</Text>
                <Text style={text.cosSecundari}>
                  S'estan redactant. Mentrestant pots consultar els altres blocs.
                </Text>
              </Targeta>
            ) : null}

            <View style={estils.graella}>
              {visibles.map((e) => (
                <View key={e.id} style={lateralASobre ? estils.plena : estils.cela}>
                  <TargetaExercici exercici={e} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TargetaExercici({ exercici }: { exercici: Exercise }) {
  const nomBloc = BLOCS_CATALEG.find((b) => b.bloc === exercici.bloc)?.nom ?? '';
  const previstos = PREVISTOS[exercici.bloc] ?? '?';

  return (
    <Link href={{ pathname: '/exercicis/[id]', params: { id: exercici.id } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Fitxa de ${exercici.nom}`}
        style={({ pressed }) => [estils.plena, pressed ? { opacity: 0.85 } : null]}
      >
        <Targeta estil={estils.targeta}>
          <Text style={estils.eyebrow}>
            {`${nomBloc.toUpperCase()} · EXERCICI ${exercici.ordre} DE ${previstos}`}
          </Text>
          <View style={estils.filaNom}>
            <View style={estils.ordinal}>
              <Text style={estils.ordinalNumero}>{exercici.ordre}</Text>
            </View>
            <Text style={estils.nomExercici}>{exercici.nom}</Text>
          </View>

          <Text style={text.cosSecundari} numberOfLines={3}>
            {exercici.explicacio}
          </Text>

          <View style={estils.peu}>
            <Xip to="calid" unaLinia>{textRecomanacioCurt(exercici.recomanacio)}</Xip>
          </View>
        </Targeta>
      </Pressable>
    </Link>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  desplacament: { padding: espai.xxl, maxWidth: 1180, width: '100%', alignSelf: 'center' },
  columnes: { flexDirection: 'row', gap: espai.xxl, alignItems: 'flex-start' },
  apilades: { flexDirection: 'column' },
  lateral: { width: 270, gap: espai.l },
  plena: { width: '100%' },
  contingut: { flex: 1, gap: espai.l, minWidth: 0 },

  filaBloc: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: espai.s, paddingVertical: 3,
  },
  nomBloc: { ...text.cosSecundari, color: color.tinta, flexShrink: 1 },
  blocActiu: { fontFamily: text.nomLlista.fontFamily, color: color.vermell },
  nota: { ...text.cosSecundari, fontSize: 12.5, lineHeight: 18 },

  encapcalament: { gap: espai.xs },
  graella: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.l },
  // Dues columnes: la meitat menys la meitat del buit. Sense `flexGrow`, perquè
  // si no una targeta sola s'estiraria fins a l'amplada sencera quan el bloc
  // filtrat només en té una.
  cela: { width: '48.5%', minWidth: 280 },
  targeta: { gap: espai.s, height: '100%' },
  eyebrow: { ...text.escalaBarra },
  filaNom: { flexDirection: 'row', alignItems: 'center', gap: espai.s },
  // El número d'ordre en un cercle: els exercicis d'un bloc es fan en ordre, i
  // saber-lo d'un cop d'ull és el que demanava la revisió.
  ordinal: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: color.granat,
    alignItems: 'center', justifyContent: 'center',
  },
  ordinalNumero: { ...text.metadadaFort, fontSize: 12, color: color.blanc },
  nomExercici: { ...text.nomLlista, fontSize: 17, flexShrink: 1 },
  peu: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs, marginTop: 'auto' },
});
