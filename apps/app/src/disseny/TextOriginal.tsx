/**
 * Text que arriba de The Dog API en anglès.
 *
 * La `description` i la `history` són prosa que l'API només dona en anglès i que
 * no es pot traduir per a 631 races. El criteri de l'equip és mostrar-les tal com
 * arriben **amb una marca que ho digui**: dir d'on ve un text i en quina llengua
 * està és més honest que amagar-lo o fer veure que és nostre.
 *
 * Els termes de `temperament`, en canvi, **sí** que van en català: són dades del
 * model que alimenten el matching, no prosa (§5.2.1 del CLAUDE.md).
 *
 * Viu en un component propi perquè la marca sigui idèntica a totes les pantalles
 * on surti aquest tipus de text.
 */

import { StyleSheet, Text, View } from 'react-native';
import { espai, tinta } from './tokens.ts';
import { text } from './tipografia.ts';

export function TextOriginal({
  titol, contingut,
}: {
  /** Què és aquest text: «Descripció», «Història»… */
  titol: string;
  contingut: string;
}) {
  return (
    <View style={estils.bloc}>
      <Text style={estils.marca}>{`${titol.toUpperCase()} · ORIGINAL DE THE DOG API, EN ANGLÈS`}</Text>
      <Text style={text.cosSecundari}>{contingut}</Text>
    </View>
  );
}

const estils = StyleSheet.create({
  bloc: {
    gap: espai.xxs,
    // Franja d'absència: el mateix codi que marca el que no és nostre o no està
    // complet a la resta del sistema.
    borderLeftWidth: 2,
    borderLeftColor: tinta.franjaAbsencia,
    paddingLeft: espai.s,
  },
  marca: { ...text.escalaBarra, color: tinta.metadada },
});
