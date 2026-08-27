/**
 * Lectura i escriptura de CSV per a les tasques de preparació de dades.
 *
 * Els fitxers de `docs/diccionari` els editen persones amb Numbers o Excel, que
 * exporten amb separadors, salts de línia i columnes sobreres variables segons la
 * configuració regional. Aquest mòdul absorbeix aquestes diferències perquè la
 * resta d'scripts puguin treballar amb dades netes.
 */

import { readFileSync } from 'node:fs';

export interface CsvLlegit {
  capçaleres: string[];
  files: string[][];
  /** Índex de columna per nom, per no dependre de l'ordre. */
  idx: Record<string, number>;
  separador: string;
  teniaCrlf: boolean;
  teniaBom: boolean;
  /** Columnes buides al final que ha afegit el full de càlcul i s'han descartat. */
  columnesFantasma: number;
}

/**
 * Parteix una línia de CSV respectant les cometes dobles, perquè les columnes de
 * justificació contenen prosa amb comes. Un `""` dins d'un camp entre cometes és
 * una cometa literal (RFC 4180).
 */
export function parteixLinia(linia: string, separador: string): string[] {
  const camps: string[] = [];
  let actual = '';
  let dinsCometes = false;

  for (let i = 0; i < linia.length; i++) {
    const c = linia[i];
    if (dinsCometes) {
      if (c === '"') {
        if (linia[i + 1] === '"') { actual += '"'; i++; } else { dinsCometes = false; }
      } else actual += c;
    } else if (c === '"') {
      dinsCometes = true;
    } else if (c === separador) {
      camps.push(actual.trim());
      actual = '';
    } else actual += c;
  }
  camps.push(actual.trim());
  return camps;
}

/**
 * Detecta el separador comptant quantes vegades apareix cada candidat a la
 * capçalera. Numbers i Excel en català exporten amb `;`, la majoria d'eines amb `,`.
 */
export function detectaSeparador(capçalera: string): ';' | ',' | '\t' {
  const candidats = [';', ',', '\t'] as const;
  let millor: ';' | ',' | '\t' = ',';
  let maxim = 0;
  for (const sep of candidats) {
    const n = capçalera.split(sep).length - 1;
    if (n > maxim) { maxim = n; millor = sep; }
  }
  return millor;
}

export function llegeixCsv(cami: string): CsvLlegit {
  const brut = readFileSync(cami, 'utf8');
  const teniaBom = brut.charCodeAt(0) === 0xfeff;
  const teniaCrlf = brut.includes('\r\n');

  const text = (teniaBom ? brut.slice(1) : brut).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const linies = text.split('\n').filter((l) => l.trim() !== '');

  const separador = detectaSeparador(linies[0]);
  const [capçalera, ...resta] = linies;

  let capçaleres = parteixLinia(capçalera, separador);
  let files = resta.map((l) => parteixLinia(l, separador));

  // Excel arrossega columnes buides si el full n'ha tingut mai contingut o format.
  // Es descarten les columnes finals que no tenen ni nom ni cap valor.
  let columnesFantasma = 0;
  while (
    capçaleres.length > 0 &&
    capçaleres[capçaleres.length - 1] === '' &&
    files.every((f) => (f[capçaleres.length - 1] ?? '') === '')
  ) {
    capçaleres = capçaleres.slice(0, -1);
    files = files.map((f) => f.slice(0, capçaleres.length));
    columnesFantasma += 1;
  }

  const idx = Object.fromEntries(capçaleres.map((c, i) => [c, i]));
  return { capçaleres, files, idx, separador, teniaCrlf, teniaBom, columnesFantasma };
}

/** Escapa un valor perquè sigui segur dins d'un CSV (cometes, comes, salts). */
export function cel·la(valor: string | number): string {
  const text = String(valor);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Serialitza al format canònic del projecte: coma, LF i BOM UTF-8 per a Excel. */
export function serialitzaCsv(capçaleres: string[], files: (string | number)[][]): string {
  return '﻿' + [capçaleres, ...files].map((f) => f.map(cel·la).join(',')).join('\n') + '\n';
}
