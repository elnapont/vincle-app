/**
 * El que encara no té taula.
 *
 * Els gossos ja són **dades reals** de Supabase. El que queda aquí és l'agenda i
 * els avisos, que depenen de sessions i incidències, i aquestes taules encara no
 * existeixen. Quan hi siguin, aquest fitxer desapareix.
 *
 * Es manté aïllat a posta perquè es vegi d'un cop d'ull què és real i què no: si
 * aquestes dades estiguessin escampades per les pantalles, ningú no sabria dir
 * quina part del panell d'inici s'ha de creure.
 */

import type { Dog } from '@vincle/shared-types';

/** Cites d'avui, amb l'hora en format de 24 h. */
export const AGENDA_AVUI: { hora: string; titol: string }[] = [
  { hora: '09:30', titol: 'Ancoratge tàctil · sessió guiada' },
  { hora: '11:00', titol: "Socialització a l'estació" },
  { hora: '16:15', titol: 'Avaluació inicial de temperament' },
];

/** Coses que reclamen atenció, ordenades per urgència. */
export const ATENCIO: { motiu: string; urgent: boolean }[] = [
  { motiu: 'Sense sessió des de fa 12 dies', urgent: true },
  { motiu: 'Incidència de comportament oberta', urgent: true },
  { motiu: 'Avaluació pendent de tancar', urgent: false },
];

/**
 * Mètriques del panell. `gossosEnSeguiment` ja no és aquí: es compta dels gossos
 * reals. Les altres tres esperen les seves taules.
 */
export const METRIQUES = {
  sessionsSetmana: 12,
  fitesDelMes: 4,
  incidenciesObertes: ATENCIO.filter((a) => a.urgent).length,
};

// ---------------------------------------------------------------------------
// Càlculs sobre dades reals
// ---------------------------------------------------------------------------

/** Edat en anys i mesos, com l'ensenya la llista de gossos. */
export function edat(dataNaixement: Dog['dataNaixement']): string {
  const naixement = new Date(dataNaixement);
  const ara = new Date();
  const mesos = (ara.getFullYear() - naixement.getFullYear()) * 12
    + (ara.getMonth() - naixement.getMonth());
  const anys = Math.floor(mesos / 12);
  const resta = mesos % 12;

  if (anys === 0) return `${resta} ${resta === 1 ? 'mes' : 'mesos'}`;
  if (resta === 0) return anys === 1 ? '1 any' : `${anys} anys`;
  return `${anys} ${anys === 1 ? 'any' : 'anys'} i ${resta} mesos`;
}
