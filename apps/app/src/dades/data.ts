/**
 * Dates escrites a mà: màscara, conversió i validació.
 *
 * A l'aplicació les dates s'escriuen **DD/MM/AAAA**, que és com s'escriuen aquí.
 * A la base de dades hi van en ISO (`AAAA-MM-DD`), que és el que entén la
 * columna `date` i l'única forma que s'ordena bé com a text. La traducció entre
 * les dues viu aquí i no dins d'un component: així es pot provar sola.
 */

/**
 * Formata el que s'escriu posant les barres pel seu compte.
 *
 * Es queda només amb les xifres i les reparteix 2 · 2 · 4. La barra apareix quan
 * arriba la xifra següent, no just després de la segona: si s'afegís de seguida,
 * esborrar cap enrere la tornaria a posar tot seguit i el camp no es podria
 * buidar.
 */
export function emmascaraData(text: string): string {
  const xifres = text.replace(/\D/g, '').slice(0, 8);

  return [xifres.slice(0, 2), xifres.slice(2, 4), xifres.slice(4, 8)]
    .filter((tros) => tros.length > 0)
    .join('/');
}

/**
 * Passa `DD/MM/AAAA` a `AAAA-MM-DD`, o `null` si la data no existeix.
 *
 * No n'hi ha prou amb comprovar la forma amb una expressió regular: el 31/02
 * la passa i no és cap dia. Per això es construeix la data i es mira que el
 * resultat sigui el que s'ha demanat —si no ho és, el constructor l'ha desplaçada
 * al mes següent i vol dir que el dia no existia.
 *
 * Es treballa en UTC a posta: amb l'hora local, un naixement de matinada podria
 * saltar de dia segons on sigui qui ho escriu.
 */
export function dataISO(text: string): string | null {
  const trobat = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!trobat) return null;

  const [, dia, mes, any] = trobat;
  const data = new Date(Date.UTC(Number(any), Number(mes) - 1, Number(dia)));

  if (
    data.getUTCFullYear() !== Number(any)
    || data.getUTCMonth() !== Number(mes) - 1
    || data.getUTCDate() !== Number(dia)
  ) {
    return null;
  }

  return `${any}-${mes}-${dia}`;
}

/** Passa `AAAA-MM-DD` a `DD/MM/AAAA`, per omplir un camp amb una data ja desada. */
export function dataEscrita(iso: string): string {
  const trobat = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return trobat ? `${trobat[3]}/${trobat[2]}/${trobat[1]}` : '';
}

/**
 * El dia d'avui en ISO, a partir d'una marca de temps.
 *
 * Rep el moment en comptes de mirar el rellotge perquè qui la crida ho fa durant
 * el dibuix del component, i llegir-hi l'hora el faria impur: dos dibuixos amb
 * les mateixes dades podrien donar resultats diferents.
 */
export function avuiISO(ara: number): string {
  return new Date(ara).toISOString().slice(0, 10);
}
