/**
 * Pantalla `5b` — llista de gossos.
 *
 * A web és una taula; a mòbil, les mateixes dades com a targetes amb la barra de
 * progrés a sota. No és una taula amb columnes amagades: la informació és la
 * mateixa i el que canvia és com s'ordena a la pantalla.
 *
 * Els retards es marquen posant l'última sessió en vermell. És l'únic senyal
 * d'alarma de la pantalla, i per això no en porta cap altre de decoratiu.
 */

import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import type { Dog, EstatGos } from '@vincle/shared-types';
import { ETIQUETA_ESTAT_GOS } from '@vincle/shared-types';
import {
  DIES_DES_DE_LA_SESSIO, FITES_PER_GOS, GOSSOS, edat, ultimaSessio,
} from '../dades/fixtures.ts';
import {
  BarraNavegacio, BarraProgres, Seccio, Targeta, Xip,
  color, espai, familia, radi, text, tinta, useTrencament,
} from '../disseny/index.ts';

const PESTANYES = [
  { etiqueta: 'Gossos', desti: '/gossos' as const },
  { etiqueta: 'Races', desti: '/compatibilitats' as const },
  { etiqueta: 'Compatibilitats', desti: '/compatibilitats' as const },
  { etiqueta: 'Sessions', desti: '/gossos' as const },
];

type Filtre = EstatGos | 'tots';

/** Color de l'estat, segons el codi del handoff. */
const TO_ESTAT: Record<EstatGos, 'exit' | 'calid' | 'actiu'> = {
  ensinistrament: 'exit',
  avaluacio: 'calid',
  assignat: 'actiu',
};

export default function Gossos() {
  const { esMobil } = useTrencament();
  const [cerca, setCerca] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tots');

  const visibles = useMemo(() => {
    const text = cerca.trim().toLowerCase();
    return GOSSOS.filter((g) => {
      const passaFiltre = filtre === 'tots' || g.estat === filtre;
      const passaCerca = text === ''
        || g.nom.toLowerCase().includes(text)
        || (g.breedNom ?? '').toLowerCase().includes(text);
      return passaFiltre && passaCerca;
    });
  }, [cerca, filtre]);

  const compta = (estat: Filtre) =>
    estat === 'tots' ? GOSSOS.length : GOSSOS.filter((g) => g.estat === estat).length;

  return (
    <SafeAreaView style={estils.pantalla} edges={['top']}>
      {!esMobil ? <BarraNavegacio pestanyes={PESTANYES} activa="Gossos" /> : null}

      <ScrollView contentContainerStyle={estils.contingut}>
        <View style={estils.encapcalament}>
          <Text style={esMobil ? text.titolMobil : text.titolWeb}>Gossos en seguiment</Text>

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
              <Xip
                key={f}
                to={f === filtre ? 'actiu' : 'neutre'}
                onPress={() => setFiltre(f)}
              >
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
        ) : null}

        {esMobil
          ? visibles.map((g) => <TargetaGos key={g.id} gos={g} />)
          : <Taula gossos={visibles} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Web: taula
// ---------------------------------------------------------------------------

function Taula({ gossos }: { gossos: Dog[] }) {
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

      {gossos.map((gos) => {
        const fites = FITES_PER_GOS[gos.id] ?? { assolides: 0, total: 1 };
        const sessio = ultimaSessio(gos.id);

        return (
          <View key={gos.id} style={estils.fila}>
            <View style={estils.colAvatar}>
              <Avatar nom={gos.nom} />
            </View>

            <View style={estils.colGos}>
              <Text style={text.nomLlista}>{gos.nom}</Text>
              <Text style={text.metadada}>
                {`${gos.breedNom ?? 'raça desconeguda'} · ${edat(gos.dataNaixement)}`}
              </Text>
            </View>

            <View style={estils.colEstat}>
              <Xip to={TO_ESTAT[gos.estat]}>{ETIQUETA_ESTAT_GOS[gos.estat]}</Xip>
            </View>

            <View style={estils.colFites}>
              <BarraProgres fraccio={fites.assolides / fites.total} to="oliva" />
              <Text style={text.metadadaFort}>{`${fites.assolides}/${fites.total}`}</Text>
            </View>

            <Text style={[
              estils.colSessio, text.metadada,
              sessio.retard && { color: color.vermell },
            ]}>
              {sessio.text}
            </Text>

            <Link href="/gossos" style={estils.colAccio}>
              <Text style={estils.enllacObre}>Obre</Text>
            </Link>
          </View>
        );
      })}
    </Targeta>
  );
}

// ---------------------------------------------------------------------------
// Mòbil: targetes
// ---------------------------------------------------------------------------

function TargetaGos({ gos }: { gos: Dog }) {
  const fites = FITES_PER_GOS[gos.id] ?? { assolides: 0, total: 1 };
  const sessio = ultimaSessio(gos.id);

  return (
    <Targeta mobil>
      <View style={estils.capcaleraTargeta}>
        <Avatar nom={gos.nom} />
        <View style={estils.flexible}>
          <Text style={text.nomLlista}>{gos.nom}</Text>
          <Text style={text.metadada}>
            {`${gos.breedNom ?? 'raça desconeguda'} · ${edat(gos.dataNaixement)}`}
          </Text>
        </View>
        <Xip to={TO_ESTAT[gos.estat]}>{ETIQUETA_ESTAT_GOS[gos.estat]}</Xip>
      </View>

      <View style={estils.filaFites}>
        <View style={estils.flexible}>
          <BarraProgres fraccio={fites.assolides / fites.total} to="oliva" />
        </View>
        <Text style={text.metadadaFort}>{`${fites.assolides}/${fites.total}`}</Text>
      </View>

      <Text style={[text.metadada, sessio.retard && { color: color.vermell }]}>
        {`Darrera sessió: ${sessio.text}`}
      </Text>
    </Targeta>
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
  encapcalament: { gap: espai.m, marginBottom: espai.xs },
  cerca: {
    height: 44, borderRadius: 10,
    backgroundColor: color.blanc,
    borderWidth: 1, borderColor: tinta.voraCamp,
    paddingHorizontal: espai.ml,
    fontFamily: familia.sans, fontSize: 14, color: color.tinta,
  },
  filtres: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs },
  flexible: { flex: 1 },

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
  colFites: { width: 140, gap: espai.xxs },
  colSessio: { width: 110 },
  colAccio: { width: 50 },
  enllacObre: { ...text.navegacio, color: color.vermell },

  capcaleraTargeta: { flexDirection: 'row', alignItems: 'center', gap: espai.m },
  filaFites: { flexDirection: 'row', alignItems: 'center', gap: espai.m },

  avatar: {
    backgroundColor: color.sorra,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radi.pindola,
  },
  avatarLletra: { fontFamily: familia.serif, color: color.granat },
});
