/**
 * Gràfic de barres agrupades: sessions per mes i per bloc d'exercicis.
 *
 * Dibuixat amb vistes i no amb cap llibreria de gràfics. Amb un gràfic sol i tan
 * simple, una dependència de gràfics pesaria més que el codi que estalvia, i a
 * més cap d'elles respecta els tokens del sistema sense lluitar-hi.
 *
 * El handoff parlava de tres sèries fixes —obediència, socialització i tasca
 * específica—, que eren les categories que es van substituir pels cinc blocs
 * (§6.1). Les sèries són ara els blocs que tenen sessions: dibuixar-ne cinc de
 * fixes quan quatre estan buits ompliria la llegenda de soroll.
 */

import { StyleSheet, Text, View } from 'react-native';
import { color, colorBlocSuau, espai, radi, tinta } from './tokens.ts';
import { text } from './tipografia.ts';

export interface PuntEvolucio {
  /** Etiqueta curta del mes: «mar.», «abr.»… */
  mes: string;
  /** Sessions d'aquell mes per bloc, indexades pel número de bloc. */
  perBloc: Map<number, number>;
}

export function GraficEvolucio({
  punts, blocs, alcada = 180,
}: {
  punts: PuntEvolucio[];
  /** Blocs amb sessions, amb el seu nom, en ordre. */
  blocs: { bloc: number; nom: string }[];
  alcada?: number;
}) {
  const maxim = Math.max(
    1,
    ...punts.flatMap((p) => [...p.perBloc.values()]),
  );

  // El color surt del número de bloc i no de la posició a la llegenda: així el
  // bloc 2 és del mateix color aquí i al catàleg d'exercicis, encara que aquí
  // només se'n dibuixin alguns. S'agafa la versió rebaixada: el to ple, en un
  // gràfic d'aquesta mida, resulta massa fort.
  const colorDe = (bloc: number) => (bloc === 0 ? color.sorra : colorBlocSuau(bloc));

  return (
    <View style={estils.contenidor}>
      <View style={[estils.zona, { height: alcada }]}>
        {punts.map((punt) => {
          const total = [...punt.perBloc.values()].reduce((a, b) => a + b, 0);

          return (
            <View key={punt.mes} style={estils.grup}>
              <View style={estils.barres}>
                {blocs.map((b) => {
                  const valor = punt.perBloc.get(b.bloc) ?? 0;
                  return (
                    <View
                      key={b.bloc}
                      style={[
                        estils.barra,
                        {
                          // Alçada mínima d'1px quan hi ha zero: així es veu que
                          // la columna existeix i el mes no s'ha saltat.
                          height: valor === 0 ? 1 : Math.max(3, (valor / maxim) * (alcada - 26)),
                          backgroundColor: valor === 0 ? tinta.pistaEix : colorDe(b.bloc),
                        },
                      ]}
                      accessibilityLabel={`${b.nom}, ${punt.mes}: ${valor} sessions`}
                    />
                  );
                })}
              </View>
              <Text style={estils.etiquetaMes}>{punt.mes}</Text>
              <Text style={estils.totalMes}>{total || ''}</Text>
            </View>
          );
        })}
      </View>

      <View style={estils.llegenda}>
        {blocs.map((b) => (
          <View key={b.bloc} style={estils.itemLlegenda}>
            <View style={[estils.mostra, { backgroundColor: colorDe(b.bloc) }]} />
            <Text style={text.metadada}>{b.nom}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const estils = StyleSheet.create({
  contenidor: { gap: espai.m },
  zona: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: espai.s,
    borderBottomWidth: 1,
    borderBottomColor: tinta.vora,
    paddingBottom: espai.xs,
  },
  grup: { flex: 1, alignItems: 'center', gap: espai.xxs },
  barres: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, minHeight: 1 },
  barra: { width: 10, borderTopLeftRadius: radi.barra, borderTopRightRadius: radi.barra },
  etiquetaMes: { ...text.escalaBarra },
  totalMes: { ...text.metadadaFort, fontSize: 11, color: color.tinta },
  llegenda: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.m },
  itemLlegenda: { flexDirection: 'row', alignItems: 'center', gap: espai.xs },
  mostra: { width: 10, height: 10, borderRadius: 3 },
});
