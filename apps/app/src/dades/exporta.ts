/**
 * Descàrrega del CSV del rànquing.
 *
 * Separat de la generació perquè aquesta part depèn de la plataforma i aquella
 * no: així el contingut del fitxer es pot comprovar sense muntar l'aplicació.
 */

import { Platform } from 'react-native';
import { generaCsv, nomFitxer, type OpcionsExportacio } from './csv.ts';

export { generaCsv, nomFitxer } from './csv.ts';
export type { OpcionsExportacio } from './csv.ts';

export type ResultatExportacio =
  | { fet: true }
  | { fet: false; motiu: string };

/**
 * Baixa el CSV.
 *
 * Només a web, que és on es farà servir: el destí és enganxar la taula a la
 * memòria del treball, i això es fa amb un ordinador. A mòbil caldria escriure a
 * disc i obrir el full de compartir, i no s'ha implementat perquè no s'ha pogut
 * provar en cap dispositiu; val més dir-ho que deixar un botó que sembla que
 * funciona i no fa res.
 */
export function exporta(opcions: OpcionsExportacio): ResultatExportacio {
  if (Platform.OS !== 'web') {
    return { fet: false, motiu: 'De moment l\'exportació només funciona a la versió web.' };
  }

  try {
    const contingut = generaCsv(opcions);
    const blob = new Blob([contingut], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const enllac = document.createElement('a');
    enllac.href = url;
    enllac.download = nomFitxer(opcions.trastorn);
    document.body.appendChild(enllac);
    enllac.click();
    document.body.removeChild(enllac);
    URL.revokeObjectURL(url);

    return { fet: true };
  } catch (error) {
    return {
      fet: false,
      motiu: error instanceof Error ? error.message : 'No s\'ha pogut generar el fitxer.',
    };
  }
}
