/**
 * Pantalla `5a` — panell d'inici de l'entrenadora.
 *
 * Respon a tres preguntes en aquest ordre: com van les coses, què toca avui, i
 * què reclama atenció. Les quatre mètriques van amb el codi de color del
 * handoff: les fites del mes en oliva perquè són l'èxit, les incidències obertes
 * en vermell perquè són el que s'ha de mirar.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { AGENDA_AVUI, ATENCIO, GOSSOS, METRIQUES } from '../dades/fixtures.ts';
import { Avatar } from './gossos.tsx';
import {
  BarraNavegacio, Boto, Seccio, Targeta,
  color, espai, text, tinta, useTrencament,
} from '../disseny/index.ts';

const PESTANYES = [
  { etiqueta: 'Gossos', desti: '/gossos' as const },
  { etiqueta: 'Races', desti: '/compatibilitats' as const },
  { etiqueta: 'Compatibilitats', desti: '/compatibilitats' as const },
  { etiqueta: 'Sessions', desti: '/gossos' as const },
];

export default function Inici() {
  const { esMobil, lateralASobre } = useTrencament();
  const avui = new Date().toLocaleDateString('ca-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const nomGos = (id: string) => GOSSOS.find((g) => g.id === id)?.nom ?? '';

  return (
    <SafeAreaView style={estils.pantalla} edges={['top']}>
      {!esMobil ? <BarraNavegacio pestanyes={PESTANYES} activa="Gossos" /> : null}

      <ScrollView contentContainerStyle={estils.contingut}>
        <View style={estils.salutacio}>
          <Text style={estils.data}>{avui.toUpperCase()}</Text>
          <Text style={esMobil ? text.titolMobil : text.titolWeb}>Bon dia, Elna</Text>
        </View>

        <View style={estils.metriques}>
          <Metrica valor={METRIQUES.gossosEnSeguiment} etiqueta="Gossos en seguiment" />
          <Metrica valor={METRIQUES.sessionsSetmana} etiqueta="Sessions aquesta setmana" />
          <Metrica valor={METRIQUES.fitesDelMes} etiqueta="Fites aquest mes" to="oliva" />
          <Metrica valor={METRIQUES.incidenciesObertes} etiqueta="Incidències obertes" to="vermell" />
        </View>

        <View style={[estils.columnes, lateralASobre && estils.apilades]}>
          <View style={estils.principal}>
            <Seccio>Agenda d'avui</Seccio>
            {AGENDA_AVUI.map((cita, i) => (
              <Targeta key={cita.hora} mobil={esMobil} franja={i === 0 ? 'oliva' : null}>
                <View style={estils.cita}>
                  <Text style={estils.hora}>{cita.hora}</Text>
                  <Avatar nom={nomGos(cita.gosId)} mida={36} />
                  <View style={estils.flexible}>
                    <Text style={text.nomLlista}>{nomGos(cita.gosId)}</Text>
                    <Text style={text.metadada}>{cita.titol}</Text>
                  </View>
                  {i === 0 ? (
                    <Boto titol="Comença" estil={estils.botoComenca} />
                  ) : null}
                </View>
              </Targeta>
            ))}
          </View>

          <View style={[estils.lateral, lateralASobre && estils.plena]}>
            <Targeta mobil={esMobil}>
              <Seccio>Necessita atenció</Seccio>
              {ATENCIO.map((a) => (
                <View key={a.gosId + a.motiu} style={estils.avis}>
                  <View style={[
                    estils.punt,
                    { backgroundColor: a.urgent ? color.vermell : color.sorra },
                  ]} />
                  <View style={estils.flexible}>
                    <Text style={estils.nomAvis}>{nomGos(a.gosId)}</Text>
                    <Text style={text.metadada}>{a.motiu}</Text>
                  </View>
                </View>
              ))}
            </Targeta>

            <Targeta mobil={esMobil} franja="absencia">
              <Seccio>Busques una raça?</Seccio>
              <Text style={text.cosSecundari}>
                El qüestionari de compatibilitat parteix del trastorn i et diu per on
                començar a mirar.
              </Text>
              <Link href="/questionari" asChild>
                <Boto titol="Fes el qüestionari" to="sobreGranat" />
              </Link>
            </Targeta>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metrica({
  valor, etiqueta, to = 'tinta',
}: {
  valor: number;
  etiqueta: string;
  to?: 'tinta' | 'oliva' | 'vermell';
}) {
  const colorXifra = to === 'oliva' ? color.oliva : to === 'vermell' ? color.vermell : color.tinta;

  return (
    <View style={estils.metrica}>
      <Text style={[text.metrica, { color: colorXifra }]}>{valor}</Text>
      <Text style={estils.etiquetaMetrica}>{etiqueta}</Text>
    </View>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: {
    padding: espai.xxl, gap: espai.xl,
    maxWidth: 1180, width: '100%', alignSelf: 'center',
  },
  salutacio: { gap: espai.xxs },
  data: { ...text.escalaBarra },

  metriques: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.m },
  metrica: {
    flexGrow: 1, flexBasis: 160,
    backgroundColor: color.blanc,
    borderWidth: 1, borderColor: tinta.vora,
    borderRadius: 12, padding: espai.l, gap: espai.xxs,
  },
  etiquetaMetrica: { ...text.cosSecundari, fontSize: 12.5 },

  columnes: { flexDirection: 'row', gap: espai.xl, alignItems: 'flex-start' },
  apilades: { flexDirection: 'column' },
  principal: { flex: 1, gap: espai.m, minWidth: 0 },
  lateral: { width: 300, gap: espai.m },
  plena: { width: '100%' },

  cita: { flexDirection: 'row', alignItems: 'center', gap: espai.m },
  hora: { ...text.metadadaFort, color: color.tinta, width: 44 },
  botoComenca: { paddingHorizontal: espai.l },
  flexible: { flex: 1, minWidth: 0 },

  avis: { flexDirection: 'row', alignItems: 'flex-start', gap: espai.s },
  punt: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  nomAvis: { ...text.cosSecundari, color: color.tinta },
});
