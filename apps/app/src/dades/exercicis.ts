// GENERAT AUTOMÀTICAMENT des de docs/exercicis — no editar a mà.
// Torna a generar-ho amb: npm run exercicis:genera

import type { BlocInfo, Exercise } from '@vincle/shared-types';

/** Noms i descripcions dels cinc blocs del catàleg. */
export const BLOCS_CATALEG: readonly { bloc: number; nom: string; descripcio: string }[] = [
  { bloc: 1, nom: "Base", descripcio: "<!-- Descripció del bloc 1 -->" },
];

/** Catàleg curat d'exercicis. Contingut de referència: l'app no en crea de nous.
 *  Escrit per la responsable del projecte com a part del marc pràctic del TR. */
export const EXERCICIS: readonly Exercise[] = [
  {
    id: "e1-1",
    bloc: 1,
    ordre: 1,
    nom: "Clicker",
    explicacio: "«Carregar el clicker» és una activitat senzilla. Activarem el clicker i\nimmediatament després li donarem al nostre gos un premi que li agradi. Així\nsuccessivament fins que entengui que el «clic» va associat amb el menjar.",
    nota: "El clicker pot ser substituït per paraules (com ara «Bé!»), carícies o jocs.",
    recomanacio: { sessionsMin: 3, sessionsMax: 4, frequencia: "diaria", dies: 6, minutsPerSessio: null },
    milestoneIds: [],
  },
];

/** Els exercicis d'un bloc, en ordre. */
export function exercicisDelBloc(bloc: number): readonly Exercise[] {
  return EXERCICIS.filter((e) => e.bloc === bloc);
}

export type { BlocInfo };
