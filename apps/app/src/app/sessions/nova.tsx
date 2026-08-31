/**
 * Sessió d'ensinistrament — la segona meitat de `6b` i el registre de `2e`.
 *
 * El handoff les dibuixa com dues pantalles: una sessió guiada amb el pas en curs
 * i navegació entre passos, i un registre modal amb la llista d'exercicis.
 * S'han fos en una perquè el contingut real no té passos: guiar la sessió és
 * ensenyar l'explicació mentre corre el cronòmetre, i el registre és el mateix
 * formulari que ja hi ha a sota.
 *
 * El cronòmetre no és decoració: la durada és una de les poques dades objectives
 * que es poden comparar entre sessions, i demanar-la a mà després acabaria en
 * xifres rodones inventades.
 */

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { textRecomanacio } from '@vincle/shared-types';
import { BLOCS_CATALEG, EXERCICIS } from '../../dades/exercicis.ts';
import { useGossos } from '../../dades/gossos.ts';
import { formataDurada, registraSessio } from '../../dades/sessions.ts';
import {
  Boto, Seccio, Targeta, Xip,
  color, espai, familia, radi, text, tinta, TOCABLE_MINIM,
} from '../../disseny/index.ts';

/** Les quatre opcions del selector «Com ha anat», d'1 a 4 sobre 5. */
const VALORACIONS: { valor: number; etiqueta: string }[] = [
  { valor: 2, etiqueta: 'Malament' },
  { valor: 3, etiqueta: 'Regular' },
  { valor: 4, etiqueta: 'Bé' },
  { valor: 5, etiqueta: 'Molt bé' },
];

export default function SessioNova() {
  const router = useRouter();
  const { exerciciId, gosId: gosInicial } = useLocalSearchParams<{
    exerciciId?: string; gosId?: string;
  }>();
  const { estat: estatGossos } = useGossos();

  // L'exercici pot venir pel paràmetre —des de la fitxa o des del camí del gos— o
  // triar-se aquí. `undefined` vol dir que encara no s'hi ha tocat.
  const [triatManual, setTriatManual] = useState<string | null | undefined>(undefined);
  const idActiu = triatManual === undefined ? (exerciciId ?? null) : triatManual;
  const exercici = EXERCICIS.find((e) => e.id === idActiu) ?? null;
  const blocActiu = exercici
    ? BLOCS_CATALEG.find((b) => b.bloc === exercici.bloc)?.nom ?? null
    : null;
  // El condicional dins del memo: fora, crearia un array nou a cada dibuix.
  const gossos = useMemo(
    () => (estatGossos.fase === 'llest' ? estatGossos.gossos : []),
    [estatGossos],
  );

  const [gosTriat, setGosTriat] = useState<string | null>(gosInicial ?? null);
  const [segons, setSegons] = useState(0);
  const [corrent, setCorrent] = useState(false);
  const [acabada, setAcabada] = useState(false);

  const [correctes, setCorrectes] = useState(0);
  const [intents, setIntents] = useState(0);
  const [valoracio, setValoracio] = useState<number | null>(null);
  const [nota, setNota] = useState('');

  const [desant, setDesant] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Un sol gos: no cal triar-lo.
  const gos = useMemo(
    () => gossos.find((g) => g.id === gosTriat) ?? (gossos.length === 1 ? gossos[0] : null),
    [gossos, gosTriat],
  );

  useEffect(() => {
    if (!corrent) return;
    const id = setInterval(() => setSegons((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [corrent]);

  const potDesar = gos !== null && acabada && !desant;

  const desa = async () => {
    if (!gos) return;
    setDesant(true);
    setError(null);

    const { error: err } = await registraSessio({
      gosId: gos.id,
      exerciciId: exercici?.id ?? null,
      exerciciNom: exercici?.nom ?? null,
      duracioSegons: segons,
      valoracio,
      repeticionsCorrectes: correctes,
      intentsTotals: intents,
      nota,
    });

    setDesant(false);
    if (err) { setError(err); return; }
    router.replace('/gossos');
  };

  return (
    <SafeAreaView style={estils.pantalla} edges={['top', 'bottom']}>
      <View style={estils.capcaleraModal}>
        <Pressable onPress={() => router.back()} style={estils.tancar} accessibilityLabel="Tanca">
          <Text style={estils.creu}>✕</Text>
        </Pressable>
        <View style={estils.titolBloc}>
          {blocActiu ? <Text style={estils.eyebrowModal}>{blocActiu.toUpperCase()}</Text> : null}
          <Text style={estils.titolModal} numberOfLines={1}>
            {exercici ? exercici.nom : 'Sessió lliure'}
          </Text>
        </View>
        <View style={estils.tancar} />
      </View>

      <ScrollView contentContainerStyle={estils.contingut}>
        {/* Cronòmetre */}
        <View style={estils.cronometre}>
          <Text style={estils.temps}>{formataDurada(segons)}</Text>
          <View style={estils.controlsCronometre}>
            {!acabada ? (
              <>
                <Boto
                  titol={corrent ? 'Pausa' : segons === 0 ? 'Comença' : 'Segueix'}
                  to="sobreGranat"
                  onPress={() => setCorrent((c) => !c)}
                  estil={estils.botoCronometre}
                />
                <Boto
                  titol="Finalitza"
                  to="secundari"
                  desactivat={segons === 0}
                  onPress={() => { setCorrent(false); setAcabada(true); }}
                  estil={estils.botoCronometre}
                />
              </>
            ) : (
              <Text style={estils.acabada}>Sessió acabada · registra com ha anat</Text>
            )}
          </View>
        </View>

        {/* Guia: l'explicació de l'exercici mentre es practica */}
        {exercici ? (
          <Targeta mobil franja="oliva">
            {/*
              El nom presideix la targeta perquè, amb el selector amagat, aquesta
              és la que diu quin exercici s'està practicant. La capçalera de la
              pantalla també el porta, però queda fixa a dalt i el text de «Com es
              fa» és llarg: mentre es llegeix, convé tenir-lo a la vista.
            */}
            <View style={estils.filaSeccio}>
              <Text style={estils.nomExercici}>{exercici.nom}</Text>
              <Pressable onPress={() => setTriatManual(null)}>
                <Text style={estils.canvia}>Fes-la lliure</Text>
              </Pressable>
            </View>
            <Seccio>Com es fa</Seccio>
            <Text style={estils.explicacio}>{exercici.explicacio}</Text>
            <Xip to="calid" unaLinia>{textRecomanacio(exercici.recomanacio)}</Xip>
          </Targeta>
        ) : null}

        {exercici?.nota ? (
          <Targeta mobil franja="absencia">
            <Seccio>Nota</Seccio>
            <Text style={estils.explicacio}>{exercici.nota}</Text>
          </Targeta>
        ) : null}

        {/*
          Quin exercici. Només surt si encara no n'hi ha cap: a la sessió s'hi
          arriba des del camí del gos o des de la fitxa de l'exercici, i allà ja
          s'ha triat. Ensenyar les dinou opcions a sobre convidava a desfer una
          decisió que ja s'havia pres. Per canviar-la hi ha «Fes-la lliure», que
          torna a mostrar el selector.
        */}
        {!exercici ? (
          <Targeta mobil>
            <Seccio>Quin exercici</Seccio>

            {BLOCS_CATALEG.map((b) => {
              const delBloc = EXERCICIS.filter((e) => e.bloc === b.bloc);
              if (delBloc.length === 0) return null;
              return (
                <View key={b.bloc} style={estils.grupBloc}>
                  <Text style={estils.nomBloc}>{b.nom.toUpperCase()}</Text>
                  <View style={estils.xips}>
                    {delBloc.map((e) => (
                      <Xip
                        key={e.id}
                        // Sense estat actiu: aquest selector només es dibuixa
                        // quan no hi ha cap exercici triat, i triar-ne un
                        // l'amaga, de manera que cap xip no arriba a marcar-se.
                        to="neutre"
                        onPress={() => setTriatManual(e.id)}
                      >
                        {`${e.ordre}. ${e.nom}`}
                      </Xip>
                    ))}
                  </View>
                </View>
              );
            })}

            <Text style={estils.pistaLliure}>
              Sense exercici triat es desa com a sessió lliure, que també compta a
              l'historial però no avança el camí.
            </Text>
          </Targeta>
        ) : null}

        {/* Amb què */}
        {gossos.length > 1 ? (
          <Targeta mobil>
            <Seccio>Amb quin gos</Seccio>
            <View style={estils.xips}>
              {gossos.map((g) => (
                <Xip
                  key={g.id}
                  to={gos?.id === g.id ? 'actiu' : 'neutre'}
                  onPress={() => setGosTriat(g.id)}
                >
                  {g.nom}
                </Xip>
              ))}
            </View>
          </Targeta>
        ) : null}

        {gossos.length === 0 && estatGossos.fase === 'llest' ? (
          <Targeta mobil franja="vermell">
            <Text style={text.nomLlista}>Encara no hi ha cap gos</Text>
            <Text style={text.cosSecundari}>
              Cal tenir-ne un per registrar-hi sessions.
            </Text>
            <Boto titol="Afegeix un gos" onPress={() => router.replace('/gossos/nou')} />
          </Targeta>
        ) : null}

        {/* Comptadors */}
        <Targeta mobil>
          <Seccio>Com ha anat</Seccio>
          <Comptador
            etiqueta="Repeticions correctes"
            valor={correctes}
            // No es poden encertar més repeticions que intents: pujar-les puja
            // també els intents, que és el que passa de debò.
            onCanvi={(v) => {
              setCorrectes(v);
              if (v > intents) setIntents(v);
            }}
          />
          <Comptador
            etiqueta="Intents totals"
            valor={intents}
            minim={correctes}
            onCanvi={setIntents}
          />

          <View style={estils.valoracions}>
            {VALORACIONS.map((v) => (
              <Xip
                key={v.valor}
                to={valoracio === v.valor ? 'actiu' : 'neutre'}
                onPress={() => setValoracio(v.valor)}
              >
                {v.etiqueta}
              </Xip>
            ))}
          </View>

          <TextInput
            value={nota}
            onChangeText={setNota}
            placeholder="Nota o incidència (opcional)"
            placeholderTextColor={tinta.metadada}
            multiline
            style={estils.nota}
            accessibilityLabel="Nota de la sessió"
          />
        </Targeta>

        {error ? (
          <Targeta mobil franja="vermell">
            <Text style={estils.error}>{error}</Text>
          </Targeta>
        ) : null}

        <Boto
          titol={desant ? 'Desant…' : 'Desa la sessió'}
          desactivat={!potDesar}
          onPress={desa}
          estil={estils.botoDesa}
        />

        {!acabada ? (
          <Text style={estils.pista}>
            Finalitza el cronòmetre per poder desar la sessió.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Comptador amb botons de més i menys de 32px, com marca el handoff. */
function Comptador({
  etiqueta, valor, onCanvi, minim = 0,
}: {
  etiqueta: string;
  valor: number;
  onCanvi: (valor: number) => void;
  minim?: number;
}) {
  return (
    <View style={estils.filaComptador}>
      <Text style={estils.etiquetaComptador}>{etiqueta}</Text>
      <View style={estils.controls}>
        <Pressable
          onPress={() => onCanvi(Math.max(minim, valor - 1))}
          disabled={valor <= minim}
          accessibilityLabel={`Menys ${etiqueta}`}
          style={[estils.botoComptador, valor <= minim && estils.botoApagat]}
        >
          <Text style={estils.signe}>−</Text>
        </Pressable>
        <Text style={estils.valorComptador}>{valor}</Text>
        <Pressable
          onPress={() => onCanvi(valor + 1)}
          accessibilityLabel={`Més ${etiqueta}`}
          style={estils.botoComptador}
        >
          <Text style={estils.signe}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  capcaleraModal: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: espai.l, paddingTop: espai.m,
  },
  tancar: { width: TOCABLE_MINIM, height: TOCABLE_MINIM, alignItems: 'center', justifyContent: 'center' },
  creu: { fontFamily: familia.sans, fontSize: 20, color: color.granat },
  titolBloc: { flex: 1, alignItems: 'center' },
  eyebrowModal: { ...text.escalaBarra, fontSize: 9 },
  titolModal: { ...text.nomLlista, fontSize: 15, textAlign: 'center' },
  filaSeccio: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: espai.m },
  canvia: { ...text.cosSecundari, fontSize: 12.5, color: color.vermell },
  nomExercici: { ...text.nomLlista, fontSize: 16, flexShrink: 1 },
  grupBloc: { gap: espai.xs },
  nomBloc: { ...text.escalaBarra },
  pistaLliure: { ...text.cosSecundari, fontSize: 12.5, lineHeight: 18 },

  contingut: {
    padding: espai.xl, gap: espai.m,
    maxWidth: 620, width: '100%', alignSelf: 'center',
  },

  cronometre: {
    backgroundColor: color.granat,
    borderRadius: radi.targetaMobil,
    padding: espai.xl,
    alignItems: 'center',
    gap: espai.m,
  },
  temps: { fontFamily: familia.serif, fontSize: 56, lineHeight: 60, color: color.blanc },
  controlsCronometre: { flexDirection: 'row', gap: espai.s, alignSelf: 'stretch' },
  botoCronometre: { flex: 1 },
  acabada: { ...text.cosSecundari, color: 'rgba(255,255,255,.72)', textAlign: 'center' },

  explicacio: { ...text.cos, lineHeight: 23 },
  xips: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs },
  valoracions: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs },

  filaComptador: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espai.m },
  etiquetaComptador: { ...text.cosSecundari, color: color.tinta, flexShrink: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: espai.m },
  botoComptador: {
    width: 32, height: 32, borderRadius: radi.botoPetit,
    backgroundColor: tinta.xipInactiu,
    alignItems: 'center', justifyContent: 'center',
  },
  botoApagat: { opacity: 0.4 },
  signe: { fontFamily: familia.sansFort, fontSize: 18, color: color.granat, lineHeight: 22 },
  valorComptador: { ...text.metrica, fontSize: 24, minWidth: 32, textAlign: 'center' },

  nota: {
    height: 92,
    borderRadius: 10,
    borderWidth: 1, borderColor: tinta.voraCamp,
    backgroundColor: color.blanc,
    padding: espai.m,
    fontFamily: familia.sans, fontSize: 14, color: color.tinta,
    textAlignVertical: 'top',
  },
  botoDesa: { height: 52 },
  pista: { ...text.metadada, textAlign: 'center' },
  error: { ...text.cosSecundari, color: color.vermell },
});
