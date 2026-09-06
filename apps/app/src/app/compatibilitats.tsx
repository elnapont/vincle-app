/**
 * Pantalla `7c` — compatibilitats (web).
 *
 * Tres columnes: navegació, panell lateral de 270px i contingut. El panell té
 * **tres blocs separats a posta**, i la separació no és estètica: a h1 els pesos
 * del perfil i el filtre de pes es llegien com una sola llista, i això feia
 * pensar que la mida entrava a la puntuació. No hi entra (§5.2.4).
 *
 * El bloc final, «Les que descartaríem amb més confiança», respon a la troballa
 * de Bray et al. (2019): els instruments d'avaluació de temperament encerten el
 * 85–92 % dels gossos que fracassaran i només el 62–72 % dels que triomfaran. La
 * cua del rànquing és la part fiable, i el disseny li ha de donar pes en comptes
 * d'amagar-la.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import type { Breed, MatchResult, PerfilTrastorn, Trastorn } from '@vincle/shared-types';
import { ETIQUETA_EIX, ETIQUETA_TRASTORN_CURTA, TRASTORNS } from '@vincle/shared-types';
import { perfilDe, ranquing } from '@vincle/matching';
import { useCataleg } from '../dades/useCataleg.ts';
import type { CatalegRaces } from '../dades/races.ts';
import { PES } from '../dades/questionari.ts';
import { useSessio } from '../estat/Sessio.tsx';
import { exporta } from '../dades/exporta.ts';
import {
  BarraEix, BarraNavegacio, BarraPestanyesMobil, Boto, ControlLliscant, Esquelet, FotoRaca, Seccio, Targeta, Xip,
  alcadaBarra, color, espai, radi, text, tinta, useTrencament,
} from '../disseny/index.ts';

/** Quants resultats es despleguen abans d'aplanar la resta a una línia. */
const DESPLEGATS = 5;
const APLANATS = 8;
const DESCARTADES = 3;

export default function Compatibilitats() {
  const { estat, reintenta } = useCataleg();
  const { esMobil, lateralASobre } = useTrencament();
  const { usuari, surt } = useSessio();
  const [trastorn, setTrastorn] = useState<Trastorn>('tea');
  const [pesMaximKg, setPesMaximKg] = useState<number | null>(null);

  const perfil = perfilDe(trastorn);

  return (
    <SafeAreaView style={estils.pantalla} edges={['top']}>
      {!esMobil ? <BarraNavegacio usuari={usuari} activa="Compatibilitats" onSortir={surt} /> : null}

      <ScrollView
        style={estils.desplacador}
        contentContainerStyle={[estils.desplacament, esMobil && estils.desplacamentMobil]}
      >
        <View style={[estils.columnes, lateralASobre && estils.columnesApilades]}>
          <View style={[estils.lateral, lateralASobre && estils.plena]}>
            <PanellTrastorn actiu={trastorn} onTria={setTrastorn} />
            <PanellPesos perfil={perfil} />
            <PanellFiltre
              pesMaximKg={pesMaximKg}
              onCanvi={setPesMaximKg}
            />
          </View>

          <View style={estils.contingut}>
            {estat.fase === 'carregant' ? <Carregant /> : null}

            {estat.fase === 'error' ? (
              <Targeta franja="vermell">
                <Text style={text.nomLlista}>No hem pogut carregar el catàleg</Text>
                <Text style={text.cosSecundari}>{estat.missatge}</Text>
                <Boto titol="Torna-ho a provar" to="secundari" onPress={reintenta} />
              </Targeta>
            ) : null}

            {estat.fase === 'llest' ? (
              <Resultats
                cataleg={estat.cataleg}
                perfil={perfil}
                pesMaximKg={pesMaximKg}
                esMobil={esMobil}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>

      {esMobil ? <BarraPestanyesMobil activa="Compatibilitats" /> : null}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Panell lateral — tres blocs separats
// ---------------------------------------------------------------------------

function PanellTrastorn({
  actiu, onTria,
}: {
  actiu: Trastorn;
  onTria: (t: Trastorn) => void;
}) {
  return (
    <Targeta>
      <Seccio>Trastorn</Seccio>
      <View style={estils.xips}>
        {TRASTORNS.map((t) => (
          <Xip
            key={t}
            to={t === actiu ? 'actiu' : 'neutre'}
            onPress={() => onTria(t)}
          >
            {ETIQUETA_TRASTORN_CURTA[t]}
          </Xip>
        ))}
      </View>
    </Targeta>
  );
}

/**
 * Els pesos del perfil, amb l'amplada de barra proporcional al pes més alt de la
 * llista, no al 100 %: així es compara un eix amb els altres, que és el que
 * interessa, i no amb un màxim teòric que ningú no assoleix.
 */
function PanellPesos({ perfil }: { perfil: PerfilTrastorn }) {
  const ordenats = [...perfil.eixos].sort((a, b) => b.pes - a.pes);
  const maxim = Math.max(...ordenats.map((e) => e.pes));

  return (
    <Targeta>
      <Seccio>Pesos del perfil de {ETIQUETA_TRASTORN_CURTA[perfil.trastorn]}</Seccio>
      <Text style={text.escalaBarra}>7 EIXOS DE TEMPERAMENT · REESCALATS AL 90%</Text>

      <View style={estils.pesos}>
        {ordenats.map((e) => (
          <FilaPes
            key={e.eix}
            etiqueta={ETIQUETA_EIX[e.eix]}
            pes={e.pes}
            fraccio={e.pes / maxim}
            to={e.direccio === 'resta' ? 'sorra' : 'granat'}
            marcador={e.direccio === 'resta' ? '↓ BAIX' : undefined}
          />
        ))}
      </View>

      <View style={estils.separador} />

      <FilaPes
        etiqueta={ETIQUETA_EIX.longevitat}
        pes={10}
        fraccio={10 / maxim}
        to="oliva"
        marcador="FIX"
      />
      <Text style={estils.nota}>
        Igual a tots els trastorns: no depèn del diagnòstic.
      </Text>
    </Targeta>
  );
}

function FilaPes({
  etiqueta, pes, fraccio, to, marcador,
}: {
  etiqueta: string;
  pes: number;
  fraccio: number;
  to: 'granat' | 'sorra' | 'oliva';
  marcador?: string;
}) {
  const reple = to === 'sorra' ? color.sorra : to === 'oliva' ? color.oliva : color.granat;

  return (
    <View style={estils.filaPes}>
      <View style={estils.filaPesCapcalera}>
        <Text style={estils.etiquetaPes} numberOfLines={1}>{etiqueta}</Text>
        {marcador ? (
          <Text style={[estils.marcador, to === 'oliva' && { color: color.olivaFosc }]}>
            {marcador}
          </Text>
        ) : null}
        <View style={estils.flexible} />
        <Text style={estils.valorPes}>{pes}%</Text>
      </View>
      <View style={estils.pistaPes}>
        <View style={{
          width: `${Math.min(1, fraccio) * 100}%`,
          height: '100%',
          backgroundColor: reple,
          borderRadius: radi.barra,
        }} />
      </View>
    </View>
  );
}

/**
 * El filtre va en un bloc a part, amb franja vermella i el subtítol que diu que
 * no entra a la puntuació. La separació respecte al bloc de pesos és un requisit
 * del handoff, no una preferència.
 */
function PanellFiltre({
  pesMaximKg, onCanvi,
}: {
  pesMaximKg: number | null;
  onCanvi: (kg: number | null) => void;
}) {
  const actiu = pesMaximKg !== null;

  return (
    <Targeta franja="vermell">
      <Seccio>Filtre, no un eix</Seccio>
      <Text style={text.escalaBarra}>NO ENTRA A LA PUNTUACIÓ</Text>

      {actiu ? (
        <ControlLliscant
          valor={pesMaximKg}
          minim={PES.minim}
          maxim={PES.maxim}
          onCanvi={onCanvi}
          referencia={{ valor: PES.mediana, etiqueta: `MEDIANA ${PES.mediana}` }}
          formata={(v) => `${v} kg`}
        />
      ) : null}

      <Boto
        titol={actiu ? 'Treu el filtre' : 'Filtra per pes màxim'}
        to="sobreGranat"
        onPress={() => onCanvi(actiu ? null : PES.defecte)}
      />

      <Text style={estils.nota}>
        Depèn de l'entorn on viurà el gos, no del trastorn. Les races que el
        superen baixen al final amb el motiu visible.
      </Text>
    </Targeta>
  );
}

// ---------------------------------------------------------------------------
// Contingut
// ---------------------------------------------------------------------------

function Resultats({
  cataleg, perfil, pesMaximKg, esMobil,
}: {
  cataleg: CatalegRaces;
  perfil: PerfilTrastorn;
  pesMaximKg: number | null;
  esMobil: boolean;
}) {
  const [avisExportacio, setAvisExportacio] = useState<string | null>(null);
  const resultats = ranquing(cataleg.races, perfil, { pesMaximKg });
  // El resultat del motor porta l'identificador i el nom, no la fitxa sencera:
  // la fotografia s'ha d'anar a buscar al catàleg.
  const perId = new Map(cataleg.races.map((r) => [r.id, r]));
  const destacats = [...perfil.eixos].sort((a, b) => b.pes - a.pes).slice(0, 3);
  const eixosDestacats = destacats.map((e) => e.eix);

  return (
    <>
      <View style={estils.encapcalament}>
        <Text style={estils.eyebrow}>
          {`${ETIQUETA_TRASTORN_CURTA[perfil.trastorn]} · `}
          {destacats.map((e) => `${ETIQUETA_EIX[e.eix].toUpperCase()} ${e.pes}%`).join(' · ')}
        </Text>
        <Text style={esMobil ? text.titolMobil : text.titolWeb}>Races més compatibles</Text>
        <View style={estils.filaAccions}>
          <Text style={text.metadada}>{cataleg.total} races avaluades</Text>
          <View style={estils.flexible} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              const r = exporta({
                trastorn: perfil.trastorn,
                resultats,
                races: cataleg.races,
                eixos: eixosDestacats,
                pesMaximKg,
              });
              setAvisExportacio(r.fet
                ? 'Rànquing exportat en CSV.'
                : r.motiu);
            }}
          >
            <Text style={estils.accio}>Exporta el rànquing</Text>
          </Pressable>
        </View>

        {avisExportacio ? (
          <Text style={text.metadada}>{avisExportacio}</Text>
        ) : null}
      </View>

      {resultats.slice(0, DESPLEGATS).map((resultat, i) => (
        <FilaDesplegada
          key={resultat.breedId}
          resultat={resultat}
          raca={perId.get(resultat.breedId)}
          perfil={perfil}
          eixosDestacats={eixosDestacats}
          primer={i === 0}
          esMobil={esMobil}
        />
      ))}

      <Targeta>
        <Seccio>A continuació</Seccio>
        {resultats.slice(DESPLEGATS, DESPLEGATS + APLANATS).map((r) => (
          <FilaAplanada key={r.breedId} resultat={r} />
        ))}
      </Targeta>

      <BlocDescartades
        resultats={resultats.slice(-DESCARTADES).reverse()}
        eixosDestacats={eixosDestacats}
      />
    </>
  );
}

/**
 * Una fila desplegada del rànquing.
 *
 * A web són quatre columnes en una sola línia: miniatura, identitat, eixos i
 * puntuació. **A mòbil no hi caben**, i encongir-les no és una sortida: la
 * miniatura, el percentatge de 30px i el nom d'una raça tenen una amplada mínima
 * real, i per sota d'ella la fila se sortia per la dreta. La targeta es parteix
 * en dues línies —identitat i puntuació a dalt, els tres eixos a sota a tota
 * amplada—, que és la mateixa composició que ja fa servir el rànquing de mòbil
 * de la pantalla `7d`.
 */
function FilaDesplegada({
  resultat, raca, perfil, eixosDestacats, primer, esMobil,
}: {
  resultat: MatchResult;
  raca: Breed | undefined;
  perfil: PerfilTrastorn;
  eixosDestacats: string[];
  primer: boolean;
  esMobil: boolean;
}) {
  const miniatura = (
    <FotoRaca
      url={raca?.imatgeUrl ?? null}
      nom={resultat.nom}
      relacio={1}
      estil={estils.miniatura}
    />
  );

  const identitat = (
    <View style={esMobil ? estils.blocNomMobil : estils.blocNom}>
      <Link
        href={{ pathname: '/races/[id]', params: { id: resultat.breedId } }}
        style={estils.enllacNom}
      >
        <Text style={text.nomLlista}>{resultat.nom}</Text>
      </Link>
      <Text style={text.metadada}>
        {[
          resultat.penalitzacio ? resultat.penalitzacio : null,
          resultat.eixosSenseDades > 0
            ? `${resultat.eixosSenseDades} de 8 eixos sense dades` : null,
        ].filter(Boolean).join(' · ') || 'tots els eixos derivats'}
      </Text>
    </View>
  );

  const eixos = (
    <View style={esMobil ? estils.eixosMobil : estils.blocEixos}>
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
  );

  const puntuacio = (
    <View style={esMobil ? estils.blocPuntuacioMobil : estils.blocPuntuacio}>
      <Text
        style={[
          estils.percentatge,
          esMobil && estils.percentatgeMobil,
          { color: primer ? color.oliva : color.vermell },
        ]}
      >
        {resultat.puntuacio.toFixed(1).replace('.', ',')}%
      </Text>
      <Text style={text.metadadaFort}>{`#${resultat.posicio}`}</Text>
    </View>
  );

  if (esMobil) {
    return (
      <Targeta franja={primer ? 'oliva' : 'vermell'}>
        <View style={estils.capcaleraMobil}>
          {miniatura}
          {identitat}
          {puntuacio}
        </View>
        {eixos}
      </Targeta>
    );
  }

  return (
    <Targeta franja={primer ? 'oliva' : 'vermell'}>
      <View style={estils.fila}>
        {miniatura}
        {identitat}
        {eixos}
        {puntuacio}
      </View>
    </Targeta>
  );
}

function FilaAplanada({ resultat }: { resultat: MatchResult }) {
  return (
    <View style={estils.filaCompacta}>
      <Text style={text.metadadaFort}>{`#${resultat.posicio}`}</Text>
      <Link
        href={{ pathname: '/races/[id]', params: { id: resultat.breedId } }}
        style={estils.flexible}
      >
        <Text style={estils.nomCompacte} numberOfLines={1}>{resultat.nom}</Text>
      </Link>
      {resultat.penalitzacio ? (
        <Text style={estils.penalitzacio} numberOfLines={1}>{resultat.penalitzacio}</Text>
      ) : null}
      <Text style={estils.percentatgeCompacte}>
        {resultat.puntuacio.toFixed(1).replace('.', ',')}%
      </Text>
    </View>
  );
}

/**
 * La cua del rànquing és la part on el model és fiable. El bloc l'explica i en
 * dona el motiu concret de cada descart.
 */
function BlocDescartades({
  resultats, eixosDestacats,
}: {
  resultats: MatchResult[];
  eixosDestacats: string[];
}) {
  const motiu = (r: MatchResult): string => {
    const parts: string[] = [];
    const eixos = r.eixos.filter((e) => eixosDestacats.includes(e.eix) && e.valor !== null);
    const pitjor = eixos.sort((a, b) => (a.valor ?? 0) - (b.valor ?? 0))[0];

    if (r.penalitzacio) parts.push(r.penalitzacio);
    if (pitjor) {
      parts.push(`${ETIQUETA_EIX[pitjor.eix].toLowerCase()} ${pitjor.valor!.toFixed(1).replace('.', ',')}`);
    }
    if (r.eixosSenseDades > 0) parts.push(`${r.eixosSenseDades} de 8 sense dades`);
    return parts.join(' · ');
  };

  return (
    <Targeta franja="absencia">
      <Seccio>Les que descartaríem amb més confiança</Seccio>
      <Text style={text.escalaBarra}>LA CUA DEL RÀNQUING ÉS LA PART MÉS FIABLE</Text>

      {resultats.map((r) => (
        <View key={r.breedId} style={estils.filaCompacta}>
          <Text style={text.metadadaFort}>{`#${r.posicio}`}</Text>
          <Text style={[estils.nomCompacte, estils.flexible]} numberOfLines={1}>{r.nom}</Text>
          <Text style={estils.motiu} numberOfLines={1}>{motiu(r)}</Text>
          <Text style={estils.percentatgeCompacte}>
            {r.puntuacio.toFixed(1).replace('.', ',')}%
          </Text>
        </View>
      ))}

      <Text style={text.cosSecundari}>
        Els instruments que avaluen el temperament d'un gos d'assistència encerten
        molt millor quins fracassaran que quins triomfaran. Per això aquesta llista
        és més fiable que el podi: diu amb força confiança per on no començar.
      </Text>
    </Targeta>
  );
}

function Carregant() {
  return (
    <View style={estils.carregant}>
      {[1, 0.75, 0.5, 0.35].map((opacitat, i) => (
        <Esquelet key={i} alcada={110} opacitat={opacitat} />
      ))}
      <Text style={text.metadada}>Calculant la compatibilitat…</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------

const estils = StyleSheet.create({
  // Que la llista s'encongeixi és el que deixa lloc a la barra de pestanyes de
  // mòbil, que n'és germana. Ja ho feia sense dir-ho —la base de `ScrollView` a
  // web ho resol per ordre del full—, però val més escriure-ho que dependre'n.
  desplacador: { flex: 1 },
  pantalla: { flex: 1, backgroundColor: color.paper },
  desplacament: { padding: espai.xxl, maxWidth: 1180, width: '100%', alignSelf: 'center' },
  // A mòbil els 28px de farciment es mengen una vuitena part de la pantalla.
  desplacamentMobil: { padding: espai.xl },
  columnes: { flexDirection: 'row', gap: espai.xxl, alignItems: 'flex-start' },
  columnesApilades: { flexDirection: 'column' },
  lateral: { width: 270, gap: espai.l },
  plena: { width: '100%' },
  contingut: { flex: 1, gap: espai.m, minWidth: 0 },

  xips: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs },
  pesos: { gap: espai.s },
  filaPes: { gap: espai.xxs },
  filaPesCapcalera: { flexDirection: 'row', alignItems: 'baseline', gap: espai.xs },
  etiquetaPes: { ...text.cosSecundari, fontSize: 12.5, color: color.tinta, flexShrink: 1 },
  marcador: { ...text.escalaBarra, color: color.vermell },
  valorPes: { ...text.metadadaFort, fontSize: 11, color: color.tinta },
  pistaPes: {
    height: alcadaBarra.eix, backgroundColor: tinta.pistaEix,
    borderRadius: radi.barra, overflow: 'hidden',
  },
  separador: { height: 1, backgroundColor: tinta.separador },
  nota: { ...text.cosSecundari, fontSize: 12, lineHeight: 17 },
  flexible: { flex: 1 },

  encapcalament: { gap: espai.xs, marginBottom: espai.xs },
  eyebrow: { ...text.escalaBarra, color: color.olivaFosc },
  // Amb prou lloc queden a la mateixa línia; a mòbil l'acció baixa a la següent
  // en comptes d'estrènyer el recompte de races.
  filaAccions: { flexDirection: 'row', alignItems: 'baseline', gap: espai.m, flexWrap: 'wrap' },
  accio: { ...text.navegacio, color: color.vermell },

  fila: { flexDirection: 'row', gap: espai.l, alignItems: 'center' },
  // La relació 1 amb amplada fixa dona un quadrat de 64px.
  miniatura: { width: 64, borderRadius: 10 },
  blocNom: { width: 210, gap: espai.xxs },
  enllacNom: { textDecorationLine: 'none' },
  blocEixos: { flex: 1, gap: espai.xs, minWidth: 0 },
  blocPuntuacio: { width: 120, alignItems: 'flex-end', gap: 2 },
  percentatge: { ...text.percentatgeFitxa },

  // Variant de mòbil: capçalera d'una línia i eixos a sota. Els blocs que a web
  // tenen amplada fixa aquí l'agafen del contingut, i el nom és l'únic que
  // creix, perquè és l'únic que pot ocupar el que sobri.
  capcaleraMobil: { flexDirection: 'row', gap: espai.m, alignItems: 'center' },
  blocNomMobil: { flex: 1, minWidth: 0, gap: espai.xxs },
  blocPuntuacioMobil: { alignItems: 'flex-end', gap: 2 },
  percentatgeMobil: { fontSize: 30, lineHeight: 32 },
  eixosMobil: { gap: espai.s },

  filaCompacta: { flexDirection: 'row', alignItems: 'baseline', gap: espai.m },
  nomCompacte: { ...text.cosSecundari, color: color.tinta },
  // A React Native res no s'encongeix per defecte, al contrari que al CSS del
  // navegador. Sense això, un motiu llarg empeny el percentatge fora de la
  // targeta en comptes de retallar-se.
  motiu: { ...text.metadada, flexShrink: 1 },
  penalitzacio: { ...text.metadada, color: color.vermell, flexShrink: 1 },
  percentatgeCompacte: { ...text.metadadaFort, color: color.tinta },

  carregant: { gap: espai.m },
});
