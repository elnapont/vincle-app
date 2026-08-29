/**
 * Pantalla `5b` — llista de gossos.
 *
 * A web és una taula; a mòbil, les mateixes dades com a targetes amb la barra de
 * progrés a sota. No és una taula amb columnes amagades: la informació és la
 * mateixa i el que canvia és com s'ordena a la pantalla.
 *
 * Els gossos són **dades reals** de Supabase, lligades a l'entrenador que hi ha
 * entrat. El progrés de fites, en canvi, encara no es pot calcular: el llistat de
 * fites és un dels pendents del §9. Fins que hi sigui, la columna mostra un
 * guionet en comptes d'un zero, pel mateix criteri que les barres d'eix sense
 * dades: no inventar el que no sabem.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import type { Dog, EstatGos } from '@vincle/shared-types';
import { ETIQUETA_ESTAT_GOS } from '@vincle/shared-types';
import { useGossos } from '../../dades/gossos.ts';
import { DIES_DE_RETARD, diesDes, quanVaSer, useSessions } from '../../dades/sessions.ts';
import { edat } from '../../dades/fixtures.ts';
import {
  BarraNavegacio, Boto, Esquelet, Targeta, Xip,
  color, espai, familia, radi, text, tinta, useTrencament,
} from '../../disseny/index.ts';

const PESTANYES = [
  { etiqueta: 'Gossos', desti: '/gossos' as const },
  { etiqueta: 'Races', desti: '/races' as const },
  { etiqueta: 'Compatibilitats', desti: '/compatibilitats' as const },
  { etiqueta: 'Exercicis', desti: '/exercicis' as const },
];

type Filtre = EstatGos | 'tots';

const TO_ESTAT: Record<EstatGos, 'exit' | 'calid' | 'actiu'> = {
  ensinistrament: 'exit',
  avaluacio: 'calid',
  assignat: 'actiu',
};

export default function Gossos() {
  const { esMobil } = useTrencament();
  const router = useRouter();
  const { estat } = useGossos();
  const { estat: estatSessions } = useSessions();
  // L'instant de referència es fixa en obrir la pantalla: llegir el rellotge a
  // cada dibuix faria que el text canviés sense que canviés cap dada.
  const [ara] = useState(() => Date.now());
  const [cerca, setCerca] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tots');

  // El condicional va dins del useMemo: fora, crearia un array nou a cada dibuix
  // i el memo no serviria de res.
  const tots = useMemo(
    () => (estat.fase === 'llest' ? estat.gossos : []),
    [estat],
  );

  const visibles = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return tots.filter((g) => {
      const passaFiltre = filtre === 'tots' || g.estat === filtre;
      const passaCerca = q === ''
        || g.nom.toLowerCase().includes(q)
        || (g.breedNom ?? '').toLowerCase().includes(q);
      return passaFiltre && passaCerca;
    });
  }, [cerca, filtre, tots]);

  /**
   * Darrera sessió de cada gos. Es calcula aquí i no a la base de dades perquè les
   * sessions ja venen ordenades per data: la primera que es troba de cada gos és
   * la més recent.
   */
  const darreraSessio = useMemo(() => {
    const per = new Map<string, Date>();
    if (estatSessions.fase !== 'llest') return per;
    for (const s of estatSessions.sessions) {
      if (!per.has(s.gosId)) per.set(s.gosId, s.data);
    }
    return per;
  }, [estatSessions]);

  const compta = (e: Filtre) =>
    e === 'tots' ? tots.length : tots.filter((g) => g.estat === e).length;

  return (
    <SafeAreaView style={estils.pantalla} edges={['top']}>
      {!esMobil ? <BarraNavegacio pestanyes={PESTANYES} activa="Gossos" /> : null}

      <ScrollView contentContainerStyle={estils.contingut}>
        <View style={estils.capcalera}>
          <Text style={esMobil ? text.titolMobil : text.titolWeb}>Gossos en seguiment</Text>
          <Boto
            titol="Afegeix un gos"
            onPress={() => router.push('/gossos/nou')}
            estil={estils.botoAfegeix}
          />
        </View>

        {estat.fase === 'carregant' ? (
          <View style={estils.carregant}>
            {[1, 0.7, 0.45].map((o, i) => <Esquelet key={i} alcada={72} opacitat={o} />)}
          </View>
        ) : null}

        {estat.fase === 'error' ? (
          <Targeta mobil={esMobil} franja="vermell">
            <Text style={text.nomLlista}>No hem pogut carregar els gossos</Text>
            <Text style={text.cosSecundari}>{estat.missatge}</Text>
          </Targeta>
        ) : null}

        {estat.fase === 'llest' && tots.length === 0 ? <LlistaBuida /> : null}

        {estat.fase === 'llest' && tots.length > 0 ? (
          <>
            <View style={estils.controls}>
              <TextInput
                value={cerca}
                onChangeText={setCerca}
                placeholder="Cerca per nom o raça"
                placeholderTextColor={tinta.metadada}
                style={estils.cerca}
                accessibilityLabel="Cerca de gossos"
              />
              <View style={estils.filtres}>
                {(['tots', 'ensinistrament', 'avaluacio', 'assignat'] as Filtre[]).map((f) => (
                  <Xip key={f} to={f === filtre ? 'actiu' : 'neutre'} onPress={() => setFiltre(f)}>
                    {`${f === 'tots' ? 'Tots' : ETIQUETA_ESTAT_GOS[f]} ${compta(f)}`}
                  </Xip>
                ))}
              </View>
            </View>

            {visibles.length === 0 ? (
              <Targeta mobil={esMobil} franja="absencia">
                <Text style={text.nomLlista}>Cap gos coincideix</Text>
                <Text style={text.cosSecundari}>
                  Prova amb un altre nom o treu el filtre d'estat.
                </Text>
              </Targeta>
            ) : esMobil ? (
              visibles.map((g) => (
                <Link key={g.id} href={{ pathname: '/gossos/[id]', params: { id: g.id } }} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={`Fitxa de ${g.nom}`}>
                    <TargetaGos gos={g} darrera={darreraSessio.get(g.id)} ara={ara} />
                  </Pressable>
                </Link>
              ))
            ) : (
              <Taula gossos={visibles} darrera={darreraSessio} ara={ara} />
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Estat de llista buida de `5c`: marcador, titular, explicació i una sola acció. */
function LlistaBuida() {
  const router = useRouter();
  return (
    <Targeta franja="absencia" estil={estils.buida}>
      <View style={estils.marcadorBuit} />
      <Text style={estils.titolBuit}>Encara no hi ha cap gos</Text>
      <Text style={estils.textBuit}>
        Afegeix el primer gos en seguiment i podràs registrar-hi sessions, fites i
        incidències.
      </Text>
      <Boto titol="Afegeix un gos" onPress={() => router.push('/gossos/nou')} />
    </Targeta>
  );
}

// ---------------------------------------------------------------------------

function Taula({ gossos, darrera, ara }: { gossos: Dog[]; darrera: Map<string, Date>; ara: number }) {
  return (
    <Targeta estil={estils.taula}>
      <View style={estils.filaCapcalera}>
        <View style={estils.colAvatar} />
        <Text style={[estils.capcaleraText, estils.colGos]}>Gos</Text>
        <Text style={[estils.capcaleraText, estils.colEstat]}>Estat</Text>
        <Text style={[estils.capcaleraText, estils.colFites]}>Fites</Text>
        <Text style={[estils.capcaleraText, estils.colSessio]}>Darrera sessió</Text>
        <View style={estils.colAccio} />
      </View>

      {gossos.map((gos) => (
        <View key={gos.id} style={estils.fila}>
          <View style={estils.colAvatar}><Avatar nom={gos.nom} /></View>

          <View style={estils.colGos}>
            <Text style={text.nomLlista}>{gos.nom}</Text>
            <Text style={text.metadada}>
              {`${gos.breedNom ?? 'sense raça de referència'} · ${edat(gos.dataNaixement)}`}
            </Text>
          </View>

          <View style={estils.colEstat}>
            <Xip to={TO_ESTAT[gos.estat]}>{ETIQUETA_ESTAT_GOS[gos.estat]}</Xip>
          </View>

          <Text style={[estils.colFites, estils.senseFites]}>—</Text>

          <DarreraSessio data={darrera.get(gos.id)} ara={ara} estil={estils.colSessio} />

          <Link
            href={{ pathname: '/gossos/[id]', params: { id: gos.id } }}
            style={estils.colAccio}
          >
            <Text style={estils.enllacObre}>Obre</Text>
          </Link>
        </View>
      ))}
    </Targeta>
  );
}

function TargetaGos({ gos, darrera, ara }: { gos: Dog; darrera: Date | undefined; ara: number }) {
  return (
    <Targeta mobil>
      <View style={estils.capcaleraTargeta}>
        <Avatar nom={gos.nom} />
        <View style={estils.flexible}>
          <Text style={text.nomLlista}>{gos.nom}</Text>
          <Text style={text.metadada}>
            {`${gos.breedNom ?? 'sense raça de referència'} · ${edat(gos.dataNaixement)}`}
          </Text>
        </View>
        <Xip to={TO_ESTAT[gos.estat]}>{ETIQUETA_ESTAT_GOS[gos.estat]}</Xip>
      </View>
      <View style={estils.peuTargeta}>
        <DarreraSessio data={darrera} ara={ara} />
        {gos.familiaAcollida ? (
          <Text style={text.metadada} numberOfLines={1}>{gos.familiaAcollida}</Text>
        ) : null}
      </View>
    </Targeta>
  );
}

/**
 * Text de la darrera sessió. Els retards es marquen en vermell, que és l'únic
 * senyal d'alarma de la pantalla; sense cap sessió encara, un guionet, no un zero.
 */
function DarreraSessio({
  data, ara, estil,
}: {
  data: Date | undefined;
  ara: number;
  estil?: object;
}) {
  if (!data) return <Text style={[estil, estils.senseFites]}>—</Text>;

  const retard = diesDes(data, ara) > DIES_DE_RETARD;
  return (
    <Text style={[estil, text.metadada, retard && { color: color.vermell }]}>
      {quanVaSer(data, ara)}
    </Text>
  );
}

export function Avatar({ nom, mida = 40 }: { nom: string; mida?: number }) {
  return (
    <View style={[estils.avatar, { width: mida, height: mida, borderRadius: mida / 2 }]}>
      <Text style={[estils.avatarLletra, { fontSize: mida * 0.4 }]}>
        {nom.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: {
    padding: espai.xxl, gap: espai.m,
    maxWidth: 1180, width: '100%', alignSelf: 'center',
  },
  capcalera: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: espai.m, flexWrap: 'wrap',
  },
  botoAfegeix: { paddingHorizontal: espai.l },
  controls: { gap: espai.m },
  cerca: {
    height: 44, borderRadius: 10,
    backgroundColor: color.blanc,
    borderWidth: 1, borderColor: tinta.voraCamp,
    paddingHorizontal: espai.ml,
    fontFamily: familia.sans, fontSize: 14, color: color.tinta,
  },
  filtres: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs },
  flexible: { flex: 1, minWidth: 0 },
  carregant: { gap: espai.m },

  buida: { alignItems: 'center', gap: espai.m, paddingVertical: espai.xxl },
  marcadorBuit: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: tinta.pistaEix,
  },
  titolBuit: { fontFamily: familia.serif, fontSize: 21, color: color.tinta },
  textBuit: { ...text.cosSecundari, textAlign: 'center', maxWidth: 360 },

  taula: { padding: 0, gap: 0 },
  filaCapcalera: {
    flexDirection: 'row', alignItems: 'center', gap: espai.m,
    paddingHorizontal: espai.l, paddingVertical: espai.m,
    borderBottomWidth: 1, borderBottomColor: tinta.separador,
  },
  capcaleraText: { ...text.encapcalamentSeccio },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: espai.m,
    paddingHorizontal: espai.l, paddingVertical: espai.ml,
    borderBottomWidth: 1, borderBottomColor: tinta.separador,
  },
  colAvatar: { width: 40 },
  colGos: { flex: 1, gap: 2, minWidth: 0 },
  colEstat: { width: 150 },
  colFites: { width: 90 },
  colSessio: { width: 120 },
  colAccio: { width: 50 },
  senseFites: { ...text.metadadaFort, color: tinta.eixSenseDadesGuionet },
  enllacObre: { ...text.navegacio, color: color.vermell },

  capcaleraTargeta: { flexDirection: 'row', alignItems: 'center', gap: espai.m },
  peuTargeta: { flexDirection: 'row', justifyContent: 'space-between', gap: espai.m },

  avatar: {
    backgroundColor: color.sorra,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radi.pindola,
  },
  avatarLletra: { fontFamily: familia.serif, color: color.granat },
});
