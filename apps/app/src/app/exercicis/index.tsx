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
  BarraNavegacio, BarraPestanyesMobil, Seccio, Targeta, Xip,
  color, colorBloc, espai, fonsBloc, text, useTrencament,
} from '../../disseny/index.ts';

/**
 * Quants exercicis té cada bloc.
 *
 * Es compta del catàleg i no d'una llista escrita a mà. Abans hi havia aquí els
 * imports previstos —3, 5, 4, 3, 4— per poder ensenyar «escrits/previstos»
 * mentre l'Elna els redactava; ara que hi són tots, això només deia «3/3» a tot
 * arreu. Qui vigila que els recomptes siguin els que toquen és el generador
 * (`scripts/genera-exercicis.ts`), que avisa en construir les dades: és el lloc
 * on es nota, i no una còpia dins la pantalla que es pot desviar en silenci.
 */
const PER_BLOC = new Map<number, number>(
  BLOCS_CATALEG.map((b) => [b.bloc, EXERCICIS.filter((e) => e.bloc === b.bloc).length]),
);

export default function CatalegExercicis() {
  const { esMobil, lateralASobre } = useTrencament();
  const { surt } = useSessio();
  const [bloc, setBloc] = useState<number | null>(null);

  const visibles = useMemo(
    () => (bloc === null ? EXERCICIS : EXERCICIS.filter((e) => e.bloc === bloc)),
    [bloc],
  );

  return (
    <SafeAreaView style={estils.pantalla} edges={['top']}>
      {!esMobil ? <BarraNavegacio activa="Exercicis" onSortir={surt} /> : null}

      <ScrollView style={estils.desplacador} contentContainerStyle={estils.desplacament}>
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
                  <Text style={text.metadadaFort}>{PER_BLOC.get(b.bloc) ?? 0}</Text>
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

            {/*
              La graella es parteix per blocs amb encapçalament, i cada targeta
              va tenyida del color del seu bloc. Amb dinou exercicis en una
              graella plana no es veia on acabava un bloc i on començava el
              següent; el color sol tampoc no bastava, perquè és molt suau a posta.
            */}
            {BLOCS_CATALEG.map((b) => {
              const delBloc = visibles.filter((e) => e.bloc === b.bloc);
              if (delBloc.length === 0) return null;

              return (
                <View key={b.bloc} style={estils.grupBloc}>
                  <View style={estils.capcaleraBloc}>
                    <View style={[estils.mostraBloc, { backgroundColor: colorBloc(b.bloc) }]} />
                    <Text style={estils.nomBlocGrup}>{b.nom}</Text>
                    <Text style={text.metadadaFort}>{delBloc.length}</Text>
                  </View>

                  <View style={estils.graella}>
                    {delBloc.map((e) => (
                      <View key={e.id} style={lateralASobre ? estils.plena : estils.cela}>
                        <TargetaExercici exercici={e} />
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {esMobil ? <BarraPestanyesMobil activa="Exercicis" /> : null}
    </SafeAreaView>
  );
}

function TargetaExercici({ exercici }: { exercici: Exercise }) {
  const delBloc = PER_BLOC.get(exercici.bloc) ?? '?';

  return (
    <Link href={{ pathname: '/exercicis/[id]', params: { id: exercici.id } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Fitxa de ${exercici.nom}`}
        style={({ pressed }) => [estils.plena, pressed ? { opacity: 0.85 } : null]}
      >
        <Targeta estil={[estils.targeta, { backgroundColor: fonsBloc(exercici.bloc) }]}>
          <Text style={estils.eyebrow}>{`EXERCICI ${exercici.ordre} DE ${delBloc}`}</Text>
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
  // Que la llista s'encongeixi és el que deixa lloc a la barra de pestanyes de
  // mòbil, que n'és germana. Ja ho feia sense dir-ho —la base de `ScrollView` a
  // web ho resol per ordre del full—, però val més escriure-ho que dependre'n.
  desplacador: { flex: 1 },
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
  grupBloc: { gap: espai.m },
  capcaleraBloc: { flexDirection: 'row', alignItems: 'center', gap: espai.s },
  mostraBloc: { width: 10, height: 10, borderRadius: 3 },
  nomBlocGrup: { ...text.encapcalamentSeccio, flex: 1 },
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
