/**
 * Catàleg de races.
 *
 * Consulta lliure de les 631 races de The Dog API, amb cercador i imatge. És una
 * pantalla que el handoff no té: la pestanya «Races» de la barra de navegació hi
 * era però no portava enlloc.
 *
 * **Criteri sobre l'idioma (decisió de l'equip).** Els termes de `temperament` es
 * mostren en català, com a tot el producte, perquè són dades del model que
 * alimenten el matching. La `description` i la `history`, en canvi, són prosa que
 * l'API només dona en anglès i que no es pot traduir per a 631 races: es mostren
 * tal com arriben, amb una marca que ho digui. Dir d'on ve un text i en quina
 * llengua està és més honest que amagar-lo o fer veure que és nostre.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import type { Breed } from '@vincle/shared-types';
import { etiquetaGrup } from '@vincle/shared-types';
import { TRADUCCIO_TERME } from '@vincle/matching';
import { useCataleg } from '../../dades/useCataleg.ts';
import {
  BarraNavegacio, Boto, Esquelet, FotoRaca, Targeta, Xip,
  color, espai, familia, radi, text, tinta, useTrencament,
} from '../../disseny/index.ts';

const PESTANYES = [
  { etiqueta: 'Gossos', desti: '/gossos' as const },
  { etiqueta: 'Races', desti: '/races' as const },
  { etiqueta: 'Compatibilitats', desti: '/compatibilitats' as const },
  { etiqueta: 'Sessions', desti: '/gossos' as const },
];

/**
 * Normalitza per comparar: sense accents, sense punt volat i en minúscules. Sense
 * això, buscar «intelligent» no trobaria «intel·ligent» ni «sabues» trobaria
 * «Sabuès», que en un producte en català es nota de seguida.
 */
function sensePuntuacio(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/·/g, '')
    .toLowerCase()
    .trim();
}

/** Quantes races es dibuixen alhora. 631 targetes amb imatge serien massa. */
const PER_PAGINA = 24;

export default function CatalegRaces() {
  const { estat, reintenta } = useCataleg();
  const { esMobil } = useTrencament();
  const [cerca, setCerca] = useState('');
  const [visibles, setVisibles] = useState(PER_PAGINA);

  const races = estat.fase === 'llest' ? estat.cataleg.races : [];

  const resultats = useMemo(() => {
    const q = sensePuntuacio(cerca);
    if (q === '') return races;
    return races.filter((r) =>
      sensePuntuacio(r.nom).includes(q)
      || sensePuntuacio(r.origen ?? '').includes(q)
      || r.termes.some((t) => sensePuntuacio(TRADUCCIO_TERME[t] ?? t).includes(q)));
  }, [cerca, races]);

  return (
    <SafeAreaView style={estils.pantalla} edges={['top']}>
      {!esMobil ? <BarraNavegacio pestanyes={PESTANYES} activa="Races" /> : null}

      <ScrollView contentContainerStyle={estils.contingut}>
        <View style={estils.encapcalament}>
          <Text style={esMobil ? text.titolMobil : text.titolWeb}>Catàleg de races</Text>
          <Text style={text.cosSecundari}>
            Consulta lliure del catàleg. Per veure quines races encaixen amb un
            trastorn, fes el qüestionari de compatibilitat.
          </Text>

          <TextInput
            value={cerca}
            onChangeText={(t) => { setCerca(t); setVisibles(PER_PAGINA); }}
            placeholder="Cerca per nom, origen o temperament"
            placeholderTextColor={tinta.metadada}
            style={estils.cerca}
            autoCapitalize="none"
            accessibilityLabel="Cerca de races"
          />

          {estat.fase === 'llest' ? (
            <Text style={text.metadada}>
              {cerca.trim()
                ? `${resultats.length} de ${estat.cataleg.total} races`
                : `${estat.cataleg.total} races al catàleg`}
            </Text>
          ) : null}
        </View>

        {estat.fase === 'carregant' ? (
          <View style={estils.graella}>
            {[1, 0.8, 0.6, 0.4].map((o, i) => (
              <View key={i} style={esMobil ? estils.plena : estils.cela}>
                <Esquelet alcada={280} opacitat={o} />
              </View>
            ))}
          </View>
        ) : null}

        {estat.fase === 'error' ? (
          <Targeta franja="vermell">
            <Text style={text.nomLlista}>No hem pogut carregar el catàleg</Text>
            <Text style={text.cosSecundari}>{estat.missatge}</Text>
            <Boto titol="Torna-ho a provar" to="secundari" onPress={reintenta} />
          </Targeta>
        ) : null}

        {estat.fase === 'llest' ? (
          <>
            {estat.cataleg.esCopiaCache ? (
              <Targeta franja="vermell">
                <Text style={text.nomLlista}>No hem pogut actualitzar el catàleg</Text>
                <Text style={text.cosSecundari}>
                  {`Es mostra la còpia del ${estat.cataleg.actualitzatEl.toLocaleDateString('ca-ES', {
                    day: 'numeric', month: 'long',
                  })}.`}
                </Text>
              </Targeta>
            ) : null}

            {resultats.length === 0 ? (
              <Targeta franja="absencia">
                <Text style={text.nomLlista}>Cap raça coincideix</Text>
                <Text style={text.cosSecundari}>Prova amb un altre nom o temperament.</Text>
              </Targeta>
            ) : null}

            <View style={estils.graella}>
              {resultats.slice(0, visibles).map((raca) => (
                <View key={raca.id} style={esMobil ? estils.plena : estils.cela}>
                  <Link
                    href={{ pathname: '/races/[id]', params: { id: raca.id } }}
                    asChild
                  >
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={`Fitxa de ${raca.nom}`}
                      style={({ pressed }) => [
                        estils.plena,
                        pressed ? { opacity: 0.85 } : null,
                      ]}
                    >
                      <TargetaRaca raca={raca} />
                    </Pressable>
                  </Link>
                </View>
              ))}
            </View>

            {visibles < resultats.length ? (
              <Boto
                titol={`Mostra'n ${Math.min(PER_PAGINA, resultats.length - visibles)} més`}
                to="sobreGranat"
                onPress={() => setVisibles((v) => v + PER_PAGINA)}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TargetaRaca({ raca }: { raca: Breed }) {
  return (
    <Targeta estil={estils.targeta}>
      <FotoRaca url={raca.imatgeUrl} nom={raca.nom} alcada={170} />

      <Text style={estils.nom}>{raca.nom}</Text>

      <Text style={text.metadada}>
        {[
          etiquetaGrup(raca.grup),
          raca.pesKg ? `${Math.round(raca.pesKg)} kg` : null,
          raca.anysVida ? `${raca.anysVida} anys` : null,
          raca.origen,
        ].filter(Boolean).join(' · ')}
      </Text>

      {raca.termes.length > 0 ? (
        <View style={estils.xips}>
          {raca.termes.map((t) => (
            <Xip key={t} to="exit">{TRADUCCIO_TERME[t] ?? t}</Xip>
          ))}
        </View>
      ) : null}

      {raca.descripcio ? (
        <View style={estils.prosa}>
          <Text style={estils.marcaOriginal}>TEXT ORIGINAL DE THE DOG API · EN ANGLÈS</Text>
          <Text style={text.cosSecundari}>{raca.descripcio}</Text>
        </View>
      ) : null}
    </Targeta>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: {
    padding: espai.xxl, gap: espai.l,
    maxWidth: 1180, width: '100%', alignSelf: 'center',
  },
  encapcalament: { gap: espai.s, maxWidth: 620 },
  cerca: {
    height: 44, borderRadius: 10,
    backgroundColor: color.blanc,
    borderWidth: 1, borderColor: tinta.voraCamp,
    paddingHorizontal: espai.ml,
    fontFamily: familia.sans, fontSize: 14, color: color.tinta,
    marginTop: espai.xs,
  },
  graella: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.l },
  // Tres columnes: un terç menys la part proporcional dels dos buits.
  cela: { width: '31.7%', minWidth: 260, flexGrow: 1 },
  plena: { width: '100%' },
  targeta: { gap: espai.s, height: '100%' },
  imatge: {
    width: '100%', height: 160,
    borderRadius: radi.targeta,
    backgroundColor: '#e6ddd2',
  },
  imatgeBuida: { alignItems: 'center', justifyContent: 'center' },
  enllacTitol: { textDecorationLine: 'none' },
  nom: { ...text.nomLlista, fontSize: 17 },
  xips: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xxs },
  prosa: {
    gap: espai.xxs,
    borderLeftWidth: 2,
    borderLeftColor: tinta.franjaAbsencia,
    paddingLeft: espai.s,
  },
  marcaOriginal: { ...text.escalaBarra, color: tinta.metadada },
});
