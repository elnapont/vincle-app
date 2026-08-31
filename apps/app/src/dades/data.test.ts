/**
 * Proves de les dates escrites a mà.
 *
 * Es proven aquí i no des de la pantalla perquè el mòdul no importa res de React
 * Native: es pot executar amb Node tal qual. El que s'hi comprova són els casos
 * que una expressió regular deixaria passar —el 31 de febrer, el 29 de febrer
 * d'un any que no és de traspàs— i el comportament d'esborrar cap enrere, que és
 * on la majoria de màscares fallen.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avuiISO, dataEscrita, dataISO, emmascaraData } from './data.ts';

test('la màscara posa les barres a mesura que s’escriu', () => {
  assert.equal(emmascaraData('1'), '1');
  assert.equal(emmascaraData('15'), '15');
  // La barra apareix amb la xifra següent, no just després de la segona.
  assert.equal(emmascaraData('153'), '15/3');
  assert.equal(emmascaraData('15032024'), '15/03/2024');
});

test('la màscara deixa esborrar cap enrere', () => {
  // Amb la barra posada de seguida, aquest cas la tornaria a posar i el camp no
  // es podria buidar mai.
  assert.equal(emmascaraData('15/'), '15');
  assert.equal(emmascaraData('15'), '15');
  assert.equal(emmascaraData(''), '');
});

test('la màscara ignora el que no són xifres i no passa de vuit', () => {
  assert.equal(emmascaraData('15/03/2024'), '15/03/2024');
  assert.equal(emmascaraData('abc15xy03'), '15/03');
  assert.equal(emmascaraData('150320249999'), '15/03/2024');
});

test('converteix a ISO', () => {
  assert.equal(dataISO('15/03/2024'), '2024-03-15');
  assert.equal(dataISO('01/01/2020'), '2020-01-01');
  assert.equal(dataISO(' 15/03/2024 '), '2024-03-15');
});

test('rebutja les dates que no existeixen', () => {
  assert.equal(dataISO('31/02/2024'), null, '31 de febrer');
  assert.equal(dataISO('31/04/2024'), null, 'abril té 30 dies');
  assert.equal(dataISO('29/02/2023'), null, '2023 no és de traspàs');
  assert.equal(dataISO('29/02/2024'), '2024-02-29', '2024 sí que ho és');
  assert.equal(dataISO('00/01/2024'), null);
  assert.equal(dataISO('15/13/2024'), null);
});

test('rebutja el que no té la forma', () => {
  assert.equal(dataISO('15/03'), null);
  assert.equal(dataISO('2024-03-15'), null);
  assert.equal(dataISO('5/3/2024'), null, 'demana dues xifres');
  assert.equal(dataISO(''), null);
});

test('torna d’ISO a la forma escrita', () => {
  assert.equal(dataEscrita('2024-03-15'), '15/03/2024');
  assert.equal(dataEscrita(''), '');
});

test('avui surt del moment que se li dona, no del rellotge', () => {
  assert.equal(avuiISO(Date.UTC(2026, 7, 31, 22, 30)), '2026-08-31');
  // La mateixa entrada ha de donar sempre el mateix: és el que fa que la
  // validació es pugui executar mentre es dibuixa la pantalla.
  const moment = Date.UTC(2024, 0, 1);
  assert.equal(avuiISO(moment), avuiISO(moment));
});
