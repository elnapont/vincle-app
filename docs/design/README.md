# Handoff: Vincle — app web i mòbil (v2)

## Visió general

Vincle és una aplicació web i mòbil per a l'ensinistrament de gossos d'assistència, feta com a
part pràctica d'un treball de recerca de batxillerat. Té dues funcions:

1. **Explorador de races + matching per trastorn.** L'usuari tria un trastorn (dels **sis** de
   §5.0 del CLAUDE.md), l'app deriva els eixos de temperament del camp `temperament` de The
   Dog API mitjançant el diccionari de traducció, aplica els pesos del perfil del trastorn i
   retorna un **rànquing de compatibilitat amb percentatge, posició i explicació**.
2. **Guia + seguiment d'ensinistrament.** Bucle *consultar l'exercici → practicar-lo →
   registrar-lo*: catàleg curat d'exercicis amb passos de reforç positiu, sessions, fites i
   gràfics d'evolució.

Tota la interfície és **en català**, inclosos els termes de temperament. El rol dissenyat a v1
és el d'**entrenador/a**. La vista de **família d'acollida queda fora d'abast** (decisió de
producte, encara oberta).

## Sobre els fitxers de disseny

> **Les opcions substituïdes estan marcades dins del propi fitxer.** `1a`, `1b`, `2b`, `2c`,
> `3a` i `4a` es mostren atenuades (opacitat 0,42 i saturació reduïda) i porten al costat de
> l'identificador una etiqueta `SUBSTITUÏDA PER 7X` que enllaça amb la vigent. Es veuen a plena
> opacitat en passar-hi el ratolí o en obrir-ne l'enllaç. Així qui obre la maqueta al navegador
> sense llegir aquest README no les pren per vigents.

El fitxer `Vincle.dc.html` d'aquest paquet és una **referència de disseny feta en HTML**: un
prototip que mostra l'aspecte i el comportament previstos, **no** codi de producció per
copiar. La feina és **recrear aquestes pantalles dins l'entorn del projecte** — Expo (React
Native) amb TypeScript, Supabase i Zod, tal com fixa el CLAUDE.md — fent servir els patrons i
components propis d'aquell entorn.

El fitxer és un llenç: cada `<section class="dv-turn">` és una ronda de disseny i cada
`.dv-opt` una opció amb identificador estable (`1a`, `2c`, `7b`…). Referencia sempre les
pantalles per aquest identificador.

> **Quines pantalles són vigents.** El torn 7 substitueix les pantalles de matching del torn
> anterior: implementa **`7a`, `7b`, `7c`, `7d` i `7e`**, i tracta `1a`, `1b`, `2b`, `2c`, `3a`
> i `4a` com a **historial**. Les pantalles de tracking (`2a`, `2d`, `2e`, `5a`, `5b`, `5c`,
> `6a`, `6b`, `6c`) segueixen vigents sense canvis.

## Fidelitat

**Alta (hi-fi).** Colors, tipografies, espaiats i jerarquia són definitius. Recrea la UI amb
precisió.

Els **valors numèrics del torn 7 són reals** (perfil de pesos del TEA, rànquing del TEA i fitxa
del golden retriever), no exemples: mantén-los. Les dades d'exemple que continuen sent
il·lustratives són les de tracking: noms de gossos, dates, textos d'exercicis i valoracions de
sessió.

Les imatges són **marcadors de posició** (fons de ratlles diagonals `#e6ddd2`/`#dcd1c3`). Van
substituïdes per la foto de raça de The Dog API o per la foto del gos pujada per l'entrenadora.

---

## Design tokens

### Colors

| Token | Hex | Ús |
|---|---|---|
| `granat` | `#661414` | Color primari: botons principals, xifres destacades, panells de marca, logotip |
| `granat-fosc` | `#4a0f0f` | Text sobre fons sorra |
| `vermell` | `#a21a1a` | Acció secundària i estat actiu de la navegació, errors, alertes, enllaços, marcador d'eix invertit |
| `sorra` | `#c2ad9a` | Fons càlid, avatars, botons sobre fons granat, sèries secundàries de gràfics, replè d'eix invertit, replè del mesurador de recorregut |
| `oliva` | `#608028` | Èxit, fites assolides, primer resultat del rànquing, franja del pas en curs, marca de pes fix |
| `oliva-fosc` | `#4c6620` | Text sobre fons oliva translúcid |
| `tinta` | `#241a16` | Text principal |
| `paper` | `#fdfbf8` | Fons de pantalla |
| `blanc` | `#ffffff` | Superfície de targeta i barra de navegació |
| `llenç` | `#efe9e1` | Fons del llenç de disseny (no forma part de l'app) |

Opacitats derivades de la tinta, usades sistemàticament:
`rgba(36,26,22,.6)` text secundari · `.5` etiquetes · `.45` metadades i **text d'eix sense
dades** · `.4` **guionet d'eix sense dades** · `rgba(36,26,22,.25)` **contorn d'eix sense
dades** · `rgba(36,26,22,.15)` franja lateral d'absència · `rgba(36,26,22,.1)` vores i pistes
de barres · `.09` pista d'eix · `.08`/`.07` separadors · `.06` fons de xip inactiu.

Fons translúcids de color: `rgba(96,128,40,.14)` xip d'èxit · `rgba(162,26,26,.12)` xip
d'alerta · `rgba(194,173,154,.35–.4)` xip neutre càlid.

### Tipografia

- **Instrument Serif** (regular 400) — títols de pantalla, xifres grans, percentatges, mètriques.
- **Instrument Sans** (400/500/600) — tot el text d'interfície.
- **JetBrains Mono** (400/500) — metadades, dates curtes, pesos, contadors, posicions del rànquing, etiquetes de secció en majúscules.

Escala aplicada:

| Ús | Mida / pes / interlineat |
|---|---|
| Percentatge protagonista (mòbil `7d`) | Serif 88px / .9, amb el decimal a 40px |
| Percentatge de fitxa i de fila (web) | Serif 40px / 1 |
| Títol de pantalla web | Serif 34px / 1.1 |
| Títol de pantalla mòbil | Serif 29–30px / 1.15 |
| Mètrica de targeta | Serif 34px |
| Nom de raça / gos a llista | Sans 16–17px / 600 |
| Text de targeta | Sans 13.5–14px / 400 / 1.5 |
| Etiqueta de camp | Sans 12px / 500 |
| Encapçalament de secció | Sans 12px / 600 / majúscules / `letter-spacing:.08em` |
| Metadada mono | 10–12px / 400–500 |
| Navegació | Sans 13.5px / 500 (600 quan és activa) |

> **Canvi respecte a h1.** El percentatge protagonista del rànquing mòbil baixa de **128px a
> 88px** i deixa lloc, a la mateixa línia, a la posició (`#1 de 631`) i al mesurador de
> recorregut. És l'única desviació de l'escala de h1 i és conseqüència directa del bloc C: a
> 128px, un 75,1 % es llegia com un veredicte.

Mida mínima de text a mòbil: 10px (només etiquetes mono d'escala dins de barres) i 11px a la
barra inferior. Cap element tocable per sota de 44px d'alçada efectiva.

### Espaiat, radis i ombres

- Escala d'espaiat: 4 · 6 · 9 · 12 · 14 · 18 · 22 · 28 · 32 px. Sempre `gap` de flex/grid, mai marges entre germans.
- Radis: 999px xips i botons de píndola · 14px targetes de mòbil · 12px targetes i camps web · 10–11px botons · 8–9px botons petits i xips quadrats · 20–22px avatars grans.
- Vora estàndard de targeta: `1px solid rgba(36,26,22,.1)`; camp de formulari `1px solid rgba(36,26,22,.16)`; camp enfocat o amb error `1.5px solid #a21a1a`.
- **Franja lateral de 6px** (`border-left`) com a codi de rang o estat: oliva = millor resultat / pas en curs / exercici dominat; vermell = següents resultats, alertes, incidències i el bloc de filtre; `rgba(36,26,22,.15)` = element no iniciat, **advertiment metodològic** o **bloc de descartades**.
- Ombres: cap dins l'app. El llenç n'aplica una només per separar les targetes de presentació.

### Barres de progrés i barres d'eix

Alçada 5px (mòbil, dins de targeta), 6px (eixos i mesurador), 7px (eixos a la fitxa de raça),
8px (progrés de fita). Pista `rgba(36,26,22,.09–.1)`, radi 3–4px, replè granat (valor de l'eix),
oliva (èxit o primer resultat), sorra (sèrie secundària, eix invertit i mesurador de recorregut).

### Patró «sense dades» (obligatori a totes les barres d'eix)

Un eix pot valer 5 perquè s'ha mesurat o perquè **cap terme de la raça hi cau** i el model hi
posa el neutre. Els dos casos **no es dibuixen igual**. Especificació completa a `7a`.

| | Valor derivat | Sense dades |
|---|---|---|
| Pista | `rgba(36,26,22,.09)` plena | transparent |
| Contorn | cap | `1px solid rgba(36,26,22,.25)` |
| Replè | granat (o oliva/sorra segons context) | **cap** |
| Nom de l'eix | color de text normal | `rgba(36,26,22,.45)` |
| Xifra | `8,5` en mono granat | **`—`** en mono `rgba(36,26,22,.4)` |
| Etiqueta extra | — | `SENSE DADES` en mono 10.5px, si hi ha espai |

**El comptador va sobre els vuit eixos, no sobre els visibles.** Les files de resultat i el
rànquing només ensenyen els tres eixos que més pesen, però `unknownAxisCount` es refereix als
vuit. Format: `N DE 8 EIXOS SENSE DADES`. Quan l'eix que falta **no és a la vista**, es diu pel
nom (`1 DE 8 EIXOS SENSE DADES: ALERTA`) i, si hi ha espai, s'hi afegeix una línia `8è EIX` que
ho explica — el cas del Bohemian Shepherd a `7c` i `7d`, que té els tres eixos visibles mesurats
i l'absència en un quart que no es mostra. Sense això, un usuari pot veure tres barres plenes i
un comptador que diu «1 sense dades» i no entendre a què es refereix.

**Reproducció a React Native:** una `View` amb `borderWidth: 1`,
`borderColor: 'rgba(36,26,22,.25)'`, `backgroundColor: 'transparent'` i el mateix
`borderRadius` i `height` que la pista normal, i sense `View` filla de replè. **No** es fa
servir `borderStyle: 'dashed'` (a Android no es dibuixa bé combinat amb `borderRadius`) ni
degradats repetits. El guionet és un `<Text>`, no una forma.

**Tres nivells de detall segons l'espai:** files de resultat i rànquing → contorn + guionet;
targeta d'eixos de `7b` → s'hi afegeix l'etiqueta `SENSE DADES`; targeta «A tenir en compte» →
es diu amb paraules i es compten («De vuit valors, tres no els podem derivar…»).

### Eixos on interessa un valor baix

Quan el perfil del trastorn assigna direcció `resta` a un eix (al TEA, **`Alerta`**), el replè
va en **sorra** en comptes de granat i el nom porta el marcador mono `↓ MILLOR SI ÉS BAIX`
(`↓ BAIX` a la llista de pesos, on l'espai és just). Sense això, una barra curta sembla un
defecte quan és una virtut.

---

## Pantalles

Ordre d'implementació recomanat: `2a` → `5a` → `5b` → `7e` → `7c` → `7b` → `2d` → `6a` → `6b`
→ `2e` → `6c` → `7d` → estats de `5c`.

### 2a · Entrada (mòbil i web)

Autenticació amb Supabase Auth (correu + contrasenya).

- **Mòbil**: fons `#661414` a tota la pantalla, contingut alineat a baix amb `padding:0 28px 40px`. Logotip 56px radi 16 sobre sorra; wordmark serif 46px blanc; subtítol 16px/1.5 blanc 72%. Camps de 52px, radi 12, fons `rgba(255,255,255,.1)`, vora `rgba(255,255,255,.22)`. Botó «Entra» 54px sobre sorra amb text `#4a0f0f`. Peu: «No tens compte? **Sol·licita accés**».
- **Web** (980×640): partició 44% / 56%. Panell esquerre granat amb el titular serif 40px «Cada gos té el seu ritme. Nosaltres el recordem.» i el peu mono `v0.6 · català`. Panell dret sobre `#fdfbf8`, `padding:56px 64px`, camps de 48px radi 10, casella «Mantén la sessió oberta», enllaç «He oblidat la contrasenya» en vermell, botó «Entra» 50px en vermell.

### 7e · Qüestionari de matching, pas 1 (mòbil) — sis trastorns

Substitueix `2b`. **Punt de partida obligatori: el trastorn** (§5.0 del CLAUDE.md).

- Capçalera: fletxa enrere, barra de progrés de 4px, comptador mono `1/3`.
- **Sis** targetes de radi 13 en una sola columna, cadascuna amb el nom i una segona línia amb les tasques típiques: TEA, Depressió, Trastorns d'ansietat, Trastorn bipolar, TEPT, TDAH. Seleccionada = fons vermell, text blanc. **El TOC ha sortit del projecte** (v0.15): no ha de sortir a l'enum de `MatchProfile.disorder`, ni a la plantilla de perfils, ni en aquesta pantalla, ni al selector de `7c`. La graella de dues columnes que compartien TOC i TDAH a h1 desapareix.
- **Pas 2** (sense canvis respecte a `2b`): tasques com a xips de selecció múltiple (màx. 3) — Ancoratge tàctil, Evitar fugues, Pressió profunda, Interrompre estereotípies, Rutines diàries, Cerca i localització, Companyia nocturna; entorn habitual (Casa / Escola / Transport, multiselecció, actiu en oliva); i control lliscant de pes màxim amb valor mono en vermell.
- Botó inferior de 52px granat: «Continua» / «Veure compatibilitats».

### 7d · Rànquing de compatibilitat (mòbil) — dues variants

Substitueix `1a`, `1b` i `3a`. Les dues variants mostren el mateix resultat: **percentatge +
posició + tres eixos destacats + microcopy de lectura**.

- **Variant llista** (base de `3a`, la triada): fons clar, **tres** targetes blanques (una per raça) amb franja lateral de 6px i tres barres etiquetades i alineades entre targetes; la primera duu el **mesurador de recorregut** sota el nom, i tanca la pantalla la targeta de lectura. A 844px hi caben tres resultats desplegats: la cua es consulta a `7c` (web), on hi ha espai per a les files d'una línia i el bloc de descartades.
- **Variant editorial** (base de `1b`): fons sorra, percentatge serif de 88px amb el decimal a 40px, posició al costat, mesurador de recorregut a sota, targeta blanca amb els tres eixos i el **pes** de cadascun més la línia `8è EIX` que nomena l'eix absent, i llista «A continuació» amb dos resultats.

**Mesurador de recorregut (nou).** El rànquing real va de **41 % a 80 %** amb mitjana 61 %: cap
raça del catàleg no arriba al 80 %. Una barra 0–100 fa que un 75 % sembli un veredicte. El
mesurador és una pista de 5–7px amb replè sorra fins a la posició relativa
`(puntuació − 41) / 39`, una marca vertical de 3px al valor exacte (oliva al primer resultat,
granat a la resta) i tres etiquetes mono a sota: `41%` · `MITJANA 61%` · `80%`.

**Microcopy obligatori.** A la variant llista, targeta amb franja `rgba(36,26,22,.15)`: «Cap
raça del catàleg no passa del 80 %: la llista diu per on començar a mirar, no quina raça triar.» A la variant editorial, peu abans del botó: «La diferència entre el primer i el
cinquè és d'1,2 punts: tracta'ls com un grup, no com un ordre.» Aquests textos no són decoratius
— són el que evita que el disseny prometi més precisió de la que el model té.

**Ordre i color.** De major a menor. Primera posició amb franja i xifra en oliva; següents en
vermell; cua en tinta al 50–60 %. La posició sempre en mono (`#1 DE 631`), i el recompte
d'eixos sense dades a la línia de metadades (`1 EIX SENSE DADES`).

### 7b · Fitxa de raça (web) — vuit valors

Substitueix `2c`. Columna esquerra de 330px: imatge 250px i taula de catàleg (grup, **pes mitjà
adult**, esperança de vida, alçada). Columna dreta:

- Títol serif 40px i xips de temperament **en català** — `amigable`, `intel·ligent`, `entregat`, `segur de si mateix`, `lleial`, `disposat a complaure` (revoca la instrucció de h1 de mostrar-los en anglès; §5.2.1). La traducció viu a `docs/diccionari/traduccions-ca.csv` i és editable sense tocar components.
- Targeta **«Eixos derivats del temperament, mida i longevitat»**: graella de 2 columnes amb **vuit valors** — `Entrenabilitat`, `Sociabilitat`, `Tolerància a entorns`, `Orientació a la persona`, `Longevitat`, `Energia`, `Calma`, `Alerta`. Els eixos `Reactivitat` i `Manteniment` **s'han retirat** (cap terme del vocabulari hi cau; §5.2.2) i no han d'aparèixer enlloc. `Longevitat` porta la dada en brut com a etiqueta mono (`11 ANYS`). Marca del diccionari: `diccionari v1.0 · 6 de 49 termes · 3 eixos sense dades`.
- Targeta **«Com encaixa amb TEA»**: percentatge serif 40px, posició en mono (`#67 DE 631`), mesurador de recorregut i explicació en prosa.
- Targeta **«A tenir en compte»** amb franja `rgba(36,26,22,.15)`: diu amb paraules quants eixos no es poden derivar i quins, i que la puntuació és orientativa.

Dades reals de la maqueta (golden retriever, recomanades pel brief perquè obliguen a resoldre
el patró «sense dades»): grup Sporting, 30 kg, 11 anys, compatibilitat amb TEA **68,7 %**,
posició **#67 de 631**; entrenabilitat 8,5 · sociabilitat 9,0 · tolerància a entorns 9,0 ·
orientació a la persona 6,5 · longevitat 6,0 · energia, calma i alerta **sense dades**.

### 7c · Compatibilitats (web)

Substitueix `4a`. Tres columnes: barra de navegació (60px) + panell lateral de 270px + contingut.

Panell lateral, **tres blocs separats a posta**:

1. **Trastorn** — sis xips, només un actiu. Sense TOC.
2. **Pesos del perfil de TEA** — subtítol mono `7 EIXOS DE TEMPERAMENT · REESCALATS AL 90%` i els pesos reals: Sociabilitat 25 %, Orientació a la persona 20 %, Calma 15 %, Energia 12 %, Entrenabilitat 10 %, **Alerta 10 % amb marcador `↓ BAIX` i replè sorra**, Tolerància a entorns 8 %. Amplada de barra proporcional al pes màxim de la llista (25 % → 100 %). Sota un separador d'1px, **`Longevitat 10 %`** amb la marca mono `FIX` en oliva, replè oliva i la nota «Igual a tots els trastorns: no depèn del diagnòstic». `Mida 10 %` **desapareix** d'aquesta llista (§5.2.4).
3. **Filtre de pes màxim** — bloc a part, amb franja lateral vermella de 6px, encapçalament «Filtre, no un eix», subtítol mono `NO ENTRA A LA PUNTUACIÓ`, control lliscant amb escala real (`2 KG` · `MEDIANA 22` · `79 KG`) i la nota que depèn de l'entorn, no del trastorn. La separació visual respecte al bloc de pesos és un requisit, no una preferència: a h1 es llegien com una sola llista.

Contingut: eyebrow mono en oliva amb el perfil actiu, títol serif, comptador **«631 races
avaluades»** i accions «Exporta» i «Compara les 3 primeres».

Files de resultat: miniatura 64px, bloc de nom de 210px amb metadades (`22 kg · 13 anys · 1 eix
sense dades`), tres barres etiquetades amb valor mono a la dreta — **amb el patró «sense dades»
quan cal** — i columna final de 120px amb el percentatge serif de 40px i la posició en mono. Les
races de cua s'aplanen a una fila d'una línia.

**Bloc «Les que descartaríem amb més confiança»** (nou, al final de la llista): franja
`rgba(36,26,22,.15)`, etiqueta mono `LA CUA DEL RÀNQUING ÉS LA PART MÉS FIABLE`, la raça amb el
motiu del descart (`36 kg · penalitzada per mida · sociabilitat 2,0`) i una frase que explica
l'asimetria del model. Respon a la troballa de Bray et al. (2019) recollida al §5.2.3: els
instruments encerten el 85–92 % dels gossos que fracassaran i només el 62–72 % dels que
triomfaran, i el disseny ha de donar pes a la part fiable.

Rànquing real del TEA que fa servir la maqueta: Bohemian Shepherd 75,1 % · American Pit Bull
Terrier 75,0 % · Redbone Coonhound 74,2 % · Pointer 74,0 % · Brittanydoodle 73,9 % ··· Saarloos
Wolfdog 41,5 %.

Valors reals per eix de les tres primeres (els tres eixos que més pesen al perfil de TEA):

| Raça | Sociabilitat | Orientació | Calma | Eixos sense dades |
|---|---|---|---|---|
| Bohemian Shepherd | 6,0 | 7,0 | 9,0 | 1 de 8 — **Alerta**, que no es mostra |
| American Pit Bull Terrier | 8,0 | 7,0 | — | 2 de 8 |
| Redbone Coonhound | 8,5 | 7,0 | — | 3 de 8 |

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

> **Nota.** L'estat «sense dades» d'un eix **no** és un estat d'error ni de càrrega: és una dada
> vàlida i definitiva. No ha de fer servir cap dels tractaments de `5c`.

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
- **Flux de matching**: trastorn (6) → tasques i entorn → rànquing → fitxa de raça → «Afegir al seguiment» (crea un `Dog`).
- **Flux de tracking**: gos → fita → exercici → sessió guiada → desar → el progrés de la fita i els gràfics s'actualitzen.
- **Estats interactius**: hover a fila de taula = fons `rgba(36,26,22,.03)`; hover a botó primari = granat un 8% més fosc; focus = vora `1.5px #a21a1a` amb halo `rgba(162,26,26,.15)`; premut = escala 0.98.
- **Transicions**: 150–200 ms `ease-out` per a canvis de color i opacitat; les barres de progrés animen l'amplada en 400 ms `ease-out` en carregar el resultat. Les barres «sense dades» **no s'animen**: no hi ha res a créixer. Res més: sense animacions decoratives.
- **Càrrega**: esquelet, mai spinner centrat.
- **Validació**: en enviar i en sortir del camp (`onBlur`), amb Zod compartit entre client i servidor.
- **Responsivitat**: les pantalles web es dissenyen a 1180px de contingut. Per sota de 900px, el panell lateral passa a sobre del contingut (mantenint els tres blocs separats); per sota de 640px, es fa servir la variant mòbil.

## Estat i dades

Per pantalla, les dades que necessita:

| Pantalla | Entitats i camps |
|---|---|
| `7e` | `MatchProfile.disorder` (**enum de 6**), `tasks[]`, `environments[]`, `maxWeightKg` |
| `7c` / `7d` | `MatchResult[]`: `breedId`, `score` (0–100), `rank`, `totalRanked`, `axes[]` (nom, `value \| null`, `weight`, `direction`), `unknownAxisCount`, `explanation`, `penalties[]` |
| `7b` | `Breed`: `name`, `breedGroup`, `weightKg`, `height`, `lifeSpanYears`, `temperamentCa[]`, `imageUrl`, `derivedAxes[]` (8, amb `value \| null`), `dictionaryVersion`, `termsUsed`, `termsTotal` |
| `5b` | `Dog[]`: `name`, `breedRef`, `birthDate`, `status`, `milestonesDone/total`, `lastSessionAt` |
| `2d` | `Dog` + `TrainingSession[]` + sèrie agregada per habilitat i mes + `Incident[]` |
| `2e` | `TrainingSession`: `dogId`, `exerciseId`, `durationSec`, `rating`, `note`, `perExerciseScore` |
| `6a` / `6b` | `Exercise`: `name`, `category`, `difficulty`, `goal`, `steps[]` (títol + descripció), `successCriterion`, `estimatedMinutes`, `milestoneIds[]`, `sourceRef` |
| `6c` | `Milestone`: `name`, `category`, `status`, `progress`, `exerciseIds[]`, `history[]`, `closingCriterion` |

**Contracte clau del bloc B.** El valor d'un eix ha de viatjar com **`value: number | null`**,
no com un `5` indistinguible. El `null` és el que dispara el patró «sense dades» a la UI; el
motor, per calcular, hi fa servir el neutre 5 internament, però **no ha d'exposar-lo com si fos
una mesura**. Cada eix porta també `direction: 'suma' | 'resta'` (per pintar el replè en sorra i
el marcador `↓`) i cada resultat, `unknownAxisCount` per a la línia de metadades.

Estat local rellevant: pas actiu del qüestionari, seleccions múltiples amb límit de 3,
cronòmetre en marxa/pausa amb persistència si es tanca l'app, pas actiu de la sessió guiada,
comptadors de repeticions, filtres de llista (persistents entre navegacions).

El client **no** crida mai The Dog API: tot passa per la capa d'API pròpia, que normalitza a
`Breed`, tradueix els termes i cacheja. Si la crida externa falla, es respon amb la còpia
cachejada i la seva data (això és el que dibuixa l'estat d'error de `5c`).

## Contingut i to

Català, tracte proper i directe, sense tecnicismes innecessaris ni emojis. Les etiquetes en
majúscules van en mono. Els termes de `temperament` **es tradueixen i es mostren en català**
(§5.2.1), igual que els eixos derivats.

Els textos dels exercicis del prototip són **exemples il·lustratius**. El contingut real l'ha
de curar i validar una persona a partir de fonts fiables (§6.1 del CLAUDE.md) i la font s'ha
de documentar; no s'ha de publicar contingut d'ensinistrament sense revisió humana.

**Els microcopys de lectura del rànquing (`7d`) i el bloc de descartades (`7c`) no són
opcionals.** El model no sosté una recomanació ferma i el disseny no l'ha de suggerir.

## Pendents que bloquegen la implementació

1. **Perfils de pesos dels cinc trastorns restants.** El del TEA ja és real i és el que fa servir la maqueta; els altres cinc surten de `docs/diccionari/perfils-trastorns.csv` (6 × 7 = 42 files) i tenen dos jocs de columnes: les de l'equip són les autoritatives, les de proposta són per contrastar i **no s'usen en producció**.
2. **Catàleg d'exercicis curat i validat** (`6a`, `6b`, `6c`).
3. **Llista de fites predefinides i la seva associació amb exercicis** (`2e`, `6c`).

El diccionari de traducció ja **no** és un pendent: està construït
(`docs/diccionari/termes-temperament.csv`, 49 termes) i la maqueta en fa servir la versió i les
xifres reals.

## Assets

Cap asset binari. Les imatges són marcadors de posició de ratlles diagonals; substituïu-les
per `Breed.imageUrl` de The Dog API o per la foto del gos desada a Supabase Storage. Les
tipografies vénen de Google Fonts (Instrument Serif, Instrument Sans, JetBrains Mono). No hi
ha icones dibuixades: els punts de la barra de pestanyes i els indicadors són formes
geomètriques que cal substituir per la llibreria d'icones que trieu.

## Fitxers

- `Vincle.dc.html` — totes les pantalles, agrupades per rondes de disseny (el torn 7 és el vigent per al matching).
- `support.js` — temps d'execució del prototip. **No** el porteu al projecte.

Obriu `Vincle.dc.html` en un navegador per veure els dissenys a mida real.

## Mantenir el paquet al dia

Aquest paquet és una còpia del disseny en un moment donat. Quan el disseny canviï, s'ha de
regenerar: es torna a copiar `Vincle.dc.html`, s'actualitza la secció corresponent d'aquest
README i s'afegeix una línia al registre de sota. Digues quins canvis s'han fet i es
regenerarà el paquet sencer.

### Registre de versions del paquet

- **h2 — 27 d'agost de 2026.** Actualització a partir de `docs/design/brief-actualitzacio.md`
  (§5.0, §5.2.1–§5.2.5 del CLAUDE.md). Torn 7 nou, que substitueix `2b`, `2c`, `4a`, `1a`, `1b`
  i `3a`:
  - **Correccions.** Sis trastorns, fora el TOC (`7e`, `7c`). `Mida` surt dels pesos i queda com
    a filtre visualment separat (`7c`). Els eixos derivats són set — fora `Reactivitat` i
    `Manteniment`, dins `Tolerància a entorns` — més `Longevitat` amb pes fix del 10 % (`7b`,
    `7c`). Termes de temperament en català. Marca del diccionari amb xifres reals.
  - **Requisit nou.** Patró **«sense dades»** per a totes les barres d'eix, amb especificació
    pròpia a `7a`, recepta de React Native i contracte de dades `value: number | null`. Inclou
    el marcador d'eixos amb direcció `resta`.
  - **Replantejament.** El percentatge deixa de ser un veredicte: baixa a 88px, s'acompanya de
    posició (`#1 de 631`) i d'un **mesurador del recorregut real 41–80 %**, i s'hi afegeix el
    bloc de races descartades i els microcopys de lectura (`7d`, `7c`).
  - Valors reals per eix a les files de `7c` i `7d` (correcció posterior al brief), amb el cas
    del Bohemian Shepherd com a exemple del comptador «N de 8» quan l'eix absent no és visible.
  - Les opcions substituïdes (`1a`, `1b`, `2b`, `2c`, `3a`, `4a`) queden marcades i atenuades
    dins del `.dc.html`.
  - Les dues pantalles de `7d` estan ajustades per cabre exactes a 390×844 sense desplaçament,
    com la resta de maquetes mòbils: el microcopy de lectura i el CTA sempre visibles.
  - Tracking (`2a`, `2d`, `2e`, `5a`, `5b`, `5c`, `6a`, `6b`, `6c`), tokens, tipografia,
    espaiats i to: **sense canvis**, excepte la mida del percentatge protagonista, documentada
    a l'escala tipogràfica.
- **h1 — 8 d'agost de 2026.** Primer paquet. Inclou les rondes 1 a 6: tres direccions de
  rànquing (`1a`, `1b`, `1c`), la triada amb fons clar (`3a`) i la seva versió web (`4a`), el flux
  d'entrenadora (`2a`–`2e`), panell d'inici, llista de gossos i estats (`5a`–`5c`), i la guia
  d'exercicis (`6a`–`6c`). Vista de família d'acollida exclosa per decisió de producte.
