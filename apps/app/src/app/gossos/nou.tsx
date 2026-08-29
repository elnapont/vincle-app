/**
 * Alta d'un gos.
 *
 * **Pantalla que el handoff no té.** S'ha construït amb el vocabulari del sistema
 * —camps de `5c`, xips, botons— i caldrà que Claude Design la reculli quan es
 * regeneri el paquet.
 *
 * El selector de raça llegeix el catàleg real i deixa buscar-hi. La raça és
 * opcional a posta: un mestís pot no tenir-ne, i obligar a triar-ne una faria
 * inventar dades. Es desa el nom de la raça a més de l'identificador, perquè la
 * fitxa es pugui llegir encara que aquella raça desaparegui del catàleg extern.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { z } from 'zod';
import type { Breed, EstatGos } from '@vincle/shared-types';
import { ETIQUETA_ESTAT_GOS, estatGosSchema } from '@vincle/shared-types';
import { useCataleg } from '../../dades/useCataleg.ts';
import { creaGos } from '../../dades/gossos.ts';
import {
  Boto, Camp, Seccio, Targeta, Xip,
  color, espai, familia, radi, text, tinta,
} from '../../disseny/index.ts';

const ESTATS: EstatGos[] = ['avaluacio', 'ensinistrament', 'assignat'];

const gosSchema = z.object({
  nom: z.string().trim().min(1, 'Cal un nom.'),
  dataNaixement: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Escriu la data com ara 2024-03-15.')
    .refine((d) => new Date(d) <= new Date(), 'La data no pot ser al futur.'),
  estat: estatGosSchema,
});

export default function GosNou() {
  const router = useRouter();
  const { estat: estatCataleg } = useCataleg();
  // La fitxa de raça hi arriba amb la raça ja triada.
  const { breedId, breedNom } = useLocalSearchParams<{ breedId?: string; breedNom?: string }>();

  const [nom, setNom] = useState('');
  const [dataNaixement, setDataNaixement] = useState('');
  const [estat, setEstat] = useState<EstatGos>('avaluacio');
  const [familia, setFamilia] = useState('');
  /**
   * `undefined` vol dir que l'usuari encara no hi ha tocat res i, per tant, val la
   * raça que ve pel paràmetre; `null` vol dir que l'ha tret expressament. Es
   * deriva en comptes de posar-ho a un efecte, que provocaria un dibuix de més i
   * sobreescriuria la tria si el catàleg arribés tard.
   */
  const [racaManual, setRacaManual] = useState<Breed | null | undefined>(undefined);
  const [cercaRaca, setCercaRaca] = useState('');

  const racaDelParametre = useMemo(() => {
    if (!breedId || estatCataleg.fase !== 'llest') return null;
    return estatCataleg.cataleg.races.find((r) => r.id === breedId) ?? null;
  }, [breedId, estatCataleg]);

  const raca = racaManual === undefined ? racaDelParametre : racaManual;

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [desant, setDesant] = useState(false);

  const validacio = gosSchema.safeParse({ nom, dataNaixement, estat });

  const suggeriments = useMemo(() => {
    if (estatCataleg.fase !== 'llest') return [];
    const q = cercaRaca.trim().toLowerCase();
    if (q.length < 2) return [];
    return estatCataleg.cataleg.races
      .filter((r) => r.nom.toLowerCase().includes(q))
      .slice(0, 6);
  }, [cercaRaca, estatCataleg]);

  const validaCamp = (camp: 'nom' | 'dataNaixement') => () => {
    if (validacio.success) { setErrors((e) => ({ ...e, [camp]: undefined })); return; }
    const problema = validacio.error.issues.find((i) => i.path[0] === camp);
    setErrors((e) => ({ ...e, [camp]: problema?.message }));
  };

  const desa = async () => {
    if (!validacio.success) return;
    setDesant(true);
    setErrorGeneral(null);

    const { error } = await creaGos({
      nom: validacio.data.nom,
      breedId: raca?.id ?? breedId ?? null,
      breedNom: raca?.nom ?? breedNom ?? null,
      dataNaixement: validacio.data.dataNaixement,
      estat: validacio.data.estat,
      familiaAcollida: familia || null,
    });

    setDesant(false);
    if (error) { setErrorGeneral(error); return; }
    router.replace('/gossos');
  };

  return (
    <SafeAreaView style={estils.pantalla} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={estils.contingut}>
        <View style={estils.encapcalament}>
          <Text style={text.titolMobil}>Afegeix un gos</Text>
          <Text style={text.cosSecundari}>
            Només el nom i la data de naixement són obligatoris. La resta es pot
            completar més endavant.
          </Text>
        </View>

        <Targeta>
          <Camp
            etiqueta="Nom"
            value={nom}
            onChangeText={setNom}
            onBlur={validaCamp('nom')}
            error={errors.nom}
            placeholder="Fura"
          />

          <Camp
            etiqueta="Data de naixement"
            value={dataNaixement}
            onChangeText={setDataNaixement}
            onBlur={validaCamp('dataNaixement')}
            error={errors.dataNaixement}
            placeholder="2024-03-15"
            autoCapitalize="none"
          />

          <Camp
            etiqueta="Família d'acollida"
            value={familia}
            onChangeText={setFamilia}
            placeholder="Opcional"
          />
        </Targeta>

        <Targeta>
          <Seccio>Estat</Seccio>
          <View style={estils.xips}>
            {ESTATS.map((e) => (
              <Xip key={e} to={e === estat ? 'actiu' : 'neutre'} onPress={() => setEstat(e)}>
                {ETIQUETA_ESTAT_GOS[e]}
              </Xip>
            ))}
          </View>
        </Targeta>

        <Targeta>
          <Seccio>Raça de referència</Seccio>
          <Text style={text.cosSecundari}>
            Opcional. Serveix per relacionar el gos amb la fitxa de la seva raça;
            un mestís pot no tenir-ne.
          </Text>

          {raca ? (
            <View style={estils.racaTriada}>
              <Text style={text.nomLlista}>{raca.nom}</Text>
              <Pressable onPress={() => { setRacaManual(null); setCercaRaca(''); }}>
                <Text style={estils.treu}>Treu</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                value={cercaRaca}
                onChangeText={setCercaRaca}
                placeholder={
                  estatCataleg.fase === 'llest' ? 'Cerca una raça' : 'Carregant el catàleg…'
                }
                placeholderTextColor={tinta.metadada}
                editable={estatCataleg.fase === 'llest'}
                style={estils.cerca}
                autoCapitalize="none"
                accessibilityLabel="Cerca una raça"
              />
              {suggeriments.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => { setRacaManual(r); setCercaRaca(''); }}
                  style={estils.suggeriment}
                >
                  <Text style={text.cosSecundari}>{r.nom}</Text>
                  <Text style={text.metadada}>
                    {[r.pesKg ? `${Math.round(r.pesKg)} kg` : null,
                      r.anysVida ? `${r.anysVida} anys` : null].filter(Boolean).join(' · ')}
                  </Text>
                </Pressable>
              ))}
            </>
          )}
        </Targeta>

        {errorGeneral ? (
          <Targeta franja="vermell">
            <Text style={estils.errorGeneral}>{errorGeneral}</Text>
          </Targeta>
        ) : null}

        <View style={estils.accions}>
          <Boto
            titol={desant ? 'Desant…' : 'Desa el gos'}
            desactivat={!validacio.success || desant}
            onPress={desa}
            estil={estils.accio}
          />
          <Boto
            titol="Cancel·la"
            to="sobreGranat"
            onPress={() => router.back()}
            estil={estils.accio}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estils = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.paper },
  contingut: {
    padding: espai.xxl, gap: espai.l,
    maxWidth: 620, width: '100%', alignSelf: 'center',
  },
  encapcalament: { gap: espai.s },
  xips: { flexDirection: 'row', flexWrap: 'wrap', gap: espai.xs },
  cerca: {
    height: 44, borderRadius: 10,
    backgroundColor: color.blanc,
    borderWidth: 1, borderColor: tinta.voraCamp,
    paddingHorizontal: espai.ml,
    fontFamily: familia.sans, fontSize: 14, color: color.tinta,
  },
  suggeriment: {
    paddingVertical: espai.s,
    borderBottomWidth: 1, borderBottomColor: tinta.separador,
    gap: 2,
  },
  racaTriada: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: tinta.xipInactiu,
    borderRadius: radi.targeta,
    padding: espai.m,
  },
  treu: { ...text.cosSecundari, color: color.vermell },
  accions: { flexDirection: 'row', gap: espai.s },
  accio: { flex: 1 },
  errorGeneral: { ...text.cosSecundari, color: color.vermell },
});
