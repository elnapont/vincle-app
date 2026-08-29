/**
 * Pantalla `7b` — fitxa de raça.
 *
 * Ensenya els **vuit valors** d'una raça: els set eixos derivats del temperament
 * més la longevitat. Tres coses la fan diferent d'una fitxa qualsevol:
 *
 *   - Els termes de `temperament` es mostren **en català**, traduïts amb el
 *     diccionari (§5.2.1). La traducció és un artefacte editable a
 *     `docs/diccionari/traduccions-ca.csv`, no text incrustat als components.
 *   - Els eixos sense dades es dibuixen com a absència, i a més **es diuen amb
 *     paraules** a la targeta «A tenir en compte». En una fitxa hi ha espai per
 *     explicar-ho, i és on més cal.
 *   - La compatibilitat va acompanyada de posició i mesurador, perquè un 68,7 %
 *     sobre una escala de 0 a 100 sembla molt més del que és.
 */

import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Breed, EixDerivat, Trastorn } from '@vincle/shared-types';
import {
  ETIQUETA_EIX, ETIQUETA_TRASTORN, TRASTORNS, etiquetaGrup,
} from '@vincle/shared-types';
import { TRADUCCIO_TERME, derivaEixos, perfilDe, ranquing } from '@vincle/matching';
import { useCataleg } from '../../dades/useCataleg.ts';
import { useQuestionari } from '../../estat/Questionari.tsx';
import {
  BarraEix, Boto, Esquelet, FotoRaca, MesuradorRecorregut, Seccio, Targeta, Xip,
  color, espai, text, tinta, useTrencament,
} from '../../disseny/index.ts';

/** Ordre de la graella de vuit valors, tal com el fixa el handoff. */
const ORDRE_EIXOS = [
  'entrenabilitat', 'sociabilitat', 'tolerancia-entorns', 'orientacio-persona',
  'longevitat', 'energia', 'calma', 'alerta',
] as const;

export default function FitxaRaça() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { estat, reintenta } = useCataleg();
  const { perfil } = useQuestionari();
  const { esMobil } = useTrencament();

  // Sense qüestionari respost, la fitxa es pot mirar igualment: s'ensenya la
  // compatibilitat amb el TEA, que és el primer trastorn de la llista.
  const trastorn: Trastorn = perfil?.trastorn ?? 'tea';

  const races = estat.fase === 'llest' ? estat.cataleg.races : null;
  const raça = races?.find((r) => r.id === id) ?? null;

  /**
   * Com encaixa la raça amb cadascun dels sis trastorns.
   *
   * Va abans dels returns primerencs de sota perquè és un hook: React exigeix
   * que se'n cridin sempre els mateixos i en el mateix ordre. Si estigués després
   * del `return` de l'estat de càrrega, al primer dibuix se'n cridarien tres i al
   * segon quatre, i l'aplicació peta en carregar el catàleg.
   *
   * La posició només té sentit dins del rànquing sencer, així que es calcula
   * sobre tot el catàleg i per als sis trastorns alhora: mirar una raça que
   * t'agrada i veure amb quin encaixa millor és l'altra direcció del matching.
   */
  const encaixos = useMemo(() => {
    if (!races || !raça) return [];
    return TRASTORNS
      .map((t) => {
        const r = ranquing(races, perfilDe(t), { pesMaximKg: null })
          .find((x) => x.breedId === raça.id);
        return r
          ? { trastorn: t, puntuacio: r.puntuacio, posicio: r.posicio, total: r.totalAvaluades }
          : null;
      })
      .filter((e) => e !== null)
      .sort((a, b) => b.puntuacio - a.puntuacio);
  }, [races, raça]);

  if (estat.fase === 'carregant') {
    return (
      <Pantalla>
        <Esquelet alcada={250} />
        <Esquelet alcada={180} opacitat={0.7} />
        <Text style={text.metadada}>Carregant la fitxa…</Text>
      </Pantalla>
    );
  }

  if (estat.fase === 'error') {
    return (
      <Pantalla>
        <Targeta franja="vermell">
          <Text style={text.nomLlista}>No hem pogut carregar el catàleg</Text>
          <Text style={text.cosSecundari}>{estat.missatge}</Text>
          <Boto titol="Torna-ho a provar" to="secundari" onPress={reintenta} />
        </Targeta>
      </Pantalla>
    );
  }

  if (!raça || encaixos.length === 0) {
    return (
      <Pantalla>
        <Text style={text.titolWeb}>Aquesta raça no és al catàleg</Text>
        <Boto titol="Torna" to="secundari" onPress={() => router.back()} />
      </Pantalla>
    );
  }

  const perfilTrastorn = perfilDe(trastorn);
  const eixos = derivaEixos(raça);
  const senseDades = eixos.filter((e) => e.valor === null);

  return (
    <Pantalla>
      <View style={[estils.columnes, esMobil && estils.columnesApilades]}>
        {/* Columna esquerra: imatge i dades de catàleg */}
        <View style={[estils.columnaEsquerra, esMobil && estils.plena]}>
          <FotoRaca url={raça.imatgeUrl} nom={raça.nom} />
          <Targeta>
            <Seccio>Dades de catàleg</Seccio>
            <FilaDada etiqueta="Grup" valor={etiquetaGrup(raça.grup)} />
            <FilaDada
              etiqueta="Pes mitjà adult"
              valor={raça.pesKg ? `${Math.round(raça.pesKg)} kg` : '—'}
            />
            <FilaDada
              etiqueta="Esperança de vida"
              valor={raça.anysVida ? `${raça.anysVida} anys` : '—'}
            />
            <FilaDada
              etiqueta="Alçada"
              valor={raça.alcadaCm ? `${Math.round(raça.alcadaCm)} cm` : '—'}
            />
            {raça.origen ? <FilaDada etiqueta="Origen" valor={raça.origen} /> : null}
          </Targeta>
        </View>

        {/* Columna dreta */}
        <View style={estils.columnaDreta}>
          <View style={estils.encapcalament}>
            <Text style={estils.eyebrow}>RAÇA · CATÀLEG</Text>
            <Text style={text.titolWeb}>{raça.nom}</Text>
            <View style={estils.xips}>
              {raça.termes.map((terme) => (
                <Xip key={terme} to="exit">{TRADUCCIO_TERME[terme] ?? terme}</Xip>
              ))}
            </View>
          </View>

          <Boto
            titol="Afegeix un gos d'aquesta raça"
            onPress={() => router.push({
              pathname: '/gossos/nou',
              params: { breedId: raça.id, breedNom: raça.nom },
            })}
            estil={estils.accio}
          />

          <Targeta>
            <Seccio>Eixos derivats del temperament, mida i longevitat</Seccio>
            <Text style={text.metadada}>
              {`diccionari v1.0 · ${raça.termes.length} de 49 termes · `}
              {`${senseDades.length} eixos sense dades`}
            </Text>
            <View style={[estils.graellaEixos, esMobil && estils.graellaUnaColumna]}>
              {ORDRE_EIXOS.map((eix) => (
                <View key={eix} style={esMobil ? estils.plena : estils.celaEix}>
                  <EixDeLaFitxa
                    eix={eix}
                    eixos={eixos}
                    raça={raça}
                    direccio={
                      perfilTrastorn.eixos.find((e) => e.eix === eix)?.direccio ?? 'suma'
                    }
                  />
                </View>
              ))}
            </View>
          </Targeta>

          <Targeta>
            <Seccio>Com encaixa amb cada trastorn</Seccio>
            <Text style={text.cosSecundari}>
              El matching sol anar del trastorn cap a les races. Aquí va al revés:
              tens una raça i vols saber per a què encaixa millor.
            </Text>

            {encaixos.map((e, i) => {
              const actiu = e.trastorn === trastorn;
              return (
                <View key={e.trastorn} style={estils.filaEncaix}>
                  <View style={estils.nomEncaix}>
                    <Text style={[estils.trastornNom, actiu && estils.trastornActiu]}>
                      {ETIQUETA_TRASTORN[e.trastorn]}
                    </Text>
                    <Text style={text.metadada}>{`#${e.posicio} de ${e.total}`}</Text>
                  </View>
                  <View style={estils.mesuradorEncaix}>
                    <MesuradorRecorregut puntuacio={e.puntuacio} primer={i === 0} />
                  </View>
                  <Text style={[
                    estils.percentatgeEncaix,
                    { color: i === 0 ? color.oliva : color.vermell },
                  ]}>
                    {e.puntuacio.toFixed(1).replace('.', ',')}%
                  </Text>
                </View>
              );
            })}

            <Text style={text.cosSecundari}>
              {explicacio(encaixos[0]!.trastorn, encaixos[0]!.puntuacio,
                encaixos[encaixos.length - 1]!.puntuacio)}
            </Text>
          </Targeta>

          <Targeta franja="absencia">
            <Seccio>A tenir en compte</Seccio>
            <Text style={text.cosSecundari}>{avisMetodologic(senseDades)}</Text>
            <Text style={text.metadada}>
              font: temperament · The Dog API · diccionari propi del projecte
            </Text>
          </Targeta>
        </View>
      </View>
    </Pantalla>
  );
}

// ---------------------------------------------------------------------------

/**
 * A la fitxa, la longevitat porta la dada en brut com a etiqueta: el valor 6,0
 * no diu res per si sol, «11 anys» sí.
 */
function EixDeLaFitxa({
  eix, eixos, raça, direccio,
}: {
  eix: (typeof ORDRE_EIXOS)[number];
  eixos: EixDerivat[];
  raça: Breed;
  direccio: 'suma' | 'resta';
}) {
  const derivat = eixos.find((e) => e.eix === eix);
  const etiqueta = eix === 'longevitat' && raça.anysVida
    ? `${ETIQUETA_EIX[eix]} · ${raça.anysVida} ANYS`
    : undefined;

  return (
    <BarraEix
      eix={eix}
      valor={derivat?.valor ?? null}
      direccio={eix === 'longevitat' ? 'suma' : direccio}
      detall="fitxa"
      etiqueta={etiqueta}
    />
  );
}

/**
 * Explica la diferència entre el millor i el pitjor encaix. Si és petita, vol dir
 * que la raça no està especialment indicada per a res en concret, i val més
 * dir-ho que deixar que el primer de la llista sembli una recomanació.
 */
function explicacio(millor: Trastorn, alt: number, baix: number): string {
  const marge = alt - baix;
  if (marge < 3) {
    return `Aquesta raça puntua gairebé igual per als sis trastorns: la diferència `
      + `entre el primer i l'últim és de només ${marge.toFixed(1).replace('.', ',')} punts. `
      + `Vol dir que el seu temperament no la fa especialment indicada per a cap en concret.`;
  }
  return `On millor encaixa és amb ${ETIQUETA_TRASTORN[millor].toLowerCase()}, amb `
    + `${marge.toFixed(1).replace('.', ',')} punts de diferència respecte de l'últim. `
    + `Cap raça del catàleg no passa del 80 %, així que aquestes xifres situen la raça dins `
    + `del rànquing i no diuen que sigui una bona tria per si sola.`;
}

/**
 * L'avís es diu amb paraules i es compta, que és el tercer nivell de detall del
 * patró «sense dades»: a les files n'hi ha prou amb el contorn i el guionet, però
 * en una fitxa hi ha espai per explicar què vol dir.
 */
function avisMetodologic(senseDades: EixDerivat[]): string {
  if (senseDades.length === 0) {
    return 'Els vuit valors s\'han pogut derivar. Tot i així, la puntuació surt d\'un '
      + 'diccionari de 49 termes fet a mà i és orientativa: serveix per descartar millor que '
      + 'per triar.';
  }
  const noms = senseDades.map((e) => ETIQUETA_EIX[e.eix].toLowerCase());
  const llista = noms.length === 1
    ? noms[0]
    : `${noms.slice(0, -1).join(', ')} i ${noms[noms.length - 1]}`;

  return `De vuit valors, ${senseDades.length} no els podem derivar: ${llista}. `
    + 'Vol dir que cap paraula del temperament que dona l\'API cau en aquests eixos, no que la '
    + 'raça hi puntuï baix. La puntuació és orientativa i serveix per descartar millor que per triar.';
}

function FilaDada({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estils.filaDada}>
      <Text style={text.etiquetaCamp}>{etiqueta}</Text>
      <Text style={estils.valorDada}>{valor}</Text>
    </View>
  );
}

function Pantalla({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={estils.pantalla} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={estils.contingut}>{children}</ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: {
    padding: espai.xxl, gap: espai.l,
    maxWidth: 1180, width: '100%', alignSelf: 'center',
  },
  columnes: { flexDirection: 'row', gap: espai.xxl, alignItems: 'flex-start' },
  columnesApilades: { flexDirection: 'column' },
  columnaEsquerra: { width: 330, gap: espai.l },
  columnaDreta: { flex: 1, gap: espai.l, minWidth: 0 },
  plena: { width: '100%' },
  imatge: {
    height: 250, borderRadius: 12,
    backgroundColor: '#e6ddd2',
    borderWidth: 1, borderColor: tinta.vora,
  },
  encapcalament: { gap: espai.s },
  eyebrow: { ...text.escalaBarra },
  xips: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs },
  accio: { alignSelf: 'flex-start', paddingHorizontal: espai.xl },
  graellaEixos: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.l },
  graellaUnaColumna: { flexDirection: 'column' },
  // Dues columnes: la meitat menys la meitat del buit.
  celaEix: { width: '48%' },
  filaDada: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', gap: espai.m,
  },
  valorDada: { ...text.cosSecundari, color: color.tinta },
  filaEncaix: { flexDirection: 'row', alignItems: 'center', gap: espai.m },
  nomEncaix: { width: 190, gap: 1 },
  trastornNom: { ...text.cosSecundari, fontSize: 13, color: color.tinta },
  trastornActiu: { fontFamily: text.nomLlista.fontFamily },
  mesuradorEncaix: { flex: 1, minWidth: 90 },
  percentatgeEncaix: { ...text.metadadaFort, fontSize: 13, width: 52, textAlign: 'right' },
});
