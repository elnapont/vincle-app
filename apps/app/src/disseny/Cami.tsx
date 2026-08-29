/**
 * El camí: on va el gos dins del recorregut de blocs i exercicis.
 *
 * És la resposta a «per on vaig i què toca ara», que és la pregunta que es fa qui
 * ensinistra cada dia. Fa servir el codi de franja lateral que el handoff ja tenia
 * definit i que amb prou feines s'havia utilitzat: **oliva = dominat, vermell = en
 * curs, gris = no iniciat**.
 *
 * Els exercicis amb recomanació qualitativa —«fins que el cadell canvia les
 * dents»— no poden arribar mai a «assolit», i el component ho diu en comptes de
 * deixar-los eternament a mig fer sense explicació.
 */

import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ProgresBloc, ProgresExercici } from '../dades/progres.ts';
import { BarraProgres } from './primitius.tsx';
import { color, espai, radi, tinta } from './tokens.ts';
import { familia, text } from './tipografia.ts';

const COLOR_ESTAT = {
  'assolit': color.oliva,
  'en-curs': color.vermell,
  'no-iniciat': tinta.franjaAbsencia,
} as const;

export function Cami({
  blocs, seguentId, onObrir,
}: {
  blocs: ProgresBloc[];
  /** Identificador de l'exercici que toca ara, per destacar-lo. */
  seguentId: string | null;
  onObrir?: (exerciciId: string) => void;
}) {
  return (
    <View style={estils.contenidor}>
      {blocs.map((bloc) => (
        <Fragment key={bloc.bloc}>
          <View style={estils.capcaleraBloc}>
            <Text style={estils.nomBloc}>{bloc.nom}</Text>
            <Text style={estils.recompteBloc}>
              {bloc.total === 0 ? 'en redacció' : `${bloc.assolits}/${bloc.total}`}
            </Text>
          </View>

          {bloc.exercicis.map((p) => (
            <FilaExercici
              key={p.exercici.id}
              progres={p}
              esSeguent={p.exercici.id === seguentId}
              onPress={onObrir ? () => onObrir(p.exercici.id) : undefined}
            />
          ))}
        </Fragment>
      ))}
    </View>
  );
}

function FilaExercici({
  progres, esSeguent, onPress,
}: {
  progres: ProgresExercici;
  esSeguent: boolean;
  onPress?: () => void;
}) {
  const { exercici, estat, sessionsFetes, sessionsRecomanades, fraccio } = progres;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${exercici.nom}, ${sessionsFetes} sessions`}
      style={({ pressed }) => [
        estils.fila,
        { borderLeftColor: COLOR_ESTAT[estat] },
        esSeguent && estils.filaSeguent,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[estils.ordinal, estat === 'assolit' && estils.ordinalAssolit]}>
        <Text style={[estils.ordinalNumero, estat === 'assolit' && estils.ordinalNumeroAssolit]}>
          {estat === 'assolit' ? '✓' : exercici.ordre}
        </Text>
      </View>

      <View style={estils.cos}>
        <View style={estils.filaTitol}>
          <Text style={estils.nomExercici} numberOfLines={1}>{exercici.nom}</Text>
          {esSeguent ? <Text style={estils.marcaAra}>ARA</Text> : null}
        </View>

        {fraccio !== null ? (
          <View style={estils.progres}>
            <View style={estils.barra}>
              <BarraProgres
                fraccio={fraccio}
                to={estat === 'assolit' ? 'oliva' : 'granat'}
              />
            </View>
            <Text style={estils.recompte}>
              {`${sessionsFetes}/${sessionsRecomanades!.min}`}
            </Text>
          </View>
        ) : (
          <Text style={estils.senseMeta}>
            {sessionsFetes === 0
              ? 'sense pauta comptable · encara no practicat'
              : `sense pauta comptable · ${sessionsFetes} ${sessionsFetes === 1 ? 'sessió' : 'sessions'}`}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const estils = StyleSheet.create({
  contenidor: { gap: espai.xs },
  capcaleraBloc: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', gap: espai.m,
    marginTop: espai.s,
  },
  nomBloc: { ...text.encapcalamentSeccio },
  recompteBloc: { ...text.metadadaFort, fontSize: 11 },

  fila: {
    flexDirection: 'row', alignItems: 'center', gap: espai.m,
    borderLeftWidth: 6,
    backgroundColor: color.blanc,
    borderRadius: radi.botoPetit,
    padding: espai.m,
  },
  // El que toca ara es marca amb el fons càlid, no amb un color nou.
  filaSeguent: { backgroundColor: 'rgba(194,173,154,.22)' },

  ordinal: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: tinta.eixSenseDadesContorn,
    alignItems: 'center', justifyContent: 'center',
  },
  ordinalAssolit: { backgroundColor: color.oliva, borderColor: color.oliva },
  ordinalNumero: { ...text.metadadaFort, fontSize: 11, color: tinta.textSecundari },
  ordinalNumeroAssolit: { color: color.blanc, fontFamily: familia.sansFort },

  cos: { flex: 1, gap: espai.xxs, minWidth: 0 },
  filaTitol: { flexDirection: 'row', alignItems: 'center', gap: espai.s },
  nomExercici: { ...text.cosSecundari, color: color.tinta, flexShrink: 1 },
  marcaAra: { ...text.escalaBarra, color: color.granat },

  progres: { flexDirection: 'row', alignItems: 'center', gap: espai.s },
  barra: { flex: 1 },
  recompte: { ...text.metadadaFort, fontSize: 11, color: color.tinta },
  senseMeta: { ...text.metadada, fontSize: 11 },
});
