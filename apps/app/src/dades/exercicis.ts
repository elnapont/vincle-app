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
    recomanacio: { tipus: "pauta", sessionsMin: 3, sessionsMax: 4, frequencia: "diaria", dies: 6, minutsPerSessio: null },
    milestoneIds: [],
  },
  {
    id: "e1-2",
    bloc: 1,
    ordre: 2,
    nom: "No mossegar",
    explicacio: "Important practicar-ho abans dels 4 o 5 mesos d’edat. \nQuan juguem a mossegar, el cadell encara no sabrà regular la força de les seves dents, i podem aprofitar-ho per ensenyar-li. \n\nSi mossega i fa mal, diem “No” immediatament, i després obrirem amb compte la seva boca amb l’altra mà i pararem el joc durant uns segons. Així el cadell entendrà que no t’ha agradat i que mossegar així para el joc, cosa que ell no voldrà, i mirarà de regular-se.\n\nNota: Recorda d’obrir-li la boca al cadell, estirant la mà et podria esgarrapar.",
    nota: "IMPORTANT! Per molt que ens faci mal, MAI castigar físicament el gos!",
    recomanacio: { tipus: "lliure", text: "No es recomana cap nombre concret de sessions, aquesta mesura es va aprenent fins que el cadell canvia les dents" },
    milestoneIds: [],
  },
  {
    id: "e1-3",
    bloc: 1,
    ordre: 3,
    nom: "Socialitzar",
    explicacio: "Hem d’acostumar el cadell als llocs que freqüentarà quan sigui gran. A partir dels quatre mesos, els gossos solen tornar-se més cautelosos i reben negativament els llocs nous. \n\nUn gos preparat per intervencions hauria d’estar acostumat a aquests llocs:\n- Parc (nens i altres gossos)\n- Cotxe\n- Ciutat\n- Persones amb bastó\n- Boscos\n- Ascensors\n- Transport públic\n- Platja\n- Veus altes\n- Bicicletes\n- Hospital\n- Crosses\n- Cadires de rodes\n- Escoles\n- Comportament inesperat",
    nota: "És important mantenir-ho al llarg de la vida, per què el gos adult no oblidi els llocs que va visitar de petit.",
    recomanacio: { tipus: "pauta", sessionsMin: 1, sessionsMax: 1, frequencia: "diaria", dies: null, minutsPerSessio: null },
    milestoneIds: [],
  },
];

/** Els exercicis d'un bloc, en ordre. */
export function exercicisDelBloc(bloc: number): readonly Exercise[] {
  return EXERCICIS.filter((e) => e.bloc === bloc);
}

export type { BlocInfo };
