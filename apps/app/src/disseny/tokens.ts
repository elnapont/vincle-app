/**
 * Design tokens de Vincle.
 *
 * Transcrits del handoff h2 (`docs/design/README.md`). Cap pantalla ha d'escriure
 * mai un color ni una mida en cru: si un valor no és aquí, o falta un token o la
 * pantalla s'està desviant del sistema.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const color = {
  /** Primari: botons principals, xifres destacades, panells de marca. */
  granat: '#661414',
  /** Text sobre fons sorra. */
  granatFosc: '#4a0f0f',
  /** Acció secundària, navegació activa, errors, enllaços, marcador d'eix invertit. */
  vermell: '#a21a1a',
  /** Fons càlid, avatars, sèries secundàries, replè d'eix invertit i del mesurador. */
  sorra: '#c2ad9a',
  /** Èxit, fites assolides, primer resultat del rànquing, marca de pes fix. */
  oliva: '#608028',
  /** Text sobre fons oliva translúcid. */
  olivaFosc: '#4c6620',
  /** Text principal. */
  tinta: '#241a16',
  /** Fons de pantalla. */
  paper: '#fdfbf8',
  /** Superfície de targeta i barra de navegació. */
  blanc: '#ffffff',
} as const;

/**
 * Opacitats derivades de la tinta. Es fan servir sistemàticament, així que tenen
 * nom pel seu ÚS i no pel seu valor: així una pantalla demana «text secundari» i
 * no «tinta al 60 %».
 */
export const tinta = {
  textSecundari: 'rgba(36,26,22,.6)',
  etiqueta: 'rgba(36,26,22,.5)',
  metadada: 'rgba(36,26,22,.45)',
  /** Text del nom d'un eix que no té dades. */
  eixSenseDadesText: 'rgba(36,26,22,.45)',
  /** El guionet que substitueix la xifra quan no hi ha dades. */
  eixSenseDadesGuionet: 'rgba(36,26,22,.4)',
  /** Contorn de la barra d'un eix sense dades. */
  eixSenseDadesContorn: 'rgba(36,26,22,.25)',
  /** Franja lateral d'absència: no iniciat, advertiment, bloc de descartades. */
  franjaAbsencia: 'rgba(36,26,22,.15)',
  vora: 'rgba(36,26,22,.1)',
  pistaEix: 'rgba(36,26,22,.09)',
  separador: 'rgba(36,26,22,.08)',
  xipInactiu: 'rgba(36,26,22,.06)',
  voraCamp: 'rgba(36,26,22,.16)',
  /** Fons de fila en passar-hi el ratolí (només web). */
  fila: 'rgba(36,26,22,.03)',
} as const;

/**
 * Color de cada bloc del catàleg d'exercicis.
 *
 * No és una paleta nova: són els tons que ja hi ha, assignats per ordre de bloc.
 * El gràfic d'evolució de la fitxa del gos ja els feia servir per a les seves
 * sèries, i el catàleg d'exercicis els reaprofita perquè les dues pantalles
 * parlin el mateix idioma: el bloc 2 és del mateix color als dos llocs.
 */
const HUES_BLOC = ['#661414', '#a21a1a', '#c2ad9a', '#608028', '#4a0f0f'] as const;

export function colorBloc(bloc: number): string {
  return HUES_BLOC[(bloc - 1) % HUES_BLOC.length] ?? '#661414';
}

/**
 * El mateix color molt rebaixat, per tenyir el fons d'una targeta.
 *
 * L'opacitat és deliberadament baixa: ha de servir per agrupar d'un cop d'ull
 * sense competir amb els colors que sí que signifiquen alguna cosa —l'oliva de
 * l'èxit, el vermell de les alertes— ni fer il·legible el text de sobre.
 */
const TENYIT_BLOC = [
  'rgba(102,20,20,.05)',
  'rgba(162,26,26,.05)',
  'rgba(194,173,154,.16)',
  'rgba(96,128,40,.06)',
  'rgba(74,15,15,.05)',
] as const;

export function fonsBloc(bloc: number): string {
  return TENYIT_BLOC[(bloc - 1) % TENYIT_BLOC.length] ?? TENYIT_BLOC[0];
}

/** Fons translúcids de color per als xips. */
export const fons = {
  exit: 'rgba(96,128,40,.14)',
  alerta: 'rgba(162,26,26,.12)',
  neutreCalid: 'rgba(194,173,154,.38)',
  /** Halo de focus, segons els estats interactius del handoff. */
  focus: 'rgba(162,26,26,.15)',
} as const;

// ---------------------------------------------------------------------------
// Espaiat i formes
// ---------------------------------------------------------------------------

/**
 * Escala d'espaiat del handoff. Sempre amb `gap` de flex, mai amb marges entre
 * germans: així afegir o treure un element no obliga a retocar els marges dels
 * veïns.
 */
export const espai = {
  xxs: 4, xs: 6, s: 9, m: 12, ml: 14, l: 18, xl: 22, xxl: 28, xxxl: 32,
} as const;

export const radi = {
  /** Xips i botons de píndola. */
  pindola: 999,
  targetaMobil: 14,
  /** Targetes i camps a web. */
  targeta: 12,
  boto: 11,
  botoPetit: 9,
  barra: 4,
  avatar: 22,
} as const;

/** Alçades de barra segons el context (§ «Barres de progrés i barres d'eix»). */
export const alcadaBarra = {
  /** Dins d'una targeta a mòbil. */
  compacta: 5,
  /** Eixos i mesurador de recorregut. */
  eix: 6,
  /** Eixos a la fitxa de raça, on hi ha més espai. */
  eixFitxa: 7,
  /** Progrés de fita. */
  fita: 8,
} as const;

/** Amplada de la franja lateral que codifica rang o estat. */
export const FRANJA_LATERAL = 6;

/** Alçada mínima de qualsevol element tocable. */
export const TOCABLE_MINIM = 44;

// ---------------------------------------------------------------------------
// Punts de tall
// ---------------------------------------------------------------------------

/**
 * Les pantalles web es dissenyen a 1180px de contingut. Per sota de 900px el
 * panell lateral passa a sobre del contingut; per sota de 640px es fa servir la
 * variant mòbil.
 */
export const trencament = { mobil: 640, lateral: 900, contingut: 1180 } as const;

// ---------------------------------------------------------------------------
// Moviment
// ---------------------------------------------------------------------------

/**
 * Transicions de 150–200 ms per a color i opacitat; les barres animen l'amplada
 * en 400 ms en carregar el resultat. Res més: sense animacions decoratives.
 */
export const durada = { color: 180, barra: 400 } as const;
