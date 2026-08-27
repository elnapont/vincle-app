# Handoff: Vincle — app web i mòbil (v1)

## Visió general

Vincle és una aplicació web i mòbil per a l'ensinistrament de gossos d'assistència, feta com a
part pràctica d'un treball de recerca de batxillerat. Té dues funcions:

1. **Explorador de races + matching per trastorn.** L'usuari tria un trastorn (dels 7 de
   §5.0 del CLAUDE.md), l'app deriva els eixos de temperament del camp `temperament` de The
   Dog API mitjançant el diccionari de traducció, aplica els pesos del perfil del trastorn i
   retorna un **rànquing de compatibilitat amb percentatge i explicació**.
2. **Guia + seguiment d'ensinistrament.** Bucle *consultar l'exercici → practicar-lo →
   registrar-lo*: catàleg curat d'exercicis amb passos de reforç positiu, sessions, fites i
   gràfics d'evolució.

Tota la interfície és **en català**. El rol dissenyat a v1 és el d'**entrenador/a**. La vista
de **família d'acollida queda fora d'abast** (decisió de producte, encara oberta).

## Sobre els fitxers de disseny

El fitxer `Vincle.dc.html` d'aquest paquet és una **referència de disseny feta en HTML**: un
prototip que mostra l'aspecte i el comportament previstos, **no** codi de producció per
copiar. La feina és **recrear aquestes pantalles dins l'entorn del projecte** — Expo (React
Native) amb TypeScript, Supabase i Zod, tal com fixa el CLAUDE.md — fent servir els patrons i
components propis d'aquell entorn.

El fitxer és un llenç: cada `<section class="dv-turn">` és una ronda de disseny i cada
`.dv-opt` una opció amb identificador estable (`1a`, `2c`, `6b`…). Referencia sempre les
pantalles per aquest identificador.

## Fidelitat

**Alta (hi-fi).** Colors, tipografies, espaiats i jerarquia són definitius. Recrea la UI amb
precisió. El que **no** és definitiu i s'ha de tractar com a dada d'exemple: noms de gossos,
percentatges de compatibilitat, valors dels eixos, textos dels exercicis i dates.

Les imatges són **marcadors de posició** (fons de ratlles diagonals `#e6ddd2`/`#dcd1c3`). Van
substituïdes per la foto de raça de The Dog API o per la foto del gos pujada per l'entrenadora.

---

## Design tokens

### Colors

| Token | Hex | Ús |
|---|---|---|
| `granat` | `#661414` | Color primari: botons principals, xifres destacades, panells de marca, logotip |
| `granat-fosc` | `#4a0f0f` | Text sobre fons sorra |
| `vermell` | `#a21a1a` | Acció secundària i estat actiu de la navegació, errors, alertes, enllaços |
| `sorra` | `#c2ad9a` | Fons càlid, avatars, botons sobre fons granat, sèries secundàries de gràfics |
| `oliva` | `#608028` | Èxit, fites assolides, resultat destacat del rànquing, franja del pas en curs |
| `oliva-fosc` | `#4c6620` | Text sobre fons oliva translúcid |
| `tinta` | `#241a16` | Text principal |
| `paper` | `#fdfbf8` | Fons de pantalla |
| `blanc` | `#ffffff` | Superfície de targeta i barra de navegació |
| `llenç` | `#efe9e1` | Fons del llenç de disseny (no forma part de l'app) |

Opacitats derivades de la tinta, usades sistemàticament:
`rgba(36,26,22,.6)` text secundari · `.5` etiquetes · `.45` metadades ·
`rgba(36,26,22,.1)` vores i pistes de barres · `.08`/`.07` separadors · `.06` fons de xip inactiu.

Fons translúcids de color: `rgba(96,128,40,.14)` xip d'èxit · `rgba(162,26,26,.12)` xip
d'alerta · `rgba(194,173,154,.35–.4)` xip neutre càlid.

### Tipografia

- **Instrument Serif** (regular 400) — títols de pantalla, xifres grans, percentatges, mètriques.
- **Instrument Sans** (400/500/600) — tot el text d'interfície.
- **JetBrains Mono** (400/500) — metadades, dates curtes, pesos, contadors, etiquetes de secció en majúscules.

Escala aplicada:

| Ús | Mida / pes / interlineat |
|---|---|
| Percentatge protagonista (mòbil `1b`) | Serif 128px / .82 |
| Percentatge de fitxa (web) | Serif 46px / 1 |
| Títol de pantalla web | Serif 34px / 1.1 |
| Títol de pantalla mòbil | Serif 29–30px / 1.15 |
| Mètrica de targeta | Serif 34px |
| Nom de raça / gos a llista | Sans 16–17px / 600 |
| Text de targeta | Sans 13.5–14px / 400 / 1.5 |
| Etiqueta de camp | Sans 12px / 500 |
| Encapçalament de secció | Sans 12px / 600 / majúscules / `letter-spacing:.08em` |
| Metadada mono | 11.5–12px / 400–500 |
| Navegació | Sans 13.5px / 500 (600 quan és activa) |

Mida mínima de text a mòbil: 11px (només etiquetes de la barra inferior). Cap element
tocable per sota de 44px d'alçada efectiva.

### Espaiat, radis i ombres

- Escala d'espaiat: 4 · 6 · 9 · 12 · 14 · 18 · 22 · 28 · 32 px. Sempre `gap` de flex/grid, mai marges entre germans.
- Radis: 999px xips i botons de píndola · 14px targetes de mòbil · 12px targetes i camps web · 10–11px botons · 8–9px botons petits i xips quadrats · 20–22px avatars grans.
- Vora estàndard de targeta: `1px solid rgba(36,26,22,.1)`; camp de formulari `1px solid rgba(36,26,22,.16)`; camp enfocat o amb error `1.5px solid #a21a1a`.
- **Franja lateral de 6px** (`border-left`) com a codi de rang o estat: oliva = millor resultat / pas en curs / exercici dominat; vermell = següents resultats, alertes i incidències; `rgba(36,26,22,.15)` = element no iniciat.
- Ombres: cap dins l'app. El llenç n'aplica una només per separar les targetes de presentació.

### Barres de progrés

Alçada 5px (mòbil, dins de targeta), 6px (eixos), 7–8px (progrés de fita). Pista
`rgba(36,26,22,.1)`, radi 3–4px, replè granat (valor del gos), oliva (èxit) o sorra
(sèrie secundària).

---

## Pantalles

Ordre d'implementació recomanat: `2a` → `5a` → `5b` → `2b` → `4a` → `2c` → `2d` → `6a` → `6b` → `2e` → `6c` → estats de `5c`.

### 2a · Entrada (mòbil i web)

Autenticació amb Supabase Auth (correu + contrasenya).

- **Mòbil**: fons `#661414` a tota la pantalla, contingut alineat a baix amb `padding:0 28px 40px`. Logotip 56px radi 16 sobre sorra; wordmark serif 46px blanc; subtítol 16px/1.5 blanc 72%. Camps de 52px, radi 12, fons `rgba(255,255,255,.1)`, vora `rgba(255,255,255,.22)`. Botó «Entra» 54px sobre sorra amb text `#4a0f0f`. Peu: «No tens compte? **Sol·licita accés**».
- **Web** (980×640): partició 44% / 56%. Panell esquerre granat amb el titular serif 40px «Cada gos té el seu ritme. Nosaltres el recordem.» i el peu mono `v0.6 · català`. Panell dret sobre `#fdfbf8`, `padding:56px 64px`, camps de 48px radi 10, casella «Mantén la sessió oberta», enllaç «He oblidat la contrasenya» en vermell, botó «Entra» 50px en vermell.

### 2b · Qüestionari de matching (mòbil, 2 passos visibles de 3)

**Punt de partida obligatori: el trastorn** (§5 del CLAUDE.md).

- Capçalera: fletxa enrere, barra de progrés de 4px, comptador mono `1/3`.
- **Pas 1** — els 7 trastorns com a targetes de radi 13: TEA, Depressió, Trastorns d'ansietat, Trastorn bipolar, TEPT, TOC, TDAH. Cada targeta duu una segona línia amb les tasques típiques. Seleccionada = fons vermell, text blanc. TOC i TDAH comparteixen fila.
- **Pas 2** — tasques com a xips de selecció múltiple (màx. 3): Ancoratge tàctil, Evitar fugues, Pressió profunda, Interrompre estereotípies, Rutines diàries, Cerca i localització, Companyia nocturna. Sota: entorn habitual (Casa / Escola / Transport, multiselecció, actiu en oliva) i un control lliscant de pes màxim amb valor mono en vermell.
- Botó inferior de 52px granat: «Continua» / «Veure compatibilitats».

### 1a / 1b / 3a · Rànquing de compatibilitat (mòbil) — tres direccions

Les tres mostren el mateix resultat: **percentatge gran + 3 eixos destacats + explicació**.

- `1a` — sobri: targetes blanques, dues primeres esteses amb tres barres curtes i frase explicativa; la resta com a fila compacta amb la puntuació en serif.
- `1b` — editorial: fons sorra, percentatge serif de 128px, targeta blanca amb els tres eixos i el **pes** de cadascun, i llista «A continuació» amb les següents races.
- `3a` — comparativa (**la triada**): fons clar, una targeta blanca per raça amb franja lateral de 6px, tres barres etiquetades i alineades entre targetes, i les races de cua com a fila d'una línia.

Ordena sempre de major a menor. La primera posició porta franja i xifra en oliva; la resta en vermell; les de cua en tinta al 50%.

### 4a · Compatibilitats (web, versió de 3a)

Tres columnes: barra de navegació (60px) + panell lateral de 270px + contingut.

- Panell lateral: selector de trastorn en xips (només un actiu), **pesos del perfil** amb barres i percentatge (TEA d'exemple: entrenabilitat 30%, calma 25%, orientació 20%, sociabilitat 15%, mida 10%), i filtres (pes màxim amb control lliscant, dos interruptors de 34×20).
- Contingut: eyebrow mono en oliva amb el perfil actiu, títol serif, comptador «24 races avaluades» i accions «Exporta» i «Compara les 3 primeres».
- Files de resultat: miniatura 64px, bloc de nom de 210px, tres barres etiquetades amb valor mono a la dreta i columna final de 120px amb el percentatge serif de 46px sobre «compatibilitat». Les races de cua s'aplanen a una fila amb el motiu de la penalització («penalitzada per mida (45 kg)»).

### 2c · Fitxa de raça (web)

Columna esquerra de 330px: imatge 250px i taula de dades de catàleg (grup, criat per, pes, alçada, esperança de vida). Columna dreta: títol serif 40px, xips de `temperament` en oliva translúcid (valors originals de l'API, en anglès), accions «Comparar» / «Afegir al seguiment»; targeta d'**eixos derivats** en graella de 2 columnes amb la marca `diccionari v0.3 · 6 termes`; i dues targetes al peu: «Com encaixa amb TEA» (percentatge oliva + posició al rànquing + explicació) i «A tenir en compte» amb la font (`font: description · The Dog API`).

### 2d · Fitxa de gos + evolució (web)

Capçalera: avatar 96px, nom serif 36px, xip d'estat, línia de metadades (raça · edat · família · trastorn), tres mètriques (sessions, hores, fites) i botó «Nova sessió».
Cos: gràfic de barres agrupades de 6 mesos amb tres sèries (obediència granat, socialització vermell, tasca específica sorra), selector de rang (3 mesos / 6 mesos / Tot) i llegenda. Barra lateral: «Darreres sessions» (data mono + títol + durada i valoració) i targeta granat d'incidència oberta.

### 2e · Registre de sessió i fites (mòbil)

- **Sessió**: capçalera modal (✕ / títol / «Desa»), cronòmetre granat amb «Pausa» i «Finalitza», llista d'exercicis amb valoració de 5 quadrats de 24px (oliva = assolit), selector «Com ha anat» de 4 opcions i camp de nota de 92px.
- **Fites**: progrés global (9 de 14), agrupació per categoria, tres estats — assolida (cercle oliva amb ✓ i data), en curs (vora vermella, barra de progrés i «7 de 10 assajos correctes»), no iniciada (cercle buit, text atenuat). Barra de pestanyes inferior: Inici · Gossos · Races · Perfil.

### 5a · Panell d'inici (web)

Salutació amb data mono, quatre mètriques (gossos en seguiment, sessions de la setmana, fites del mes en oliva, incidències obertes en vermell), «Agenda d'avui» amb hora mono, avatar, títol i acció «Comença» a la sessió imminent, i barra lateral amb «Necessita atenció» (punt vermell = urgent, sorra = avís) i una crida al qüestionari de compatibilitat.

### 5b · Llista de gossos (web i mòbil)

Cerca, xips de filtre amb comptador i taula amb columnes: avatar · gos (nom + raça + edat) · estat · fites (barra + `9/14` mono) · darrera sessió · acció «Obre». Els retards es marquen posant la darrera sessió en vermell. Estats: En ensinistrament (oliva), En avaluació (sorra), Assignat (granat). A mòbil, la mateixa informació com a targetes de 14px de radi amb la barra de progrés a sota.

### 5c · Estats

- **Càrrega**: esquelets amb els mateixos radis i alçades que el contingut real, opacitat decreixent per fila, peu «Calculant la compatibilitat…».
- **Llista buida**: marcador de 76px, titular serif 21px, explicació i una sola acció primària.
- **Error de l'API de races**: banda vermella amb franja lateral, missatge «No hem pogut actualitzar el catàleg», marca temporal de la còpia en cache, dues accions («Torna-ho a provar» / «Continua amb la còpia») i el contingut cachejat a sota al 55% d'opacitat. Mai una pantalla d'error buida: el proxy sempre ha de poder servir l'última còpia.
- **Validació**: etiqueta i vora del camp en vermell, missatge sota el camp («La data no pot ser al futur.»), botó de desar desactivat a `rgba(102,20,20,.35)`.

### 6a · Catàleg d'exercicis (web)

Panell lateral amb categories i comptadors (Obediència bàsica, Socialització, Tasca específica, Maneig i cures), dificultat en xips (Inicial oliva / Intermèdia sorra / Avançada vermell) i una nota fixa: el catàleg és de referència i està revisat. Graella de 2 columnes de targetes: nom, xip de dificultat, objectiu en dues línies i peu mono amb `N passos · fita «…»`.

### 6b · Fitxa d'exercici i sessió guiada (mòbil)

- **Fitxa**: categoria mono, títol serif, xips (dificultat, nombre de passos, durada), targeta d'**objectiu** amb franja oliva, llista de **passos numerats** (cercle granat de 24px, títol i descripció de reforç positiu; els passos no assolits al 50% d'opacitat), targeta de **criteri d'assoliment** i botó «Practica-ho amb la Fura».
- **Sessió guiada**: cronòmetre compacte, targeta «Pas en curs» amb franja oliva i navegació «Pas anterior / Pas següent», comptadors de repeticions correctes i intents totals amb botons de ±32px, i avís en oliva translúcid que relaciona el resultat amb el criteri de la fita.

### 6c · Fita amb els seus exercicis

Tanca el bucle guia↔seguiment: capçalera de la fita amb percentatge i assajos, barra de progrés, columna d'**exercicis que la componen** (dominat / en curs amb barra i botó «Practica» / no iniciat amb «Obre la guia») i columna d'**historial** més el criteri de tancament.

---

## Interaccions i comportament

- **Navegació web**: pestanya activa en vermell amb subratllat de 2px enganxat a la vora inferior de la barra. Mòbil: barra de pestanyes de 4 elements amb l'actiu en vermell.
- **Flux de matching**: trastorn → tasques i entorn → rànquing → fitxa de raça → «Afegir al seguiment» (crea un `Dog`).
- **Flux de tracking**: gos → fita → exercici → sessió guiada → desar → el progrés de la fita i els gràfics s'actualitzen.
- **Estats interactius** (a definir amb el mateix vocabulari): hover a fila de taula = fons `rgba(36,26,22,.03)`; hover a botó primari = granat un 8% més fosc; focus = vora `1.5px #a21a1a` amb halo `rgba(162,26,26,.15)`; premut = escala 0.98.
- **Transicions**: 150–200 ms `ease-out` per a canvis de color i opacitat; les barres de progrés animen l'amplada en 400 ms `ease-out` en carregar el resultat. Res més: sense animacions decoratives.
- **Càrrega**: esquelet, mai spinner centrat.
- **Validació**: en enviar i en sortir del camp (`onBlur`), amb Zod compartit entre client i servidor.
- **Responsivitat**: les pantalles web es dissenyen a 1180px de contingut. Per sota de 900px, el panell lateral passa a sobre del contingut; per sota de 640px, es fa servir la variant mòbil.

## Estat i dades

Per pantalla, les dades que necessita:

| Pantalla | Entitats i camps |
|---|---|
| `2b` | `MatchProfile.disorder` (enum de 7), `tasks[]`, `environments[]`, `maxWeightKg` |
| `4a` / `1a` / `3a` | `MatchResult[]`: `breedId`, `score` (0–100), `axes[]` (nom, valor 0–10, pes), `explanation`, `penalties[]` |
| `2c` | `Breed`: `name`, `breedGroup`, `bredFor`, `weight`, `height`, `lifeSpan`, `temperament[]`, `description`, `imageUrl`, `derivedAxes[]`, `dictionaryVersion` |
| `5b` | `Dog[]`: `name`, `breedRef`, `birthDate`, `status`, `milestonesDone/total`, `lastSessionAt` |
| `2d` | `Dog` + `TrainingSession[]` + sèrie agregada per habilitat i mes + `Incident[]` |
| `2e` | `TrainingSession`: `dogId`, `exerciseId`, `durationSec`, `rating`, `note`, `perExerciseScore` |
| `6a` / `6b` | `Exercise`: `name`, `category`, `difficulty`, `goal`, `steps[]` (títol + descripció), `successCriterion`, `estimatedMinutes`, `milestoneIds[]`, `sourceRef` |
| `6c` | `Milestone`: `name`, `category`, `status`, `progress`, `exerciseIds[]`, `history[]`, `closingCriterion` |

Estat local rellevant: pas actiu del qüestionari, seleccions múltiples amb límit de 3,
cronòmetre en marxa/pausa amb persistència si es tanca l'app, pas actiu de la sessió guiada,
comptadors de repeticions, filtres de llista (persistents entre navegacions).

El client **no** crida mai The Dog API: tot passa per la capa d'API pròpia, que normalitza a
`Breed` i cacheja. Si la crida externa falla, es respon amb la còpia cachejada i la seva data
(això és el que dibuixa l'estat d'error de `5c`).

## Contingut i to

Català, tracte proper i directe, sense tecnicismes innecessaris ni emojis. Les etiquetes en
majúscules van en mono. Els termes de `temperament` es mostren **tal com arriben de l'API**
(en anglès) i no es tradueixen; el que sí que està en català són els eixos derivats.

Els textos dels exercicis del prototip són **exemples il·lustratius**. El contingut real l'ha
de curar i validar una persona a partir de fonts fiables (§6.1 del CLAUDE.md) i la font s'ha
de documentar; no s'ha de publicar contingut d'ensinistrament sense revisió humana.

## Pendents que bloquegen la implementació

Estan al §9 del CLAUDE.md i el disseny no els pot suplir:

1. Diccionari de traducció `temperament` → eixos (alimenta 2c, 4a i tot el rànquing).
2. Perfil de pesos per a cadascun dels 7 trastorns (el panell lateral de 4a els mostra).
3. Catàleg d'exercicis curat i validat (6a, 6b, 6c).
4. Llista de fites predefinides i la seva associació amb exercicis (2e, 6c).

Fins que no existeixin, implementa contra dades de prova amb la mateixa forma i deixa la
càrrega aïllada darrere d'un mòdul de dades de referència.

## Assets

Cap asset binari. Les imatges són marcadors de posició de ratlles diagonals; substituïu-les
per `Breed.imageUrl` de The Dog API o per la foto del gos desada a Supabase Storage. Les
tipografies vénen de Google Fonts (Instrument Serif, Instrument Sans, JetBrains Mono). No hi
ha icones dibuixades: els punts de la barra de pestanyes i els indicadors són formes
geomètriques que cal substituir per la llibreria d'icones que trieu.

## Fitxers

- `Vincle.dc.html` — totes les pantalles, agrupades per rondes de disseny.
- `support.js` — temps d'execució del prototip. **No** el porteu al projecte.

Obriu `Vincle.dc.html` en un navegador per veure els dissenys a mida real.

## Mantenir el paquet al dia

Aquest paquet és una còpia del disseny en un moment donat. Quan el disseny canviï, s'ha de
regenerar: es torna a copiar `Vincle.dc.html`, s'actualitza la secció corresponent d'aquest
README i s'afegeix una línia al registre de sota. Digues quins canvis s'han fet i es
regenerarà el paquet sencer.

### Registre de versions del paquet

- **h1 — 8 d'agost de 2026.** Primer paquet. Inclou les rondes 1 a 6: tres direccions de
  rànquing (`1a`, `1b`, `1c`), la triada amb fons clar (`3a`) i la seva versió web (`4a`), el flux
  d'entrenadora (`2a`–`2e`), panell d'inici, llista de gossos i estats (`5a`–`5c`), i la guia
  d'exercicis (`6a`–`6c`). Vista de família d'acollida exclosa per decisió de producte.
