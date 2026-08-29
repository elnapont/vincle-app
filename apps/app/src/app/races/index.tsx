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
  BarraNavegacio, Boto, Esquelet, FotoRaca, Targeta, TextOriginal, Xip,
  color, espai, familia, text, tinta, useTrencament,
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

/**
 * Columnes segons l'amplada disponible.
 *
 * Es calcula i no es deixa a `flexGrow`, que era el que ho feia malament: amb un
 * sol resultat de la cerca, aquell únic element s'estirava fins a l'amplada
 * sencera de la pantalla. Ara una targeta sola ocupa una columna, com totes.
 */
function columnes(amplada: number): number {
  if (amplada >= 1040) return 3;
  if (amplada >= 720) return 2;
  return 1;
}

/**
 * Parteix la llista en files de `mida` elements i omple l'última amb buits.
 *
 * Sembla més embolic que posar percentatges d'amplada, però permet fer servir
 * `gap` —que és el que demana el sistema, sense marges entre germans— i evita
 * que una targeta sola s'estiri fins a l'amplada sencera quan la cerca només
 * deixa un resultat. Els buits de l'última fila mantenen l'alineació.
 */
function enFiles<T>(elements: T[], mida: number): (T | null)[][] {
  const files: (T | null)[][] = [];
  for (let i = 0; i < elements.length; i += mida) {
    const fila: (T | null)[] = elements.slice(i, i + mida);
    while (fila.length < mida) fila.push(null);
    files.push(fila);
  }
  return files;
}

export default function CatalegRaces() {
  const { estat, reintenta } = useCataleg();
  const { esMobil, amplada: amplePantalla } = useTrencament();
  const [cerca, setCerca] = useState('');
  const [visibles, setVisibles] = useState(PER_PAGINA);

  // Igual que a la llista de gossos: el condicional dins del memo, si no crearia
  // un array nou a cada dibuix.
  const nColumnes = columnes(amplePantalla);

  const races = useMemo(
    () => (estat.fase === 'llest' ? estat.cataleg.races : []),
    [estat],
  );

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
          <View style={estils.fila}>
            {Array.from({ length: nColumnes }, (_, i) => (
              <View key={i} style={estils.cela}>
                <Esquelet alcada={280} opacitat={1 - i * 0.25} />
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
              {enFiles(resultats.slice(0, visibles), nColumnes).map((fila, f) => (
                <View key={f} style={estils.fila}>
                  {fila.map((raca, c) => (
                    <View key={raca?.id ?? `buit-${c}`} style={estils.cela}>
                      {raca ? (
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
                      ) : null}
                    </View>
                  ))}
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
      <FotoRaca url={raca.imatgeUrl} nom={raca.nom} />

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
        <TextOriginal titol="Descripció" contingut={raca.descripcio} />
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
  graella: { gap: espai.l },
  fila: { flexDirection: 'row', gap: espai.l, alignItems: 'stretch' },
  // `minWidth: 0` perquè un nom llarg no eixampli la columna i desquadri la fila.
  cela: { flex: 1, minWidth: 0 },
  plena: { width: '100%' },
  targeta: { gap: espai.s, height: '100%' },
  nom: { ...text.nomLlista, fontSize: 17 },
  xips: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xxs },
});
