/**
 * Traducció de The Dog API al model intern `Breed`.
 *
 * Aquesta és la capa de normalització que recomana el §2.2 del CLAUDE.md: si
 * canvia el tier o l'API, només s'ha de tocar aquest fitxer i la lògica de
 * matching es queda igual. Tot el que sap de la forma externa de les dades viu
 * aquí i enlloc més.
 */

/** Forma —parcial i tolerant— del que retorna The Dog API. */
interface RaçaExterna {
  id?: number | string;
  name?: string;
  temperament?: string | null;
  breed_group?: string | null;
  life_span?: string | null;
  origin?: string | null;
  description?: string | null;
  history?: string | null;
  weight?: { metric?: string } | null;
  height?: { metric?: string } | null;
  image?: { url?: string } | null;
}

export interface Breed {
  id: string;
  nom: string;
  termes: string[];
  grup: string | null;
  pesKg: number | null;
  anysVida: number | null;
  alcadaCm: number | null;
  descripcio: string | null;
  historia: string | null;
  origen: string | null;
  imatgeUrl: string | null;
}

/**
 * Agrupació canònica de `breed_group`. El camp arriba brut, amb sinònims i
 * variants del mateix grup («scenthound» i «scent hound», «spitz», «spitz-type» i
 * «spitz and primitive types»). Aquest mapa els redueix a un conjunt tancat.
 */
const GRUP_CANONIC: Record<string, string> = {
  'hound': 'sabues', 'scenthound': 'sabues', 'scent hound': 'sabues',
  'sighthound': 'llebrer', 'sighthound & pariah': 'llebrer',
  'working': 'treball', 'guardian': 'treball', 'utility': 'treball',
  'herding': 'pastor', 'pastoral/herding': 'pastor',
  'sporting': 'mostra-cobrament',
  'terrier': 'terrier',
  'toy': 'miniatura',
  'companion': 'companyia',
  'non-sporting': 'no-esportiu',
  'spitz': 'spitz-primitiu', 'spitz-type': 'spitz-primitiu',
  'spitz and primitive types': 'spitz-primitiu', 'northern': 'spitz-primitiu',
  'primitive': 'spitz-primitiu', 'primitive/wild canid': 'spitz-primitiu',
  'pariah': 'spitz-primitiu', 'landrace': 'spitz-primitiu',
  'mixed': 'mestis', 'mixed breed': 'mestis',
  'foundation stock service': 'sense-classificar', 'unknown': 'sense-classificar',
};

/**
 * Punt mitjà d'un rang numèric escrit com a text.
 *
 * Els camps de mida arriben en formes molt diverses: «3.2 - 4.5», «12-15 years» i
 * fins i tot «Male: 29-36; Female: 25-32». Es prenen tots els números i se'n fa el
 * punt mitjà entre el mínim i el màxim, que per a un valor de raça és prou.
 */
function puntMig(text: string | null | undefined): number | null {
  const nombres = (text ?? '').match(/\d+(\.\d+)?/g)?.map(Number);
  if (!nombres || nombres.length === 0) return null;
  return (Math.min(...nombres) + Math.max(...nombres)) / 2;
}

export function normalitza(externa: RaçaExterna): Breed | null {
  // Sense identificador o sense nom no és utilitzable per a res.
  if (externa.id === undefined || !externa.name) return null;

  const grupBrut = (externa.breed_group ?? '').trim().toLowerCase();

  return {
    id: String(externa.id),
    nom: externa.name,
    termes: (externa.temperament ?? '')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0),
    grup: grupBrut ? (GRUP_CANONIC[grupBrut] ?? grupBrut) : null,
    pesKg: puntMig(externa.weight?.metric),
    anysVida: puntMig(externa.life_span),
    alcadaCm: puntMig(externa.height?.metric),
    descripcio: externa.description ?? null,
    historia: externa.history ?? null,
    origen: externa.origin ?? null,
    imatgeUrl: externa.image?.url ?? null,
  };
}
