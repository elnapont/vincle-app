/**
 * Generació del CSV del rànquing.
 *
 * El destí previst no és una altra aplicació sinó **la memòria del treball de
 * recerca**: poder enganxar la taula de races més compatibles per a cada trastorn
 * amb les xifres reals, sense copiar-les a mà de la pantalla. Per això el fitxer
 * porta el rànquing sencer i no només el que es veu, i porta els valors per eix,
 * que és el que permet refer el càlcul i comprovar-lo.
 *
 * Aquest fitxer no importa res de React Native a posta: així la generació es pot
 * executar i comprovar amb Node, sense muntar l'aplicació.
 */

import type { Breed, Eix, MatchResult, Trastorn } from '@vincle/shared-types';
import { ETIQUETA_EIX, ETIQUETA_TRASTORN } from '@vincle/shared-types';

/**
 * Separador de camps.
 *
 * Punt i coma i no coma, perquè els decimals van amb coma: amb el separador de
 * coma, un full de càlcul en català partiria els números pel mig.
 */
const SEPARADOR = ';';

/**
 * Escapa un valor perquè sigui segur dins d'un CSV.
 *
 * Només cal escapar el que pot confondre el lector: el separador, les cometes i
 * els salts de línia. La coma **no** hi entra, perquè no és el separador — si
 * s'escapés, tots els decimals sortirien entre cometes i alguns fulls de càlcul
 * els importarien com a text, cosa que impedeix ordenar-los o sumar-los.
 */
function cel·la(valor: string | number | null): string {
  if (valor === null) return '';
  const text = String(valor);
  return new RegExp(`["${SEPARADOR}\n]`).test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

/** Nom de columna apte per a màquines: sense accents ni espais. */
function nomColumna(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/·/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_');
}

/** Els decimals es formaten amb coma, que és el que espera un full en català. */
function numero(valor: number, decimals = 1): string {
  return valor.toFixed(decimals).replace('.', ',');
}

export interface OpcionsExportacio {
  trastorn: Trastorn;
  resultats: readonly MatchResult[];
  /** Catàleg, per poder-hi afegir el pes i l'esperança de vida de cada raça. */
  races: readonly Breed[];
  /** Eixos que es desglossen en columnes: els de més pes del perfil. */
  eixos: readonly Eix[];
  pesMaximKg: number | null;
}

/** Genera el contingut del CSV. */
export function generaCsv({ trastorn, resultats, races, eixos, pesMaximKg }: OpcionsExportacio): string {
  const perId = new Map(races.map((r) => [r.id, r]));
  const capçaleres = [
    'posicio',
    'raca',
    'compatibilitat',
    'pes_kg',
    'anys_vida',
    ...eixos.map((e) => nomColumna(ETIQUETA_EIX[e])),
    'eixos_sense_dades',
    'penalitzacio',
  ];

  const files = resultats.map((r) => {
    const valorDe = (eix: Eix) => {
      const derivat = r.eixos.find((e) => e.eix === eix);
      return derivat?.valor === null || derivat === undefined ? null : numero(derivat.valor);
    };

    const raça = perId.get(r.breedId);

    return [
      r.posicio,
      r.nom,
      numero(r.puntuacio),
      raça?.pesKg !== null && raça?.pesKg !== undefined ? numero(raça.pesKg, 0) : null,
      raça?.anysVida !== null && raça?.anysVida !== undefined ? numero(raça.anysVida) : null,
      ...eixos.map(valorDe),
      r.eixosSenseDades,
      r.penalitzacio,
    ];
  });

  // Un encapçalament de context perquè el fitxer s'expliqui sol d'aquí uns mesos.
  const context = [
    `# Vincle · rànquing de compatibilitat`,
    `# Trastorn: ${ETIQUETA_TRASTORN[trastorn]}`,
    `# Eixos desglossats: ${eixos.map((e) => ETIQUETA_EIX[e]).join(', ')}`,
    `# Filtre de pes màxim: ${pesMaximKg === null ? 'cap' : `${pesMaximKg} kg`}`,
    `# Races avaluades: ${resultats.length}`,
    `# La compatibilitat va del 41 % al 80 %: cap raça del catàleg no arriba al 80 %.`,
  ];

  const linies = [
    ...context,
    capçaleres.map(cel·la).join(SEPARADOR),
    ...files.map((f) => f.map(cel·la).join(SEPARADOR)),
  ];

  // BOM UTF-8 perquè Excel obri bé els accents.
  return '﻿' + linies.join('\n') + '\n';
}

export function nomFitxer(trastorn: Trastorn): string {
  const avui = new Date().toISOString().slice(0, 10);
  return `vincle-compatibilitat-${trastorn}-${avui}.csv`;
}

