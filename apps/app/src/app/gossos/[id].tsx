/**
 * Pantalla `2d` — fitxa de gos i evolució.
 *
 * Adaptada al que existeix, com les altres del tracking. El handoff demana una
 * línia de metadades amb el trastorn, tres mètriques que inclouen les fites, tres
 * sèries fixes al gràfic i una targeta d'incidència oberta.
 *
 * Els gossos no tenen trastorn —el trastorn és del pacient, no del gos, i viu al
 * qüestionari de matching—, les fites encara no existeixen (§9), les sèries són
 * els blocs del catàleg i no les tres categories antigues, i no hi ha taula
 * d'incidències. El que hi ha és el que es dibuixa.
 */

import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ETIQUETA_ESTAT_GOS } from '@vincle/shared-types';
import { BLOCS_CATALEG, EXERCICIS } from '../../dades/exercicis.ts';
import { useGossos } from '../../dades/gossos.ts';
import { edat } from '../../dades/fixtures.ts';
import { formataDurada, quanVaSer, useSessions, type Sessio } from '../../dades/sessions.ts';
import { calculaProgres } from '../../dades/progres.ts';
import { Avatar } from './index.tsx';
import {
  BarraNavegacio, Boto, Cami, Esquelet, GraficEvolucio, Seccio, Targeta, Xip,
  color, espai, familia, text, tinta, useTrencament,
  type PuntEvolucio,
} from '../../disseny/index.ts';

const PESTANYES = [
  { etiqueta: 'Gossos', desti: '/gossos' as const },
  { etiqueta: 'Races', desti: '/races' as const },
  { etiqueta: 'Compatibilitats', desti: '/compatibilitats' as const },
  { etiqueta: 'Exercicis', desti: '/exercicis' as const },
];

type Rang = 3 | 6 | 'tot';

export default function FitxaGos() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { esMobil, lateralASobre } = useTrencament();
  const { estat: estatGossos } = useGossos();
  const { estat: estatSessions } = useSessions(id);

  const [ara] = useState(() => Date.now());
  const [rang, setRang] = useState<Rang>(6);

  const gos = estatGossos.fase === 'llest'
    ? estatGossos.gossos.find((g) => g.id === id) ?? null
    : null;

  const sessions = useMemo(
    () => (estatSessions.fase === 'llest' ? estatSessions.sessions : []),
    [estatSessions],
  );

  /** Bloc de cada exercici, per agrupar-hi les sessions. */
  const blocDe = useMemo(() => {
    const per = new Map<string, number>();
    for (const e of EXERCICIS) per.set(e.id, e.bloc);
    return per;
  }, []);

  const { punts, blocsAmbSessions } = useMemo(
    () => construeixEvolucio(sessions, blocDe, rang, ara),
    [sessions, blocDe, rang, ara],
  );

  const progres = useMemo(() => calculaProgres(sessions), [sessions]);

  const metriques = useMemo(() => {
    const segons = sessions.reduce((a, s) => a + s.duracioSegons, 0);
    const exercicis = new Set(sessions.map((s) => s.exerciciId).filter(Boolean));
    return {
      sessions: sessions.length,
      hores: segons / 3600,
      exercicis: exercicis.size,
    };
  }, [sessions]);

  if (estatGossos.fase === 'carregant') {
    return (
      <Pantalla esMobil={esMobil}>
        <Esquelet alcada={120} />
        <Esquelet alcada={220} opacitat={0.7} />
      </Pantalla>
    );
  }

  if (!gos) {
    return (
      <Pantalla esMobil={esMobil}>
        <Text style={text.titolWeb}>Aquest gos no hi és</Text>
        <Boto titol="Torna a la llista" to="secundari" onPress={() => router.replace('/gossos')} />
      </Pantalla>
    );
  }

  return (
    <Pantalla esMobil={esMobil}>
      {/* Capçalera */}
      <View style={estils.capcalera}>
        <Avatar nom={gos.nom} mida={96} />
        <View style={estils.identitat}>
          <View style={estils.filaNom}>
            <Text style={estils.nom}>{gos.nom}</Text>
            <Xip to={gos.estat === 'ensinistrament' ? 'exit' : gos.estat === 'avaluacio' ? 'calid' : 'actiu'}>
              {ETIQUETA_ESTAT_GOS[gos.estat]}
            </Xip>
          </View>
          <Text style={text.metadada}>
            {[
              gos.breedNom ?? 'sense raça de referència',
              edat(gos.dataNaixement),
              gos.familiaAcollida,
            ].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Boto
          titol="Nova sessió"
          onPress={() => router.push({ pathname: '/sessions/nova', params: { gosId: gos.id } })}
          estil={estils.botoSessio}
        />
      </View>

      {/* Mètriques */}
      <View style={estils.metriques}>
        <Metrica valor={String(metriques.sessions)} etiqueta="Sessions" />
        <Metrica valor={metriques.hores.toFixed(1).replace('.', ',')} etiqueta="Hores" />
        <Metrica
          valor={`${progres.assolits}/${progres.total}`}
          etiqueta="Exercicis assolits"
        />
      </View>

      <View style={[estils.columnes, lateralASobre && estils.apilades]}>
        <View style={estils.principal}>
          <Targeta mobil={esMobil}>
            <View style={estils.filaSeccio}>
              <Seccio>El camí</Seccio>
              {progres.seguent ? (
                <Boto
                  titol={`Practica «${progres.seguent.nom}»`}
                  onPress={() => router.push({
                    pathname: '/sessions/nova',
                    params: { gosId: gos.id, exerciciId: progres.seguent!.id },
                  })}
                  estil={estils.botoSeguent}
                />
              ) : null}
            </View>

            {progres.total === 0 ? (
              <Text style={text.cosSecundari}>
                El catàleg d'exercicis encara s'està redactant.
              </Text>
            ) : (
              <Cami
                blocs={progres.blocs}
                seguentId={progres.seguent?.id ?? null}
                onObrir={(id) => router.push({ pathname: '/exercicis/[id]', params: { id } })}
              />
            )}
          </Targeta>

          <Targeta mobil={esMobil}>
            <View style={estils.filaSeccio}>
              <Seccio>Sessions per mes</Seccio>
              <View style={estils.rangs}>
                {([3, 6, 'tot'] as Rang[]).map((r) => (
                  <Xip key={String(r)} to={rang === r ? 'actiu' : 'neutre'} onPress={() => setRang(r)}>
                    {r === 'tot' ? 'Tot' : `${r} mesos`}
                  </Xip>
                ))}
              </View>
            </View>

            {sessions.length === 0 ? (
              <Text style={text.cosSecundari}>
                Encara no hi ha cap sessió registrada. El gràfic apareixerà amb la
                primera.
              </Text>
            ) : (
              <GraficEvolucio punts={punts} blocs={blocsAmbSessions} />
            )}
          </Targeta>
        </View>

        <View style={[estils.lateral, lateralASobre && estils.plena]}>
          <Targeta mobil={esMobil}>
            <Seccio>Darreres sessions</Seccio>
            {sessions.length === 0 ? (
              <Text style={text.cosSecundari}>Cap encara.</Text>
            ) : (
              sessions.slice(0, 6).map((s) => <FilaSessio key={s.id} sessio={s} ara={ara} />)
            )}
          </Targeta>
        </View>
      </View>
    </Pantalla>
  );
}

// ---------------------------------------------------------------------------

/**
 * Agrupa les sessions per mes i per bloc.
 *
 * Els mesos sense cap sessió es dibuixen igualment: un buit al gràfic diu tant
 * com una columna alta, i saltar-se'l faria semblar que la pràctica ha estat
 * contínua quan no ho ha estat.
 */
function construeixEvolucio(
  sessions: readonly Sessio[],
  blocDe: Map<string, number>,
  rang: Rang,
  ara: number,
): { punts: PuntEvolucio[]; blocsAmbSessions: { bloc: number; nom: string }[] } {
  if (sessions.length === 0) return { punts: [], blocsAmbSessions: [] };

  const clau = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const perMes = new Map<string, Map<number, number>>();
  const blocsVistos = new Set<number>();

  for (const s of sessions) {
    const bloc = s.exerciciId ? blocDe.get(s.exerciciId) ?? 0 : 0;
    blocsVistos.add(bloc);

    const k = clau(s.data);
    const mes = perMes.get(k) ?? new Map<number, number>();
    mes.set(bloc, (mes.get(bloc) ?? 0) + 1);
    perMes.set(k, mes);
  }

  // Quants mesos abraça el rang triat.
  const mesosTotals = rang === 'tot'
    ? mesosEntre(sessions[sessions.length - 1]!.data, ara) + 1
    : rang;

  const referencia = new Date(ara);
  const punts: PuntEvolucio[] = [];

  for (let i = mesosTotals - 1; i >= 0; i--) {
    const d = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1);
    punts.push({
      mes: d.toLocaleDateString('ca-ES', { month: 'short' }),
      perBloc: perMes.get(clau(d)) ?? new Map(),
    });
  }

  const blocsAmbSessions = [...blocsVistos]
    .sort((a, b) => a - b)
    .map((bloc) => ({
      bloc,
      // El bloc 0 és la bossa de les sessions lliures, sense exercici del catàleg.
      nom: bloc === 0
        ? 'Sessió lliure'
        : BLOCS_CATALEG.find((b) => b.bloc === bloc)?.nom ?? `Bloc ${bloc}`,
    }));

  return { punts, blocsAmbSessions };
}

function mesosEntre(desde: Date, ara: number): number {
  const fins = new Date(ara);
  return (fins.getFullYear() - desde.getFullYear()) * 12 + (fins.getMonth() - desde.getMonth());
}

function FilaSessio({ sessio, ara }: { sessio: Sessio; ara: number }) {
  return (
    <View style={estils.filaSessio}>
      <Text style={estils.dataSessio}>{quanVaSer(sessio.data, ara)}</Text>
      <View style={estils.flexible}>
        <Text style={text.cosSecundari} numberOfLines={1}>
          {sessio.exerciciNom ?? 'Sessió lliure'}
        </Text>
        <Text style={text.metadada}>
          {[
            formataDurada(sessio.duracioSegons),
            sessio.intentsTotals > 0
              ? `${sessio.repeticionsCorrectes}/${sessio.intentsTotals}`
              : null,
          ].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {sessio.valoracio ? (
        <Text style={estils.valoracio}>{'●'.repeat(sessio.valoracio - 1)}</Text>
      ) : null}
    </View>
  );
}

function Metrica({
  valor, etiqueta, apagada = false,
}: {
  valor: string;
  etiqueta: string;
  apagada?: boolean;
}) {
  return (
    <View style={estils.metrica}>
      <Text style={[text.metrica, apagada && { color: tinta.eixSenseDadesGuionet }]}>
        {valor}
      </Text>
      <Text style={estils.etiquetaMetrica}>{etiqueta}</Text>
    </View>
  );
}

function Pantalla({ children, esMobil }: { children: React.ReactNode; esMobil: boolean }) {
  return (
    <SafeAreaView style={estils.pantalla} edges={['top']}>
      {!esMobil ? <BarraNavegacio pestanyes={PESTANYES} activa="Gossos" /> : null}
      <ScrollView contentContainerStyle={estils.contingut}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: {
    padding: espai.xxl, gap: espai.l,
    maxWidth: 1180, width: '100%', alignSelf: 'center',
  },
  capcalera: { flexDirection: 'row', alignItems: 'center', gap: espai.l, flexWrap: 'wrap' },
  identitat: { flex: 1, gap: espai.xs, minWidth: 200 },
  filaNom: { flexDirection: 'row', alignItems: 'center', gap: espai.m, flexWrap: 'wrap' },
  nom: { fontFamily: familia.serif, fontSize: 36, lineHeight: 40, color: color.tinta },
  botoSessio: { paddingHorizontal: espai.l },

  metriques: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.m },
  metrica: {
    flexGrow: 1, flexBasis: 140,
    backgroundColor: color.blanc,
    borderWidth: 1, borderColor: tinta.vora,
    borderRadius: 12, padding: espai.l, gap: espai.xxs,
  },
  etiquetaMetrica: { ...text.cosSecundari, fontSize: 12.5 },

  columnes: { flexDirection: 'row', gap: espai.l, alignItems: 'flex-start' },
  apilades: { flexDirection: 'column' },
  principal: { flex: 1, minWidth: 0, gap: espai.l },
  lateral: { width: 320 },
  plena: { width: '100%' },
  flexible: { flex: 1, minWidth: 0 },

  filaSeccio: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: espai.m, flexWrap: 'wrap' },
  rangs: { flexDirection: 'row', gap: espai.xs },
  botoSeguent: { paddingHorizontal: espai.m, minHeight: 36 },

  filaSessio: {
    flexDirection: 'row', alignItems: 'center', gap: espai.m,
    paddingVertical: espai.xs,
    borderBottomWidth: 1, borderBottomColor: tinta.separador,
  },
  dataSessio: { ...text.metadadaFort, width: 76 },
  valoracio: { ...text.metadada, color: color.oliva, letterSpacing: 1 },
});
