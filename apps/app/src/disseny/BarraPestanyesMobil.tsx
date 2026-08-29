/**
 * Barra de pestanyes inferior de mòbil.
 *
 * A mòbil no es dibuixa la barra superior, i fins ara això volia dir que des del
 * telèfon no es podia anar enlloc: «Compatibilitats» i «Exercicis» no tenien cap
 * altra porta i eren directament inabastables.
 *
 * Segueix el que diu el handoff per a la navegació mòbil —actiu en vermell, text
 * d'11px, res per sota de 44px tocable— amb dues divergències que cal anotar quan
 * es regeneri el disseny:
 *
 * - **Cinc elements i no quatre.** El quart del handoff era «Perfil», que és fora
 *   d'abast (no hi ha alta ni perfil d'usuari), i Vincle té cinc seccions reals.
 *   Deixar-ne una fora no la simplificaria: la faria inaccessible.
 * - **Les pestanyes no són d'amplada igual.** Cadascuna ocupa el que li demana el
 *   text, amb un mínim de 44px. Repartides a parts iguals, «Compatibilitats» no
 *   hi cabria i quedaria tallada; així cap etiqueta no s'ha d'abreujar ni inventar
 *   un nom curt que no coincidís amb el de la barra web.
 *
 * L'estat actiu es marca amb una línia de 2px a la vora de la barra, que és el
 * mateix recurs que fa servir la navegació web: allà a sota, aquí a dalt, sempre
 * enganxada al contingut.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SECCIONS } from './seccions.ts';
import { color, espai, tinta, TOCABLE_MINIM } from './tokens.ts';
import { text } from './tipografia.ts';

export function BarraPestanyesMobil({ activa }: { activa: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[estils.barra, { paddingBottom: insets.bottom }]}>
      {SECCIONS.map((seccio) => {
        const esActiva = seccio.etiqueta === activa;

        return (
          <Link
            key={seccio.etiqueta}
            href={seccio.desti}
            accessibilityRole="link"
            accessibilityState={{ selected: esActiva }}
            aria-current={esActiva ? 'page' : undefined}
            // A l'enllaç només hi van les propietats que el situen dins de la
            // barra. La disposició de dins va a la vista: a web això és una
            // àncora i el contenidor flex la converteix en bloc, no en flex, així
            // que `alignItems` i `justifyContent` posats aquí no farien res.
            style={estils.enllac}
          >
            <View style={estils.pestanya}>
              {/* La línia activa va dins de la pestanya i no a sobre de la barra,
                  perquè així se situa sola damunt de l'etiqueta que li toca. */}
              <View style={[estils.indicador, esActiva && estils.indicadorActiu]} />
              <Text
                numberOfLines={1}
                style={[estils.etiqueta, esActiva && estils.etiquetaActiva]}
              >
                {seccio.etiqueta}
              </Text>
            </View>
          </Link>
        );
      })}
    </View>
  );
}

const estils = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    backgroundColor: color.blanc,
    borderTopWidth: 1,
    borderTopColor: tinta.vora,
  },
  // `flexShrink` i no `flex`: cada pestanya ocupa el que li demana el text i
  // només s'encongeix si la pantalla és molt estreta. A parts iguals,
  // «Compatibilitats» quedaria tallada mentre «Races» sobraria espai.
  enllac: { flexShrink: 1, minWidth: TOCABLE_MINIM },
  pestanya: {
    minHeight: TOCABLE_MINIM,
    paddingHorizontal: espai.xs,
    paddingBottom: espai.s,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  indicador: { height: 2, alignSelf: 'stretch', backgroundColor: 'transparent' },
  indicadorActiu: { backgroundColor: color.vermell },
  etiqueta: {
    ...text.navegacio,
    fontSize: 11,
    marginTop: espai.s,
    textAlign: 'center',
  },
  etiquetaActiva: { ...text.navegacioActiva, fontSize: 11, marginTop: espai.s },
});
