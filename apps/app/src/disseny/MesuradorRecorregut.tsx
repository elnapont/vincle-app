/**
 * Mesurador de recorregut del rànquing.
 *
 * El rànquing real va del 41 % al 80 %, amb mitjana del 61 %: **cap raça del
 * catàleg no arriba al 80 %**. Una barra de 0 a 100 faria que un 75 % semblés un
 * veredicte quan en realitat vol dir «el millor que hi ha, i tampoc no gaire».
 *
 * El mesurador situa la puntuació dins del recorregut que existeix de debò, i les
 * tres etiquetes de sota diuen quin és aquest recorregut. És, juntament amb el
 * microcopy de lectura, el que evita que el disseny prometi més precisió de la
 * que el model té.
 */

import { StyleSheet, Text, View } from 'react-native';
import { alcadaBarra, color, espai, radi, tinta } from './tokens.ts';
import { text } from './tipografia.ts';

/**
 * Extrems mesurats sobre les 631 races i els sis trastorns
 * (`docs/diccionari/previsualitzacio-ranquing.md`). Si el diccionari o els perfils
 * canvien, s'han de tornar a calcular: la previsualització els torna a donar.
 */
export const RECORREGUT = { minim: 41, mitjana: 61, maxim: 80 } as const;

export function MesuradorRecorregut({
  puntuacio, primer = false,
}: {
  puntuacio: number;
  /** El primer resultat marca en oliva; la resta, en granat. */
  primer?: boolean;
}) {
  const fraccio = Math.max(0, Math.min(1,
    (puntuacio - RECORREGUT.minim) / (RECORREGUT.maxim - RECORREGUT.minim)));

  return (
    <View style={estils.contenidor}>
      <View style={estils.pista}>
        <View style={[estils.reple, { width: `${fraccio * 100}%` }]} />
        <View
          style={[
            estils.marca,
            { left: `${fraccio * 100}%`, backgroundColor: primer ? color.oliva : color.granat },
          ]}
        />
      </View>

      <View style={estils.escala}>
        <Text style={text.escalaBarra}>{RECORREGUT.minim}%</Text>
        <Text style={text.escalaBarra}>MITJANA {RECORREGUT.mitjana}%</Text>
        <Text style={text.escalaBarra}>{RECORREGUT.maxim}%</Text>
      </View>
    </View>
  );
}

const estils = StyleSheet.create({
  contenidor: { gap: espai.xxs },
  pista: {
    height: alcadaBarra.eix,
    backgroundColor: tinta.pistaEix,
    borderRadius: radi.barra,
    justifyContent: 'center',
  },
  reple: { height: '100%', backgroundColor: color.sorra, borderRadius: radi.barra },
  marca: {
    position: 'absolute',
    width: 3,
    height: alcadaBarra.eix + 6,
    marginLeft: -1.5,
    borderRadius: 2,
  },
  escala: { flexDirection: 'row', justifyContent: 'space-between' },
});
