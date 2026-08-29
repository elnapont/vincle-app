/**
 * Pantalla `2a` — entrada.
 *
 * Dues composicions ben diferents segons l'amplada, com fixa el handoff: a mòbil,
 * fons granat a tota la pantalla amb el contingut alineat a baix, a l'abast del
 * polze; a web, partició 44/56 amb el panell de marca a l'esquerra.
 *
 * La validació es fa amb Zod i segueix el patró de `5c`: l'error apareix sota el
 * camp que l'ha provocat, no en un avís global, i el botó queda desactivat mentre
 * el formulari no sigui vàlid.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { useSessio } from '../estat/Sessio.tsx';
import {
  Boto, Camp, color, espai, familia, text, tinta, useTrencament,
} from '../disseny/index.ts';

const credencialsSchema = z.object({
  correu: z.string().min(1, 'Cal un correu.').email('Aquest correu no té bona pinta.'),
  contrasenya: z.string().min(1, 'Cal una contrasenya.'),
});

export default function Entrada() {
  const router = useRouter();
  const { entra } = useSessio();
  const { esMobil } = useTrencament();

  const [correu, setCorreu] = useState('');
  const [contrasenya, setContrasenya] = useState('');
  const [errors, setErrors] = useState<{ correu?: string; contrasenya?: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviant, setEnviant] = useState(false);
  const [mantenirSessio, setMantenirSessio] = useState(true);

  const validacio = credencialsSchema.safeParse({ correu, contrasenya });

  /** Es valida en sortir del camp, no mentre s'escriu: molestaria a cada lletra. */
  const validaCamp = (camp: 'correu' | 'contrasenya') => () => {
    if (validacio.success) { setErrors((e) => ({ ...e, [camp]: undefined })); return; }
    const problema = validacio.error.issues.find((i) => i.path[0] === camp);
    setErrors((e) => ({ ...e, [camp]: problema?.message }));
  };

  const envia = async () => {
    if (!validacio.success) return;
    setEnviant(true);
    setErrorGeneral(null);

    const { error } = await entra(validacio.data.correu, validacio.data.contrasenya);
    setEnviant(false);

    if (error) { setErrorGeneral(error); return; }
    router.replace('/');
  };

  const formulari = (
    <>
      <Camp
        etiqueta="Correu"
        value={correu}
        onChangeText={setCorreu}
        onBlur={validaCamp('correu')}
        error={errors.correu}
        to={esMobil ? 'granat' : 'clar'}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="elna@vincle.cat"
      />
      <Camp
        etiqueta="Contrasenya"
        value={contrasenya}
        onChangeText={setContrasenya}
        onBlur={validaCamp('contrasenya')}
        error={errors.contrasenya}
        to={esMobil ? 'granat' : 'clar'}
        secureTextEntry
        autoComplete="current-password"
        onSubmitEditing={envia}
      />
      {errorGeneral ? (
        <Text style={[estils.errorGeneral, esMobil && { color: color.sorra }]}>
          {errorGeneral}
        </Text>
      ) : null}
    </>
  );

  // --- Mòbil: fons granat, contingut a baix ---------------------------------
  if (esMobil) {
    return (
      <SafeAreaView style={estils.pantallaMobil} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={estils.contingutMobil}>
          <View style={estils.marca}>
            <View style={estils.logotip}>
              <Text style={estils.logotipLletra}>V</Text>
            </View>
            <Text style={estils.wordmark}>Vincle</Text>
            <Text style={estils.subtitol}>
              Acompanyem l'ensinistrament de gossos d'assistència, sessió a sessió.
            </Text>
          </View>

          <View style={estils.formulari}>
            {formulari}
            <Boto
              titol={enviant ? 'Entrant…' : 'Entra'}
              to="sobreGranat"
              desactivat={!validacio.success || enviant}
              onPress={envia}
              estil={estils.botoMobil}
            />
            <View style={estils.peuMobil}>
              <Text style={estils.peuText}>No tens compte?</Text>
              <Text style={estils.peuEnllac}>Sol·licita accés</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Web: partició 44 / 56 -------------------------------------------------
  return (
    <View style={estils.pantallaWeb}>
      <View style={estils.panellMarca}>
        <View style={estils.marcaPetita}>
          <View style={estils.logotipPetit}>
            <Text style={estils.logotipLletraPetita}>V</Text>
          </View>
          <Text style={estils.nomMarca}>Vincle</Text>
        </View>

        <View style={estils.titularBloc}>
          <Text style={estils.titular}>
            Cada gos té el seu ritme. Nosaltres el recordem.
          </Text>
          <Text style={estils.subtitolWeb}>
            Sessions, fites i evolució en un sol lloc, i una guia per entendre quins
            temperaments encaixen amb cada persona.
          </Text>
        </View>

        <Text style={estils.versio}>v1.0 · català</Text>
      </View>

      <View style={estils.panellFormulari}>
        <Text style={text.titolWeb}>Benvinguda de nou</Text>
        {formulari}

        <View style={estils.filaOpcions}>
          <Pressable
            onPress={() => setMantenirSessio((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: mantenirSessio }}
            style={estils.casella}
          >
            <View style={[estils.quadre, mantenirSessio && estils.quadreMarcat]} />
            <Text style={text.cosSecundari}>Mantén la sessió oberta</Text>
          </Pressable>
          <Text style={estils.enllacVermell}>He oblidat la contrasenya</Text>
        </View>

        <Boto
          titol={enviant ? 'Entrant…' : 'Entra'}
          to="secundari"
          desactivat={!validacio.success || enviant}
          onPress={envia}
          estil={estils.botoWeb}
        />
      </View>
    </View>
  );
}

const estils = StyleSheet.create({
  // --- Mòbil -----------------------------------------------------------------
  pantallaMobil: { flex: 1, backgroundColor: color.granat },
  contingutMobil: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: espai.xxl,
  },
  marca: { gap: espai.ml },
  logotip: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: color.sorra,
    alignItems: 'center', justifyContent: 'center',
  },
  logotipLletra: { fontFamily: familia.serif, fontSize: 30, color: color.granat },
  wordmark: { fontFamily: familia.serif, fontSize: 46, lineHeight: 46, color: color.blanc },
  subtitol: {
    fontFamily: familia.sans, fontSize: 16, lineHeight: 24,
    color: 'rgba(255,255,255,.72)', maxWidth: 280,
  },
  formulari: { gap: espai.m },
  botoMobil: { height: 54, marginTop: espai.xs },
  peuMobil: { flexDirection: 'row', justifyContent: 'center', gap: espai.xs, marginTop: espai.xxs },
  peuText: { fontFamily: familia.sans, fontSize: 13, color: 'rgba(255,255,255,.55)' },
  peuEnllac: { fontFamily: familia.sansFort, fontSize: 13, color: color.sorra },

  // --- Web -------------------------------------------------------------------
  pantallaWeb: { flex: 1, flexDirection: 'row', backgroundColor: color.paper },
  panellMarca: {
    width: '44%',
    backgroundColor: color.granat,
    padding: 40,
    justifyContent: 'space-between',
  },
  marcaPetita: { flexDirection: 'row', alignItems: 'center', gap: espai.s },
  logotipPetit: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: color.sorra,
    alignItems: 'center', justifyContent: 'center',
  },
  logotipLletraPetita: { fontFamily: familia.serif, fontSize: 19, color: color.granat },
  nomMarca: { fontFamily: familia.sansFort, fontSize: 15, color: color.blanc },
  titularBloc: { gap: espai.l },
  titular: {
    fontFamily: familia.serif, fontSize: 40, lineHeight: 46,
    color: color.blanc, maxWidth: 330,
  },
  subtitolWeb: {
    fontFamily: familia.sans, fontSize: 15, lineHeight: 24,
    color: 'rgba(255,255,255,.66)', maxWidth: 320,
  },
  versio: { fontFamily: familia.mono, fontSize: 12, color: 'rgba(255,255,255,.4)' },
  panellFormulari: {
    flex: 1,
    paddingHorizontal: 64,
    paddingVertical: 56,
    justifyContent: 'center',
    gap: espai.xl,
    maxWidth: 620,
  },
  filaOpcions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: espai.m },
  casella: { flexDirection: 'row', alignItems: 'center', gap: espai.s },
  quadre: {
    width: 16, height: 16, borderRadius: 4,
    borderWidth: 1, borderColor: tinta.voraCamp,
  },
  quadreMarcat: { backgroundColor: color.granat, borderColor: color.granat },
  enllacVermell: { ...text.cosSecundari, color: color.vermell },
  botoWeb: { height: 50 },

  errorGeneral: { ...text.cosSecundari, color: color.vermell },
});
