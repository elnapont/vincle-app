/**
 * Pantalla `5a` — panell d'inici de l'entrenadora.
 *
 * Respon a tres preguntes en aquest ordre: com van les coses, què toca avui, i
 * què reclama atenció. Les quatre mètriques van amb el codi de color del
 * handoff: les fites del mes en oliva perquè són l'èxit, les incidències obertes
 * en vermell perquè són el que s'ha de mirar.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { AGENDA_AVUI, ATENCIO } from '../dades/fixtures.ts';
import { useGossos } from '../dades/gossos.ts';
import { useSessions } from '../dades/sessions.ts';
import { Avatar } from './gossos/index.tsx';
import { useSessio } from '../estat/Sessio.tsx';
import {
  BarraNavegacio, BarraPestanyesMobil, Boto, Seccio, Targeta,
  color, espai, text, tinta, useTrencament,
} from '../disseny/index.ts';

export default function Inici() {
  const { esMobil, lateralASobre } = useTrencament();
  const { surt } = useSessio();
  const avui = new Date().toLocaleDateString('ca-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const { estat } = useGossos();
  const { estat: estatSessions } = useSessions();
  const gossos = estat.fase === 'llest' ? estat.gossos : [];

  // L'instant de referència es fixa en obrir la pantalla: llegir el rellotge a
  // cada dibuix faria que el recompte canviés sense que canviés cap dada.
  const [ara] = useState(() => Date.now());

  // Sessions dels últims set dies, comptades de les reals.
  const sessionsSetmana = estatSessions.fase === 'llest'
    ? estatSessions.sessions.filter((x) => ara - x.data.getTime() < 7 * 86400000).length
    : 0;

  // L'agenda i els avisos encara són dades de prova: no hi ha ni agenda ni taula
  // d'incidències. Es projecten sobre els gossos reals per posició, de manera que
  // ensenyin noms de debò; quan hi hagi les taules, això desapareix.
  const nomGos = (index: number) => gossos[index % Math.max(1, gossos.length)]?.nom ?? '—';
  const hiHaGossos = gossos.length > 0;

  return (
    <SafeAreaView style={estils.pantalla} edges={['top']}>
      {!esMobil ? <BarraNavegacio onSortir={surt} /> : null}

      <ScrollView style={estils.desplacador} contentContainerStyle={estils.contingut}>
        <View style={estils.salutacio}>
          <Text style={estils.data}>{avui.toUpperCase()}</Text>
          <Text style={esMobil ? text.titolMobil : text.titolWeb}>Bon dia, Elna</Text>
        </View>

        <View style={estils.metriques}>
          <Metrica valor={gossos.filter((g) => g.estat === 'ensinistrament').length} etiqueta="Gossos en seguiment" />
          <Metrica valor={sessionsSetmana} etiqueta="Sessions aquesta setmana" />
          <MetricaBuida etiqueta="Fites aquest mes" />
          <MetricaBuida etiqueta="Incidències obertes" />
        </View>

        <View style={[estils.columnes, lateralASobre && estils.apilades]}>
          <View style={estils.principal}>
            <Seccio>Agenda d'avui</Seccio>
            {hiHaGossos ? AGENDA_AVUI.map((cita, i) => (
              <Targeta key={cita.hora} mobil={esMobil} franja={i === 0 ? 'oliva' : null}>
                <View style={estils.cita}>
                  <Text style={estils.hora}>{cita.hora}</Text>
                  <Avatar nom={nomGos(i)} mida={36} />
                  <View style={estils.flexible}>
                    <Text style={text.nomLlista}>{nomGos(i)}</Text>
                    <Text style={text.metadada}>{cita.titol}</Text>
                  </View>
                  {i === 0 ? (
                    <Boto titol="Comença" estil={estils.botoComenca} />
                  ) : null}
                </View>
              </Targeta>
            )) : (
              <Targeta mobil={esMobil} franja="absencia">
                <Text style={text.cosSecundari}>
                  Encara no hi ha cap gos en seguiment, així que no hi ha agenda.
                </Text>
              </Targeta>
            )}
          </View>

          <View style={[estils.lateral, lateralASobre && estils.plena]}>
            <Targeta mobil={esMobil}>
              <Seccio>Necessita atenció</Seccio>
              {ATENCIO.map((a, i) => (
                <View key={a.motiu} style={estils.avis}>
                  <View style={[
                    estils.punt,
                    { backgroundColor: a.urgent ? color.vermell : color.sorra },
                  ]} />
                  <View style={estils.flexible}>
                    <Text style={estils.nomAvis}>{nomGos(i)}</Text>
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
                <Boto titol="Fes el qüestionari" to="sobreGranat" estil={estils.enllacBloc} />
              </Link>
            </Targeta>
          </View>
        </View>

        {esMobil ? (
          <Pressable onPress={surt} accessibilityRole="button" style={estils.peuSortir}>
            <Text style={estils.sortir}>Tanca la sessió</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {esMobil ? <BarraPestanyesMobil activa="Inici" /> : null}
    </SafeAreaView>
  );
}

/**
 * Mètrica que encara no es pot calcular: fites i incidències no tenen taula. Un
 * guionet i no un zero, pel mateix criteri de tot el producte.
 */
function MetricaBuida({ etiqueta }: { etiqueta: string }) {
  return (
    <View style={estils.metrica}>
      <Text style={[text.metrica, { color: tinta.eixSenseDadesGuionet }]}>—</Text>
      <Text style={estils.etiquetaMetrica}>{etiqueta}</Text>
    </View>
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
  // Que la llista s'encongeixi és el que deixa lloc a la barra de pestanyes de
  // mòbil, que n'és germana. Ja ho feia sense dir-ho —la base de `ScrollView` a
  // web ho resol per ordre del full—, però val més escriure-ho que dependre'n.
  desplacador: { flex: 1 },
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

  // Amplada sencera dins d'un enllaç: vegeu la nota del component Boto.
  enllacBloc: { width: '100%' },
  // A mòbil no hi ha barra de navegació: el logout va al peu del panell.
  peuSortir: { alignItems: 'center', paddingVertical: espai.l },
  sortir: { ...text.navegacio, color: color.vermell },
  avis: { flexDirection: 'row', alignItems: 'flex-start', gap: espai.s },
  punt: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  nomAvis: { ...text.cosSecundari, color: color.tinta },
});
