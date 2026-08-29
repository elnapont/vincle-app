/**
 * Barra de navegació web de 60px.
 *
 * La pestanya activa va en vermell amb un subratllat de 2px enganxat a la vora
 * inferior de la barra. A mòbil no es dibuixa: allà la navegació és la barra de
 * pestanyes inferior.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { color, espai, radi, tinta } from './tokens.ts';
import { familia, text } from './tipografia.ts';

export interface Pestanya {
  etiqueta: string;
  desti: Href;
}

export function BarraNavegacio({
  pestanyes, activa, usuari = 'Elna Roca',
}: {
  pestanyes: Pestanya[];
  /** Etiqueta de la pestanya activa. */
  activa: string;
  usuari?: string;
}) {
  const inicials = usuari.split(' ').map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();

  return (
    <View style={estils.barra}>
      <View style={estils.esquerra}>
        <View style={estils.marca}>
          <View style={estils.logotip}>
            <Text style={estils.logotipLletra}>V</Text>
          </View>
          <Text style={estils.nomMarca}>Vincle</Text>
        </View>

        {pestanyes.map((pestanya) => {
          const esActiva = pestanya.etiqueta === activa;
          return (
            <Link key={pestanya.etiqueta} href={pestanya.desti} style={estils.pestanya}>
              <Text style={esActiva ? text.navegacioActiva : text.navegacio}>
                {pestanya.etiqueta}
              </Text>
            </Link>
          );
        })}
      </View>

      <View style={estils.marca}>
        <Text style={text.navegacio}>{usuari}</Text>
        <View style={estils.avatar}>
          <Text style={estils.avatarText}>{inicials}</Text>
        </View>
      </View>
    </View>
  );
}

const estils = StyleSheet.create({
  barra: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espai.xxxl,
    backgroundColor: color.blanc,
    borderBottomWidth: 1,
    borderBottomColor: tinta.vora,
  },
  esquerra: { flexDirection: 'row', alignItems: 'center', gap: espai.xxl },
  marca: { flexDirection: 'row', alignItems: 'center', gap: espai.s },
  logotip: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: color.granat,
    alignItems: 'center', justifyContent: 'center',
  },
  logotipLletra: { fontFamily: familia.serif, fontSize: 16, color: color.sorra },
  nomMarca: { ...text.nomLlista, fontSize: 14 },
  pestanya: { paddingVertical: espai.xs },
  avatar: {
    width: 30, height: 30, borderRadius: radi.pindola,
    backgroundColor: color.sorra,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...text.nomLlista, fontSize: 12, color: color.granat },
});
