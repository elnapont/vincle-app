/**
 * Camp de formulari amb els estats de validació de `5c`.
 *
 * Quan hi ha error, l'etiqueta i la vora van en vermell i el missatge apareix
 * **sota el camp**, no en un avís global: així es veu al costat del que s'ha
 * d'arreglar.
 *
 * Té dues aparences perquè el disseny d'entrada les demana totes dues: la clara
 * sobre paper i la de sobre fons granat, on tot el contrast s'inverteix.
 */

import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { color, espai, radi, tinta } from './tokens.ts';
import { familia, text } from './tipografia.ts';

export interface CampProps extends Omit<TextInputProps, 'style'> {
  etiqueta: string;
  /** Missatge d'error; si n'hi ha, el camp passa a l'estat d'error. */
  error?: string | null;
  /** `granat` inverteix els colors per anar sobre el fons de marca. */
  to?: 'clar' | 'granat';
}

export function Camp({ etiqueta, error, to = 'clar', ...props }: CampProps) {
  const sobreGranat = to === 'granat';
  const teError = Boolean(error);

  return (
    <View style={estils.contenidor}>
      <Text
        style={[
          estils.etiqueta,
          sobreGranat && estils.etiquetaGranat,
          teError && !sobreGranat && { color: color.vermell },
        ]}
      >
        {etiqueta}
      </Text>

      <TextInput
        {...props}
        style={[
          estils.camp,
          sobreGranat ? estils.campGranat : estils.campClar,
          teError && estils.campError,
        ]}
        placeholderTextColor={sobreGranat ? 'rgba(255,255,255,.45)' : tinta.metadada}
        accessibilityLabel={etiqueta}
      />

      {teError ? (
        <Text style={[estils.error, sobreGranat && estils.errorGranat]}>{error}</Text>
      ) : null}
    </View>
  );
}

const estils = StyleSheet.create({
  contenidor: { gap: 7 },
  etiqueta: { ...text.etiquetaCamp },
  etiquetaGranat: { color: 'rgba(255,255,255,.6)' },
  camp: {
    borderRadius: radi.targeta,
    paddingHorizontal: espai.l,
    fontFamily: familia.sans,
    fontSize: 15,
  },
  campClar: {
    height: 48,
    borderRadius: 10,
    backgroundColor: color.blanc,
    borderWidth: 1,
    borderColor: tinta.voraCamp,
    color: color.tinta,
  },
  campGranat: {
    height: 52,
    backgroundColor: 'rgba(255,255,255,.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.22)',
    color: color.blanc,
  },
  campError: { borderWidth: 1.5, borderColor: color.vermell },
  error: { ...text.cosSecundari, fontSize: 12.5, color: color.vermell },
  errorGranat: { color: color.sorra },
});
