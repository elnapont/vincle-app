/**
 * Proves del motor de matching.
 *
 * Les xifres esperades no són inventades: surten de la previsualització que es va
 * fer sobre les 631 races reals abans d'implementar res
 * (`docs/diccionari/previsualitzacio-ranquing.md`). Si aquestes proves passen, el
 * motor del paquet calcula exactament el mateix que el script de validació, i
 * qualsevol canvi que ho trenqui es detecta de seguida.
 *
 * Els casos són races reals amb el seu `temperament` tal com arriba de l'API.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Breed } from '@vincle/shared-types';
import { derivaEixos, puntua, ranquing, valorLongevitat, NEUTRE } from './motor.ts';
import { perfilDe } from './perfils.ts';

function raça(nom: string, temperament: string, pesKg: number, anysVida: number): Breed {
  return {
    id: nom.toLowerCase().replace(/\s+/g, '-'),
    nom,
    termes: temperament.split(',').map((t) => t.trim().toLowerCase()),
    grup: null, pesKg, anysVida, alcadaCm: null,
    descripcio: null, historia: null, origen: null, imatgeUrl: null,
  };
}

const GOLDEN = raça(
  'Golden Retriever',
  'Friendly, Intelligent, Devoted, Confident, Loyal, Eager to please', 30, 11);

const BOHEMIAN = raça(
  'Bohemian Shepherd',
  'Intelligent, loyal, calm, confident, eager to please, energetic, gentle, adaptable', 22, 13);

const LABRADOR = raça(
  'Labrador Retriever',
  'Friendly, outgoing, energetic, intelligent, gentle, eager to please', 31, 11);

/** Valor d'un eix concret, per no repetir el `find` a cada asserció. */
const valorDe = (raça: Breed, eix: string) =>
  derivaEixos(raça).find((e) => e.eix === eix)?.valor ?? null;

// ---------------------------------------------------------------------------
// Derivació
// ---------------------------------------------------------------------------

test('deriva els eixos fent la mitjana dels termes que hi cauen', () => {
  // intelligent (7) i eager to please (10) → entrenabilitat 8,5
  assert.equal(valorDe(GOLDEN, 'entrenabilitat'), 8.5);
  // friendly (9) i confident... la sociabilitat només rep friendly
  assert.equal(valorDe(GOLDEN, 'sociabilitat'), 9);
});

test('un eix sense cap terme és null, no un cinc', () => {
  // El golden no té cap terme que caigui a energia, calma ni alerta.
  assert.equal(valorDe(GOLDEN, 'energia'), null);
  assert.equal(valorDe(GOLDEN, 'calma'), null);
  assert.equal(valorDe(GOLDEN, 'alerta'), null);
  assert.equal(derivaEixos(GOLDEN).filter((e) => e.valor === null).length, 3);
});

test('el bohemian shepherd només té l\'alerta sense dades', () => {
  const sense = derivaEixos(BOHEMIAN).filter((e) => e.valor === null);
  assert.deepEqual(sense.map((e) => e.eix), ['alerta']);
  // La calma sí que la té, i alta: és el detall que la maqueta va dibuixar malament.
  assert.equal(valorDe(BOHEMIAN, 'calma'), 9);
});

test('un terme desdoblat afecta els dos eixos', () => {
  // `independent` té dues files al diccionari: orientacio-persona i entrenabilitat.
  const gos = raça('Prova', 'independent', 20, 12);
  assert.equal(valorDe(gos, 'orientacio-persona'), 4);
  assert.equal(valorDe(gos, 'entrenabilitat'), 3);
});

// ---------------------------------------------------------------------------
// Longevitat
// ---------------------------------------------------------------------------

test('la longevitat interpola entre els punts d\'ancoratge', () => {
  assert.equal(valorLongevitat(7), 0);
  assert.equal(valorLongevitat(11), 6);
  assert.equal(valorLongevitat(13), 8.5);
  assert.equal(valorLongevitat(15), 10);
  // Fora de rang, es retalla; sense dada, null.
  assert.equal(valorLongevitat(6.5), 0);
  assert.equal(valorLongevitat(20), 10);
  assert.equal(valorLongevitat(null), null);
});

// ---------------------------------------------------------------------------
// Puntuació — les xifres de la previsualització
// ---------------------------------------------------------------------------

test('reprodueix les puntuacions de TEA de la previsualització', () => {
  const tea = perfilDe('tea');
  const arrodoneix = (r: Breed) => Math.round(puntua(derivaEixos(r), tea).puntuacio * 10) / 10;

  assert.equal(arrodoneix(BOHEMIAN), 75.1);
  assert.equal(arrodoneix(GOLDEN), 68.7);
  assert.equal(arrodoneix(LABRADOR), 65.2);
});

test('una raça amb tots els eixos al neutre treu exactament el 50 %', () => {
  // Cap terme conegut i cap esperança de vida: tot indefinit.
  const desconeguda = raça('Desconeguda', 'xyzzy', 20, 0);
  const sensVida: Breed = { ...desconeguda, anysVida: null };
  const { puntuacio } = puntua(derivaEixos(sensVida), perfilDe('tea'));
  assert.equal(puntuacio, NEUTRE * 10);
});

test('la direcció resta inverteix el valor', () => {
  const tea = perfilDe('tea');
  // A tots els perfils, `alerta` va en resta: una raça alerta hi perd punts.
  const alerta = raça('Alerta', 'alert', 20, 13);
  const neutra = raça('Neutra', 'xyzzy', 20, 13);
  const p = (r: Breed) => puntua(derivaEixos(r), tea).puntuacio;
  assert.ok(p(alerta) < p(neutra), 'una raça etiquetada alert ha de puntuar menys');
});

// ---------------------------------------------------------------------------
// Rànquing i filtre de pes
// ---------------------------------------------------------------------------

test('ordena de major a menor i numera les posicions', () => {
  const r = ranquing([GOLDEN, BOHEMIAN, LABRADOR], perfilDe('tea'), { pesMaximKg: null });
  assert.deepEqual(r.map((x) => x.nom), ['Bohemian Shepherd', 'Golden Retriever', 'Labrador Retriever']);
  assert.deepEqual(r.map((x) => x.posicio), [1, 2, 3]);
  assert.equal(r[0]!.totalAvaluades, 3);
});

test('el filtre de pes empeny al final però no elimina cap raça', () => {
  const r = ranquing([GOLDEN, BOHEMIAN, LABRADOR], perfilDe('tea'), { pesMaximKg: 25 });

  // Cap desapareix: el rànquing continua tenint les tres.
  assert.equal(r.length, 3);
  // El bohemian (22 kg) passa el filtre; el golden (30) i el labrador (31), no.
  assert.equal(r[0]!.nom, 'Bohemian Shepherd');
  assert.equal(r[0]!.penalitzacio, null);
  assert.equal(r[1]!.penalitzacio, 'penalitzada per mida (30 kg)');
  assert.equal(r[2]!.penalitzacio, 'penalitzada per mida (31 kg)');
});

test('compta els eixos sense dades de cada resultat', () => {
  const r = ranquing([GOLDEN, BOHEMIAN], perfilDe('tea'), { pesMaximKg: null });
  assert.equal(r.find((x) => x.nom === 'Golden Retriever')!.eixosSenseDades, 3);
  assert.equal(r.find((x) => x.nom === 'Bohemian Shepherd')!.eixosSenseDades, 1);
});

test('les contribucions sumen la puntuació final', () => {
  const { puntuacio, contribucions } = puntua(derivaEixos(GOLDEN), perfilDe('tea'));
  const suma = contribucions.reduce((a, c) => a + c.aportacio, 0);
  assert.ok(Math.abs(suma - puntuacio) < 1e-9, 'el desglossament ha de quadrar amb el total');
});
