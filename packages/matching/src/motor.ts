/**
 * Motor de matching — el nucli conceptual del treball (§5.2 i §5.2.3 del CLAUDE.md).
 *
 * TypeScript pur, sense cap API de Node ni del navegador. Això és deliberat: ha de
 * poder córrer tal qual dins d'una Edge Function de Supabase, que és Deno, i alhora
 * ser testejable amb Node sense muntar res.
 *
 * El càlcul té tres passos:
 *
 *   1. DERIVAR. Els termes del `temperament` d'una raça es tradueixen a eixos amb
 *      el diccionari, i els que cauen al mateix eix es fan mitjana.
 *   2. PUNTUAR. S'apliquen els pesos i les direccions del perfil del trastorn.
 *   3. ORDENAR. De major a menor, amb les races que superen el filtre de pes
 *      empeses al final però mai eliminades.
 */

import type {
  Breed, Contribucio, Direccio, Eix, EixDerivat, MatchProfile, MatchResult, PerfilTrastorn,
} from '@vincle/shared-types';
import { EIXOS_TEMPERAMENT, EIX_LONGEVITAT } from '@vincle/shared-types';
import { DICCIONARI } from './dades/diccionari.ts';

// ---------------------------------------------------------------------------
// Constants del model
// ---------------------------------------------------------------------------

/**
 * Valor que pren un eix quan no en tenim dades. És el punt mitjà, o sigui «no ho
 * sabem»: puntuar-hi 0 penalitzaria una raça per una cosa que l'API simplement no
 * diu. Cap a fora, però, el valor s'exposa com a `null` perquè la interfície pugui
 * dibuixar l'absència com a absència.
 */
export const NEUTRE = 5;

/**
 * Pes reservat a la longevitat, igual a tots els trastorns (§5.2.5). Els pesos de
 * temperament es reescalen al 90 % perquè el total continuï sumant 100.
 */
export const PES_LONGEVITAT = 10;

/**
 * Esperança de vida (anys) → valor 0–10. Plana per dalt i abrupta per baix: el
 * 76 % del catàleg viu entre 12 i 15 anys i no cal esmicolar-lo, mentre que les
 * races que no arriben als 9 anys sí que s'han de penalitzar. Un gos d'assistència
 * necessita uns dos anys d'ensinistrament, així que la longevitat es tradueix
 * directament en anys de feina útil.
 */
const ANCORES_VIDA: readonly (readonly [number, number])[] = [
  [7, 0], [9, 3], [11, 6], [13, 8.5], [15, 10],
];

/** Interpolació lineal entre els punts d'ancoratge, amb els extrems retallats. */
export function valorLongevitat(anysVida: number | null): number | null {
  if (anysVida === null) return null;

  const primera = ANCORES_VIDA[0]!;
  const ultima = ANCORES_VIDA[ANCORES_VIDA.length - 1]!;
  if (anysVida <= primera[0]) return primera[1];
  if (anysVida >= ultima[0]) return ultima[1];

  for (let i = 0; i < ANCORES_VIDA.length - 1; i++) {
    const [x1, y1] = ANCORES_VIDA[i]!;
    const [x2, y2] = ANCORES_VIDA[i + 1]!;
    if (anysVida <= x2) return y1 + ((anysVida - x1) * (y2 - y1)) / (x2 - x1);
  }
  return ultima[1];
}

// ---------------------------------------------------------------------------
// 1. Derivació dels eixos
// ---------------------------------------------------------------------------

/**
 * Deriva els vuit eixos d'una raça. No depèn del trastorn, així que per a un
 * rànquing només cal fer-ho un cop per raça i reaprofitar-ho a tots els perfils.
 */
export function derivaEixos(raça: Breed): EixDerivat[] {
  // Acumulem les puntuacions de cada eix abans de fer-ne la mitjana.
  const acumulat = new Map<string, { puntuacions: number[]; termes: string[] }>();

  for (const terme of raça.termes) {
    for (const assignacio of DICCIONARI[terme.toLowerCase()] ?? []) {
      const entrada = acumulat.get(assignacio.eix) ?? { puntuacions: [], termes: [] };
      entrada.puntuacions.push(assignacio.puntuacio);
      entrada.termes.push(terme);
      acumulat.set(assignacio.eix, entrada);
    }
  }

  const derivats: EixDerivat[] = EIXOS_TEMPERAMENT.map((eix) => {
    const entrada = acumulat.get(eix);
    if (!entrada || entrada.puntuacions.length === 0) {
      // Cap terme hi cau: absència, no un cinc.
      return { eix, valor: null, termes: [] };
    }
    const suma = entrada.puntuacions.reduce((a, b) => a + b, 0);
    return { eix, valor: suma / entrada.puntuacions.length, termes: entrada.termes };
  });

  // La longevitat no ve del diccionari sinó de `life_span`.
  derivats.push({ eix: EIX_LONGEVITAT, valor: valorLongevitat(raça.anysVida), termes: [] });

  return derivats;
}

// ---------------------------------------------------------------------------
// 2. Puntuació
// ---------------------------------------------------------------------------

/** Aplica la direcció: `resta` inverteix el valor dins de l'escala 0–10. */
function orienta(valor: number, direccio: Direccio): number {
  return direccio === 'resta' ? 10 - valor : valor;
}

/**
 * Compatibilitat 0–100 d'una raça amb un perfil, i el desglossament de com s'hi ha
 * arribat. La fórmula és una mitjana ponderada:
 *
 *     compatibilitat = Σ( pes × valor_orientat ) / ( Σ pes × 10 ) × 100
 *
 * Els set eixos de temperament es reescalen al 90 % per deixar el 10 % restant a
 * la longevitat, de manera que el total continua sumant 100.
 */
export function puntua(
  eixos: readonly EixDerivat[],
  perfil: PerfilTrastorn,
): { puntuacio: number; contribucions: Contribucio[] } {
  const valors = new Map<Eix, number | null>(eixos.map((e) => [e.eix, e.valor]));
  const factor = (100 - PES_LONGEVITAT) / 100;

  const ponderats: { eix: Eix; pes: number; direccio: Direccio }[] = [
    ...perfil.eixos.map((e) => ({ eix: e.eix as Eix, pes: e.pes * factor, direccio: e.direccio })),
    { eix: EIX_LONGEVITAT, pes: PES_LONGEVITAT, direccio: 'suma' as Direccio },
  ];

  let numerador = 0;
  let pesTotal = 0;
  const contribucions: Contribucio[] = [];

  for (const { eix, pes, direccio } of ponderats) {
    const valor = valors.get(eix) ?? null;
    // Per puntuar, l'absència val el neutre; per mostrar, continua sent absència.
    const orientat = orienta(valor ?? NEUTRE, direccio);
    numerador += pes * orientat;
    pesTotal += pes;
    contribucions.push({ eix, valor, pes, direccio, aportacio: (pes * orientat) / 10 });
  }

  return { puntuacio: (numerador / (pesTotal * 10)) * 100, contribucions };
}

// ---------------------------------------------------------------------------
// 3. Rànquing
// ---------------------------------------------------------------------------

/**
 * Rànquing complet de races per a un qüestionari.
 *
 * El filtre de pes màxim NO elimina races: les empeny al final amb el motiu
 * visible (§5.2.4). Així mai no queda una llista buida i l'usuari entén per què
 * una raça que semblaria bona no és a dalt.
 */
export function ranquing(
  races: readonly Breed[],
  perfil: PerfilTrastorn,
  questionari: Pick<MatchProfile, 'pesMaximKg'>,
): MatchResult[] {
  const avaluades = races.map((raça) => {
    const eixos = derivaEixos(raça);
    const { puntuacio, contribucions } = puntua(eixos, perfil);

    const excedeix =
      questionari.pesMaximKg !== null &&
      raça.pesKg !== null &&
      raça.pesKg > questionari.pesMaximKg;

    return {
      raça,
      eixos,
      puntuacio,
      contribucions,
      excedeix,
      penalitzacio: excedeix ? `penalitzada per mida (${Math.round(raça.pesKg!)} kg)` : null,
    };
  });

  // Les penalitzades van al final, i dins de cada grup s'ordena per puntuació.
  avaluades.sort((a, b) =>
    Number(a.excedeix) - Number(b.excedeix) || b.puntuacio - a.puntuacio);

  return avaluades.map((a, i) => ({
    breedId: a.raça.id,
    nom: a.raça.nom,
    puntuacio: a.puntuacio,
    posicio: i + 1,
    totalAvaluades: avaluades.length,
    eixos: a.eixos,
    contribucions: a.contribucions,
    eixosSenseDades: a.eixos.filter((e) => e.valor === null).length,
    penalitzacio: a.penalitzacio,
  }));
}
