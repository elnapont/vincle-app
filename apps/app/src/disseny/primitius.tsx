/**
 * Components primitius del sistema visual.
 *
 * Tot el que es repeteix a més d'una pantalla viu aquí. Les pantalles s'han de
 * poder llegir com una composició d'aquests elements, sense colors ni mides en cru.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  FRANJA_LATERAL, TOCABLE_MINIM, alcadaBarra, color, espai, fons, radi, tinta,
} from './tokens.ts';
import { text } from './tipografia.ts';

// ---------------------------------------------------------------------------
// Targeta
// ---------------------------------------------------------------------------

/**
 * Codi de rang o estat de la franja lateral de 6px:
 * oliva = millor resultat, pas en curs, exercici dominat;
 * vermell = següents resultats, alertes, incidències;
 * absència = element no iniciat, advertiment metodològic o bloc de descartades.
 */
export type Franja = 'oliva' | 'vermell' | 'absencia' | null;

const COLOR_FRANJA: Record<Exclude<Franja, null>, string> = {
  oliva: color.oliva,
  vermell: color.vermell,
  absencia: tinta.franjaAbsencia,
};

export function Targeta({
  children, franja = null, mobil = false, estil,
}: {
  children: ReactNode;
  franja?: Franja;
  /** Les targetes de mòbil tenen el radi més gran que les de web. */
  mobil?: boolean;
  estil?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        estils.targeta,
        { borderRadius: mobil ? radi.targetaMobil : radi.targeta },
        franja ? { borderLeftWidth: FRANJA_LATERAL, borderLeftColor: COLOR_FRANJA[franja] } : null,
        estil,
      ]}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Xip
// ---------------------------------------------------------------------------

export type TonXip = 'neutre' | 'actiu' | 'exit' | 'alerta' | 'calid';

export function Xip({
  children, to = 'neutre', onPress, unaLinia = false,
}: {
  children: ReactNode;
  to?: TonXip;
  onPress?: () => void;
  /** Retalla el text a una línia. Per a llistes on el xip no pot créixer. */
  unaLinia?: boolean;
}) {
  const contingut = (
    <View style={[estils.xip, estilsXip[to], unaLinia && estils.xipUnaLinia]}>
      <Text
        style={[estils.xipText, textXip[to]]}
        numberOfLines={unaLinia ? 1 : undefined}
      >
        {children}
      </Text>
    </View>
  );

  if (!onPress) return contingut;
  return (
    <Pressable
      onPress={onPress}
      // Res tocable per sota de 44px d'alçada efectiva: el xip és més baix, així
      // que s'amplia l'àrea sensible sense créixer visualment.
      hitSlop={Math.max(0, (TOCABLE_MINIM - 30) / 2)}
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.98 }] } : null)}
    >
      {contingut}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Botó
// ---------------------------------------------------------------------------

export function Boto({
  titol, onPress, to = 'primari', desactivat = false, estil,
}: {
  titol: string;
  onPress?: () => void;
  to?: 'primari' | 'secundari' | 'sobreGranat';
  desactivat?: boolean;
  estil?: StyleProp<ViewStyle>;
}) {
  const fonsBoto =
    desactivat ? 'rgba(102,20,20,.35)'
      : to === 'primari' ? color.granat
        : to === 'secundari' ? color.vermell
          : color.sorra;

  return (
    <Pressable
      onPress={desactivat ? undefined : onPress}
      disabled={desactivat}
      accessibilityRole="button"
      style={({ pressed }) => [
        estils.boto,
        { backgroundColor: fonsBoto },
        pressed && !desactivat ? { transform: [{ scale: 0.98 }] } : null,
        estil,
      ]}
    >
      <Text
        style={[
          estils.botoText,
          to === 'sobreGranat' ? { color: color.granatFosc } : { color: color.blanc },
        ]}
      >
        {titol}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Encapçalament de secció
// ---------------------------------------------------------------------------

export function Seccio({ children }: { children: ReactNode }) {
  return <Text style={text.encapcalamentSeccio}>{children}</Text>;
}

// ---------------------------------------------------------------------------
// Barra de progrés genèrica
// ---------------------------------------------------------------------------

/**
 * Progrés d'una fita o d'un procés. Per als eixos derivats NO es fa servir això
 * sinó `BarraEix`, que sap distingir una mesura d'una absència.
 */
export function BarraProgres({
  fraccio, to = 'granat', alcada = alcadaBarra.compacta,
}: {
  /** De 0 a 1. */
  fraccio: number;
  to?: 'granat' | 'oliva' | 'sorra';
  alcada?: number;
}) {
  const reple = to === 'oliva' ? color.oliva : to === 'sorra' ? color.sorra : color.granat;
  const amplada = `${Math.max(0, Math.min(1, fraccio)) * 100}%` as const;

  return (
    <View style={[estils.pista, { height: alcada }]}>
      <View style={{ width: amplada, height: '100%', backgroundColor: reple, borderRadius: radi.barra }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Esquelet de càrrega
// ---------------------------------------------------------------------------

/**
 * Els estats de càrrega són esquelets amb els mateixos radis i alçades que el
 * contingut real, mai un indicador giratori centrat.
 */
export function Esquelet({
  alcada, amplada = '100%', opacitat = 1, arrodonit = radi.targeta,
}: {
  alcada: number;
  amplada?: number | `${number}%`;
  opacitat?: number;
  arrodonit?: number;
}) {
  return (
    <View
      style={{
        height: alcada,
        width: amplada,
        borderRadius: arrodonit,
        backgroundColor: tinta.pistaEix,
        opacity: opacitat,
      }}
    />
  );
}

// ---------------------------------------------------------------------------

const estils = StyleSheet.create({
  targeta: {
    backgroundColor: color.blanc,
    borderWidth: 1,
    borderColor: tinta.vora,
    padding: espai.l,
    gap: espai.m,
    // Cap ombra dins de l'app: la separació la fan la vora i el fons de paper.
  },
  xip: {
    paddingHorizontal: espai.m,
    paddingVertical: 7,
    borderRadius: radi.pindola,
    alignSelf: 'flex-start',
  },
  xipText: { ...text.cosSecundari, fontSize: 12.5, lineHeight: 15 },
  // Amb `flexShrink` el xip pot encongir-se dins d'una fila en comptes de
  // desbordar-la, i el text de dins es retalla amb punts suspensius.
  xipUnaLinia: { flexShrink: 1, maxWidth: '100%' },
  boto: {
    minHeight: TOCABLE_MINIM,
    borderRadius: radi.boto,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espai.l,
  },
  botoText: { ...text.nomLlista, fontSize: 15 },
  pista: {
    backgroundColor: tinta.pistaEix,
    borderRadius: radi.barra,
    overflow: 'hidden',
  },
});

const estilsXip = StyleSheet.create({
  neutre: { backgroundColor: tinta.xipInactiu },
  actiu: { backgroundColor: color.granat },
  exit: { backgroundColor: fons.exit },
  alerta: { backgroundColor: fons.alerta },
  calid: { backgroundColor: fons.neutreCalid },
});

const textXip = StyleSheet.create({
  neutre: { color: tinta.textSecundari },
  actiu: { color: color.blanc },
  exit: { color: color.olivaFosc },
  alerta: { color: color.vermell },
  calid: { color: color.granatFosc },
});
