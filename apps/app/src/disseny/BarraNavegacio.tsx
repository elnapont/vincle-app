/**
 * Barra de navegació web de 60px.
 *
 * La pestanya activa va en vermell amb un subratllat de 2px enganxat a la vora
 * inferior de la barra. A mòbil no es dibuixa: allà la navegació és la barra de
 * pestanyes inferior i les accions de compte viuen al peu del panell d'inici.
 *
 * Les destinacions surten de `seccions.ts`, compartides amb la barra de pestanyes
 * de mòbil. Una pantalla ha de dir on és, no quin és el menú.
 */

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SECCIONS_WEB } from './seccions.ts';
import { color, espai, radi, tinta } from './tokens.ts';
import { familia, text } from './tipografia.ts';

/** Alçada de la barra; el desplegable s'hi ancora just a sota. */
const ALCADA = 60;

export function BarraNavegacio({
  activa, usuari, onSortir,
}: {
  /**
   * Etiqueta de la pestanya on som. A l'inici no se'n passa cap: allà no som dins
   * de cap secció i el lloc on som el marca la marca, que hi porta.
   */
  activa?: string;
  /**
   * Qui ha entrat. Ve de fora i no té valor per defecte: abans hi havia un nom
   * escrit aquí dins, i la barra el mostrava entrés qui entrés.
   */
  usuari: string;
  /** Si es passa, l'avatar obre un desplegable amb l'acció de tancar la sessió. */
  onSortir?: () => void;
}) {
  const [obert, setObert] = useState(false);
  const inicials = usuari.split(' ').map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();

  const identitat = (
    <View style={estils.marca}>
      <Text style={text.navegacio}>{usuari}</Text>
      <View style={estils.avatar}>
        <Text style={estils.avatarText}>{inicials}</Text>
      </View>
    </View>
  );

  return (
    <View style={estils.barra}>
      <View style={estils.esquerra}>
        {/*
          La marca és la porta de l'inici: és on tothom la busca, i deixa que
          «Gossos» signifiqui sempre la llista de gossos.

          L'estil va a la vista de dins i no al `Link`. A web el `Link` és una
          àncora amb `display: inline`, així que posar-li direcció i separació no
          faria res; funciona perquè, com que és filla d'un contenidor flex, el
          navegador la tracta com un bloc. Fora d'un contenidor flex aquest mateix
          patró s'esclafa —ja ens va passar amb les files de la llista de gossos—,
          i per això qui disposa és sempre la vista.
        */}
        <Link href="/" accessibilityLabel="Vincle, ves a l'inici">
          <View style={estils.marca}>
            <View style={estils.logotip}>
              <Text style={estils.logotipLletra}>V</Text>
            </View>
            <Text style={estils.nomMarca}>Vincle</Text>
          </View>
        </Link>

        {SECCIONS_WEB.map((pestanya) => {
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

      {onSortir ? (
        <Pressable
          onPress={() => setObert(true)}
          accessibilityRole="button"
          accessibilityLabel="Obre el menú del compte"
          accessibilityState={{ expanded: obert }}
        >
          {identitat}
        </Pressable>
      ) : identitat}

      {/*
        El desplegable va dins d'un `Modal` i no d'una vista posicionada dins de la
        barra: així es dibuixa per damunt de tot i el fons captura el clic de fora
        per tancar-lo, que és el que s'espera d'un menú.
      */}
      <Modal
        visible={obert}
        transparent
        animationType="fade"
        onRequestClose={() => setObert(false)}
      >
        <Pressable
          style={estils.fons}
          onPress={() => setObert(false)}
          accessibilityLabel="Tanca el menú"
        >
          {/* La posició és fixa perquè la geometria de la barra també ho és:
              l'alçada i l'encoixinat lateral no canvien. */}
          <View style={estils.desplegable}>
            <Text style={estils.usuariMenu}>{usuari}</Text>
            <View style={estils.separador} />
            <Pressable
              onPress={() => { setObert(false); onSortir?.(); }}
              accessibilityRole="button"
              style={({ pressed }) => [estils.opcio, pressed && estils.opcioPremuda]}
            >
              <Text style={estils.textOpcio}>Tanca la sessió</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const estils = StyleSheet.create({
  barra: {
    height: ALCADA,
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

  fons: { flex: 1 },
  desplegable: {
    position: 'absolute',
    top: ALCADA + espai.xs,
    right: espai.xxxl,
    minWidth: 200,
    backgroundColor: color.blanc,
    borderWidth: 1,
    borderColor: tinta.vora,
    borderRadius: radi.targeta,
    paddingVertical: espai.xs,
  },
  usuariMenu: { ...text.metadada, paddingHorizontal: espai.m, paddingVertical: espai.xs },
  separador: { height: 1, backgroundColor: tinta.separador, marginVertical: espai.xxs },
  opcio: { paddingHorizontal: espai.m, paddingVertical: espai.s },
  opcioPremuda: { backgroundColor: tinta.fila },
  textOpcio: { ...text.navegacio, color: color.vermell },
});
