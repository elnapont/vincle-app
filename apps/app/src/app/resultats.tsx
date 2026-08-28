/**
 * Pantalla `7d` — rànquing de compatibilitat (variant llista).
 *
 * Ensenya percentatge, posició, tres eixos destacats i el microcopy de lectura.
 * Els tres eixos que es mostren no són fixos: són **els tres de més pes del
 * perfil del trastorn triat**, que són els que de debò ordenen el rànquing.
 *
 * Hi ha dues coses que semblen decoratives i no ho són. El **mesurador de
 * recorregut** situa la puntuació dins del rang que existeix de veritat, perquè
 * un 75 % sobre 100 sembla molt més del que és. I el **microcopy de lectura** diu
 * explícitament que la llista no tria una raça. Tots dos surten de la troballa
 * que els instruments d'avaluació de temperament encerten molt millor quins
 * gossos fracassaran que quins triomfaran: el rànquing descarta bé i tria regular.
 */

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { MatchResult, PerfilTrastorn } from '@vincle/shared-types';
import { ETIQUETA_EIX, ETIQUETA_TRASTORN_CURTA } from '@vincle/shared-types';
import { perfilDe, ranquing } from '@vincle/matching';
import { carregaCataleg } from '../dades/races.ts';
import { useQuestionari } from '../estat/Questionari.tsx';
import {
  BarraEix, Boto, CapcaleraPas, Esquelet, MesuradorRecorregut, Seccio, Targeta,
  color, espai, text, tinta,
} from '../disseny/index.ts';

/** Quants resultats es despleguen. A 844px de mòbil n'hi caben tres. */
const RESULTATS_VISIBLES = 3;

type Estat =
  | { fase: 'carregant' }
  | { fase: 'llest'; resultats: MatchResult[]; total: number; esCopiaCache: boolean; actualitzatEl: Date }
  | { fase: 'error'; missatge: string };

export default function Resultats() {
  const router = useRouter();
  const { perfil } = useQuestionari();
  const [estat, setEstat] = useState<Estat>({ fase: 'carregant' });

  useEffect(() => {
    if (!perfil) return;
    let viu = true;

    carregaCataleg()
      .then((cataleg) => {
        if (!viu) return;
        const resultats = ranquing(cataleg.races, perfilDe(perfil.trastorn), perfil);
        setEstat({
          fase: 'llest',
          resultats,
          total: cataleg.total,
          esCopiaCache: cataleg.esCopiaCache,
          actualitzatEl: cataleg.actualitzatEl,
        });
      })
      .catch((error: unknown) => {
        if (!viu) return;
        setEstat({
          fase: 'error',
          missatge: error instanceof Error ? error.message : 'Error desconegut',
        });
      });

    return () => { viu = false; };
  }, [perfil]);

  if (!perfil) {
    return (
      <SafeAreaView style={estils.pantalla} edges={['top', 'bottom']}>
        <CapcaleraPas pas={3} total={3} onEnrere={() => router.back()} />
        <View style={estils.contingut}>
          <Text style={text.cosSecundari}>Encara no hi ha cap trastorn triat.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const perfilTrastorn = perfilDe(perfil.trastorn);
  // Els tres eixos de més pes són els que expliquen l'ordre del rànquing.
  const eixosDestacats = [...perfilTrastorn.eixos]
    .sort((a, b) => b.pes - a.pes)
    .slice(0, 3);

  return (
    <SafeAreaView style={estils.pantalla} edges={['top', 'bottom']}>
      <CapcaleraPas pas={3} total={3} onEnrere={() => router.back()} />

      <ScrollView contentContainerStyle={estils.contingut}>
        <View style={estils.encapcalament}>
          <Text style={estils.eyebrow}>
            {ETIQUETA_TRASTORN_CURTA[perfil.trastorn]}
            {' · '}
            {eixosDestacats.map((e) => `${ETIQUETA_EIX[e.eix].toUpperCase()} ${e.pes}%`).join(' · ')}
          </Text>
          <Text style={text.titolMobil}>Races més compatibles</Text>
        </View>

        {estat.fase === 'carregant' ? <Carregant /> : null}

        {estat.fase === 'error' ? (
          <Targeta mobil franja="vermell">
            <Text style={text.nomLlista}>No hem pogut carregar el catàleg</Text>
            <Text style={text.cosSecundari}>{estat.missatge}</Text>
            <Boto titol="Torna-ho a provar" to="secundari" onPress={() => setEstat({ fase: 'carregant' })} />
          </Targeta>
        ) : null}

        {estat.fase === 'llest' ? (
          <>
            {estat.esCopiaCache ? <AvisCopia data={estat.actualitzatEl} /> : null}

            <Text style={text.metadada}>{estat.total} races avaluades</Text>

            {estat.resultats.slice(0, RESULTATS_VISIBLES).map((resultat, i) => (
              <FilaResultat
                key={resultat.breedId}
                resultat={resultat}
                perfil={perfilTrastorn}
                eixosDestacats={eixosDestacats.map((e) => e.eix)}
                primer={i === 0}
              />
            ))}

            <LecturaHonesta />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

function FilaResultat({
  resultat, perfil, eixosDestacats, primer,
}: {
  resultat: MatchResult;
  perfil: PerfilTrastorn;
  eixosDestacats: string[];
  primer: boolean;
}) {
  const senseDades = resultat.eixos.filter((e) => e.valor === null);
  // Si l'eix que falta no és cap dels tres visibles, cal dir quin és: si no,
  // l'usuari veu tres barres plenes i un comptador que diu «1 sense dades».
  const absentNoVisible = senseDades.find((e) => !eixosDestacats.includes(e.eix));

  return (
    <Targeta mobil franja={primer ? 'oliva' : 'vermell'}>
      <View style={estils.capcaleraFila}>
        <View style={estils.nomIPosicio}>
          <Text style={text.nomLlista}>{resultat.nom}</Text>
          <Text style={text.metadadaFort}>
            {`#${resultat.posicio} DE ${resultat.totalAvaluades}`}
            {resultat.eixosSenseDades > 0
              ? ` · ${resultat.eixosSenseDades} DE 8 SENSE DADES`
              : ''}
          </Text>
        </View>
        <Text style={[estils.puntuacio, { color: primer ? color.oliva : color.vermell }]}>
          {resultat.puntuacio.toFixed(1).replace('.', ',')}%
        </Text>
      </View>

      {primer ? <MesuradorRecorregut puntuacio={resultat.puntuacio} primer /> : null}

      {absentNoVisible ? (
        <Text style={estils.vuiteEix}>
          {`8è EIX · ${ETIQUETA_EIX[absentNoVisible.eix].toUpperCase()} SENSE DADES`}
        </Text>
      ) : null}

      <View style={estils.eixos}>
        {eixosDestacats.map((eix) => {
          const derivat = resultat.eixos.find((e) => e.eix === eix);
          const pesEix = perfil.eixos.find((e) => e.eix === eix);
          return (
            <BarraEix
              key={eix}
              eix={eix as never}
              valor={derivat?.valor ?? null}
              direccio={pesEix?.direccio ?? 'suma'}
            />
          );
        })}
      </View>

      {resultat.penalitzacio ? (
        <Text style={estils.penalitzacio}>{resultat.penalitzacio}</Text>
      ) : null}
    </Targeta>
  );
}

/**
 * Microcopy obligatori del handoff. No és decoratiu: és el que evita que la
 * pantalla prometi més precisió de la que el model té.
 */
function LecturaHonesta() {
  return (
    <Targeta mobil franja="absencia">
      <Seccio>Com llegir-ho</Seccio>
      <Text style={text.cosSecundari}>
        Cap raça del catàleg no passa del 80 %: la llista diu per on començar a
        mirar, no quina raça triar.
      </Text>
    </Targeta>
  );
}

function AvisCopia({ data }: { data: Date }) {
  return (
    <Targeta mobil franja="vermell">
      <Text style={text.nomLlista}>No hem pogut actualitzar el catàleg</Text>
      <Text style={text.cosSecundari}>
        {`Es mostra la còpia del ${data.toLocaleDateString('ca-ES', {
          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
        })}.`}
      </Text>
    </Targeta>
  );
}

/** Esquelets amb els mateixos radis i alçades que el contingut real, mai un spinner. */
function Carregant() {
  return (
    <View style={estils.carregant}>
      {[1, 0.7, 0.45].map((opacitat, i) => (
        <Esquelet key={i} alcada={168} opacitat={opacitat} arrodonit={14} />
      ))}
      <Text style={text.metadada}>Calculant la compatibilitat…</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: { padding: espai.xl, paddingTop: espai.xl, gap: espai.m },
  encapcalament: { gap: espai.xs, marginBottom: espai.xs },
  eyebrow: { ...text.escalaBarra, color: color.olivaFosc },
  capcaleraFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: espai.m },
  nomIPosicio: { flex: 1, gap: 3 },
  puntuacio: { ...text.percentatgeFitxa, fontSize: 30, lineHeight: 32 },
  eixos: { gap: espai.s },
  vuiteEix: { ...text.escalaBarra, color: tinta.eixSenseDadesText },
  penalitzacio: { ...text.metadada, color: color.vermell },
  carregant: { gap: espai.m },
});
