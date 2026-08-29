/**
 * Pantalla de comprovació del sistema visual.
 *
 * No forma part del producte: serveix per veure d'un cop d'ull que els tokens, la
 * tipografia i els components primitius es dibuixen com marca el handoff, i
 * sobretot per comprovar els tres estats de la barra d'eix, que és el patró nou
 * de h2 i el més fàcil d'implementar malament.
 *
 * Es fa servir una raça real —el golden retriever— amb els seus valors derivats de
 * debò, inclosos els tres eixos que l'API no permet derivar. Així el que es veu
 * aquí és exactament el que veurà l'usuari.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Breed } from '@vincle/shared-types';
import { ETIQUETA_TRASTORN } from '@vincle/shared-types';
import { TRADUCCIO_TERME, derivaEixos, perfilDe, puntua } from '@vincle/matching';
import {
  BarraEix, Boto, Esquelet, Seccio, Targeta, Xip,
  color, espai, text, useTrencament,
} from '../disseny/index.ts';

const GOLDEN: Breed = {
  id: '69',
  nom: 'Golden Retriever',
  termes: ['friendly', 'intelligent', 'devoted', 'confident', 'loyal', 'eager to please'],
  grup: 'sporting',
  pesKg: 30,
  anysVida: 11,
  alcadaCm: 58,
  descripcio: null, historia: null, origen: 'Scotland', imatgeUrl: null,
};

export default function ComprovacioSistema() {
  const { format, amplada } = useTrencament();
  const perfil = perfilDe('tea');
  const eixos = derivaEixos(GOLDEN);
  const { puntuacio } = puntua(eixos, perfil);
  const senseDades = eixos.filter((e) => e.valor === null).length;

  // Direcció de cada eix segons el perfil, per pintar en sorra els invertits.
  const direccioDe = (eix: string) =>
    perfil.eixos.find((e) => e.eix === eix)?.direccio ?? 'suma';
  const pesDe = (eix: string) => perfil.eixos.find((e) => e.eix === eix)?.pes;

  return (
    <SafeAreaView style={estils.pantalla}>
      <ScrollView contentContainerStyle={estils.contingut}>
        <View style={estils.capcalera}>
          <Text style={text.titolMobil}>Comprovació del sistema</Text>
          <Text style={text.cosSecundari}>
            Tokens, tipografia i primitius del handoff h2. Format actual:{' '}
            <Text style={text.metadadaFort}>{format} · {Math.round(amplada)}px</Text>
          </Text>
        </View>

        {/* --- Barres d'eix amb dades reals ---------------------------------- */}
        <View style={estils.bloc}>
          <Seccio>Eixos derivats · {GOLDEN.nom}</Seccio>
          <Targeta mobil>
            <View style={estils.filaEntre}>
              <Text style={text.nomLlista}>{GOLDEN.nom}</Text>
              <Text style={text.metadadaFort}>
                {puntuacio.toFixed(1).replace('.', ',')} % · {ETIQUETA_TRASTORN.tea}
              </Text>
            </View>
            <Text style={text.metadada}>
              {`diccionari v1.0 · ${GOLDEN.termes.length} de 49 termes · `}
              {`${senseDades} eixos sense dades`}
            </Text>
            <View style={estils.eixos}>
              {eixos.map((e) => (
                <BarraEix
                  key={e.eix}
                  eix={e.eix}
                  valor={e.valor}
                  direccio={direccioDe(e.eix)}
                  pes={pesDe(e.eix)}
                  detall="fitxa"
                />
              ))}
            </View>
          </Targeta>
        </View>

        {/* --- Els tres estats, un al costat de l'altre ---------------------- */}
        <View style={estils.bloc}>
          <Seccio>Els tres estats de la barra</Seccio>
          <Targeta mobil>
            <BarraEix eix="sociabilitat" valor={9} detall="fitxa" />
            <BarraEix eix="alerta" valor={7.4} direccio="resta" detall="fitxa" />
            <BarraEix eix="calma" valor={null} detall="fitxa" />
            <Text style={text.cosSecundari}>
              Un valor derivat, un eix on interessa un valor baix i un eix sense dades.
              El tercer no té replè: l'absència es dibuixa com a absència.
            </Text>
          </Targeta>
        </View>

        {/* --- Xips i franges ------------------------------------------------ */}
        <View style={estils.bloc}>
          <Seccio>Xips</Seccio>
          <View style={estils.filaXips}>
            {GOLDEN.termes.map((t) => (
              <Xip key={t} to="exit">{TRADUCCIO_TERME[t] ?? t}</Xip>
            ))}
          </View>
          <View style={estils.filaXips}>
            <Xip to="actiu">TEA</Xip>
            <Xip to="neutre">Depressió</Xip>
            <Xip to="calid">En avaluació</Xip>
            <Xip to="alerta">Incidència oberta</Xip>
          </View>
        </View>

        <View style={estils.bloc}>
          <Seccio>Franja lateral com a codi de rang</Seccio>
          <Targeta mobil franja="oliva">
            <Text style={text.cos}>Millor resultat, pas en curs o exercici dominat.</Text>
          </Targeta>
          <Targeta mobil franja="vermell">
            <Text style={text.cos}>Següents resultats, alertes i incidències.</Text>
          </Targeta>
          <Targeta mobil franja="absencia">
            <Text style={text.cos}>No iniciat, advertiment o bloc de descartades.</Text>
          </Targeta>
        </View>

        {/* --- Botons i càrrega ---------------------------------------------- */}
        <View style={estils.bloc}>
          <Seccio>Botons</Seccio>
          <Boto titol="Veure compatibilitats" />
          <Boto titol="Entra" to="secundari" />
          <Boto titol="Desa" desactivat />
        </View>

        <View style={estils.bloc}>
          <Seccio>Càrrega</Seccio>
          <Esquelet alcada={64} />
          <Esquelet alcada={64} opacitat={0.7} />
          <Esquelet alcada={64} opacitat={0.45} />
          <Text style={text.metadada}>Calculant la compatibilitat…</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: { padding: espai.xxl, gap: espai.xxl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  capcalera: { gap: espai.s },
  bloc: { gap: espai.m },
  eixos: { gap: espai.m },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: espai.m },
  filaXips: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs },
});
