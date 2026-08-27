# CLAUDE.md — Marc de treball del projecte «Vincle»

> Document viu. Recull el context, les decisions i les convencions del projecte.
> S'anirà ampliant a mesura que avanci el treball de recerca. Claude Design i
> Claude Code han de llegir aquest fitxer com a font de veritat abans de qualsevol tasca.
>
> **Idioma del projecte:** tot el producte (interfície, contingut, textos) es fa
> **en català**. Decisió de l'Elna, responsable del projecte.

---

## 1. Context del projecte

**Vincle** és una aplicació web i mòbil desenvolupada com a part pràctica d'un **treball de
recerca de batxillerat**. El desenvolupament tècnic es delega a Claude Code i Claude Design.
La responsable del projecte (Elna) pren les decisions **d'operativa i producte**, no les
tecnològiques. Tota la interfície i el contingut de l'aplicació són **en català**.

### Objectiu

L'aplicació té dues funcionalitats principals:

1. **Explorador de races de gossos.** Consulta informació sobre races de gossos a partir
   d'una API pública i permet filtrar-les responent unes preguntes. L'objectiu no és trobar
   "la raça d'assistència", perquè no n'hi ha, sinó identificar **característiques i
   temperaments** que facilitin l'ensinistrament d'assistència, tenint en compte també el
   trastorn del pacient i les característiques de la família d'acollida.

2. **Seguiment (tracking) de l'ensinistrament** de gossos d'assistència. Registre de
   sessions, fites i evolució del gos al llarg del temps.

### Premisses de disseny del producte

- No existeixen races "d'assistència" per se; sí característiques i temperaments favorables.
- El gos, quan no fa assistència, viu com a **mascota** amb una família d'acollida.
- Cal considerar tres perspectives en el matching: **el gos/raça**, **el pacient/tasca** i
  **la família d'acollida**.

---

## 2. Decisions tecnològiques

> Preses per prioritzar simplicitat, un sol llenguatge i mínima infraestructura, atès que
> tot el desenvolupament el fa Claude Code.

| Àmbit            | Decisió                                             |
|------------------|-----------------------------------------------------|
| Idioma del producte | Català (interfície i contingut)                  |
| Llenguatge codi  | TypeScript (front i back)                            |
| Frontend         | Expo (React Native) → web, iOS i Android            |
| Backend / DB     | Supabase — pla **Free** validat (veure §2.1)       |
| Capa d'API pròpia| Funció servidor per al *matching* i proxy de l'API de races |
| API pública      | The Dog API (thedogapi.com), **tier d'estudiant** — només camps de text; matching per Pla B (veure §2.2, §5.2) |
| Validació        | Zod                                                 |
| Repositori       | Monorepo a GitHub — nom proposat: `vincle-app`     |

### Per què aquest stack

- **Un sol llenguatge** (TypeScript) manté tot coherent i permet compartir tipus.
- **Expo** cobreix web i mòbil amb una única base de codi.
- **Supabase** aporta base de dades, autenticació i API auto-generada sense muntar
  infraestructura pròpia.
- La lògica de negoci sensible (matching, proxy amb cache de l'API externa) viu al servidor.

### 2.1. Supabase (pla Free) — validat

El pla gratuït cobreix amb marge un TR: 50.000 usuaris actius mensuals, 500 MB de base de
dades, 5 GB d'egress (+ 5 GB cached), 1 GB de file storage i sol·licituds d'API il·limitades.
El volum del projecte és de kilobytes a pocs megabytes, així que hi encaixa sense problema.

> **A vigilar (operatiu, no de capacitat):** confirmar la política de **pausa per
> inactivitat** del pla Free. El projecte pot adormir-se després d'uns dies sense activitat i
> cal reactivar-lo manualment. Rellevant perquè es treballa a ràfegues.
>
> *Xifres consultades a supabase.com/pricing. Anotar la data de consulta al treball, ja que
> poden canviar.*

### 2.2. The Dog API — tier d'estudiant (abast confirmat)

Compte d'estudiant **registrat**. El token retorna **només camps descriptius i de text**, i
**no** els camps numèrics (`*_score`, `daily_exercise_time_minutes`) que s'havien previst
inicialment per al matching. En conseqüència, el matching s'implementa amb el **Pla B**:
derivació dels eixos de temperament a partir del text `temperament` + mides reals (veure
§5.1 i §5.2).

**Abast verificat empíricament** (extracció del 9 d'agost de 2026, §5.3). El catàleg té
**631 races** i l'API pagina amb un màxim de 500 resultats per pàgina: cal recórrer-la amb
paginació o se'n perden 131. Cobertura real dels camps:

| Camp | Cobertura | Nota |
|---|---|---|
| `temperament`, `description`, `history`, `origin`, `image` | 100 % | |
| `weight.metric`, `height.metric` | 629/631 | base de l'eix de mida |
| `life_span` | 94 % | informatiu |
| `breed_group` | 100 % | però **brut**: 27 valors amb sinònims del mateix grup |
| `bred_for` | **0 %** | arriba **buit a totes les races** |
| `perfect_for` | **0 %** | camp no previst; també buit |

> **Correcció respecte de versions anteriors d'aquest document:** `bred_for` figurava com a
> disponible i útil per a «pistes de propòsit i instint». **No ho és.** L'única pista de
> propòsit aprofitable és `breed_group`, i abans cal normalitzar-ne els sinònims.

> **Recomanació de robustesa:** la capa d'API pròpia ha de **normalitzar** les dades de The
> Dog API a un model intern propi (`Breed` a `shared-types`). Així, si canvia el tier o
> l'API, només es toca la capa de traducció i no la lògica de matching.

---

## 3. Arquitectura

Client-servidor amb API REST. Sense sobre-enginyeria.

```
[App Expo (web / iOS / Android)]
        │  HTTPS / JSON
        ▼
[Supabase]                         [Capa d'API pròpia (servidor)]
  ├── Auth (usuaris i rols)          ├── Mòdul "Races": proxy + cache de The Dog API
  └── PostgreSQL                     └── Mòdul "Matching": puntuació de compatibilitat
       (gossos, sessions,
        famílies, fites)
```

### Principis

- El client **mai** crida directament l'API pública de races: sempre a través del servidor,
  per poder cachejar, normalitzar i no dependre de la disponibilitat externa.
- El **matching** és un mòdul propi, aïllat i testejable, perquè és el nucli conceptual del
  treball i evolucionarà.
- Autenticació i rols gestionats per Supabase Auth.

### Estructura del repositori (monorepo)

```
/apps
  /app          → Expo (web + mòbil)
  /api          → capa d'API pròpia (matching + proxy races)
/packages
  /shared-types → tipus TS compartits (Dog, Session, MatchResult, Family...)
/scripts        → tasques puntuals de preparació de dades (no formen part de l'app)
/docs
  CLAUDE.md     → aquest document
  /design       → handoff de disseny de Claude Design (referència, no codi de producció)
  /diccionari   → plantilla i dades d'origen del diccionari de traducció (§5.2, §5.3)
```

> **Brief d'actualització del disseny.** `docs/design/brief-actualitzacio.md` recull tots els
> canvis decidits després de generar el paquet `h1` i que el deixen desactualitzat: els sis
> trastorns, la mida com a filtre, els set eixos més la longevitat, els temperaments en català,
> el nou estat «sense dades» de les barres d'eix i el replantejament del percentatge. És el
> document que s'ha de passar a Claude Design perquè regeneri el handoff.

> **Handoff de disseny (`/docs/design`).** Conté el material generat per Claude Design:
> `readme.md` (explica el handoff; llegir primer), `Vincle.dc.html` (maqueta visual de
> referència, format Design Canvas) i `support.js` (material de suport). És **referència de
> disseny** per implementar la interfície en català; **no** és codi de producció a copiar tal
> qual. La implementació real va a `/apps` seguint l'stack i les convencions d'aquest document.

---

## 4. Model de dades (esborrany inicial)

> Provisional. S'afinarà en implementar.

- **User** — compte i rol (entrenador professional / família d'acollida).
- **Dog** — gos concret en seguiment (nom, raça de referència, data naixement, estat).
- **Breed** — dades de raça provinents de The Dog API (cachejades).
- **Family** — família d'acollida (habitatge, espai, temps disponible, experiència, altres
  animals o infants). *No intervé en el matching v1 (§5); es preveu al model però queda
  aparcat.*
- **Exercise** — exercici del catàleg d'ensinistrament (nom, objectiu, **passos amb reforç
  positiu**, criteri d'assoliment, dificultat). **Contingut de referència, catàleg fix i
  curat** (com el diccionari): es defineix un cop i l'app el consulta; l'entrenador no en crea
  de nous a v1.
- **TrainingSession** — sessió d'ensinistrament (data, durada, valoració). Pot **referenciar
  l'`Exercise`** treballat.
- **Milestone** — fita d'ensinistrament (socialització, obediència, tasca específica; estat).
  Pot associar-se a un o més `Exercise` (assolir la fita requereix dominar-ne alguns).
- **MatchProfile** — trastorn seleccionat (§5.0) + resultat de compatibilitat (rànquing de
  races amb percentatge i explicació).

---

## 5. Lògica de matching (nucli conceptual)

**Punt de partida: el trastorn del pacient.** El flux de matching **comença** amb la selecció
del trastorn. A partir d'aquest, es determina quins eixos de temperament prioritzar i amb
quins pesos, per trobar les races que millor s'hi adapten. La sortida és un **rànquing de
compatibilitat amb percentatge i explicació** (sistema de puntuació ponderada, no filtre
binari).

> **Abast actual:** el rol de la **família d'acollida queda apartat de moment** del matching
> (encara no s'ha decidit com encaixar-lo). El model de dades pot preveure'l (§4), però la
> lògica de matching v1 depèn **només del trastorn** i dels eixos del gos.

### 5.0. Trastorns coberts (v1)

El matching es construeix per a aquests **sis** trastorns:

1. Trastorn de l'espectre autista (**TEA**)
2. **Depressió**
3. **Trastorns d'ansietat**
4. Trastorn **bipolar**
5. Trastorn d'estrès posttraumàtic (**TEPT**)
6. Trastorn de dèficit d'atenció amb hiperactivitat (**TDAH**)

> **TOC retirat (v0.15).** El trastorn obsessiu-compulsiu formava part de la llista inicial de
> set i **s'ha eliminat**: no s'ha trobat prou vinculació entre el TOC i la teràpia o
> l'assistència amb gossos per sostenir-hi un perfil. Decisió de la responsable del projecte,
> aplicada també al treball de recerca. Cal que desaparegui de **tot** el producte: enum de
> `MatchProfile.disorder`, plantilla de perfils, pantalla `2b` del qüestionari i selector de
> trastorn del panell lateral de `4a`.
>
> **Divergència amb el handoff de disseny:** la pantalla `2b` dibuixa **set** targetes de
> trastorn amb el TOC inclòs (i amb TOC i TDAH compartint fila), i el panell de `4a` també el
> llista entre els xips. Amb sis trastorns, la graella de `2b` s'ha de reorganitzar. Cal
> anotar-ho quan es regeneri el disseny, com les §5.2.1 i §5.2.4.

Per a cadascun caldrà definir el **perfil de pesos** sobre els eixos del gos (pendent, §9).
Aquesta correlació trastorn → eixos és una **decisió d'operativa** de l'equip i s'ha de poder
documentar i justificar al treball (idealment amb suport de fonts sobre gossos d'assistència
per a cada trastorn).

### Eixos a considerar

**Del gos / raça:** temperament (calma, sociabilitat, reactivitat), entrenabilitat,
orientació a la persona, nivell d'energia, mida, necessitats de manteniment. (Derivats del
`temperament` i les mides; veure §5.1–5.2.)

**Del pacient:** el **trastorn** (llista §5.0) és l'entrada principal. Opcionalment, en el
futur, l'entorn on operarà el gos (transport públic, multituds).

**De la família d'acollida:** *apartat de moment* (veure nota d'abast a dalt).

### 5.1. Dades disponibles de The Dog API (tier d'estudiant)

El token del tier d'estudiant retorna **només camps descriptius i de text**, no els camps
numèrics (`*_score`, `daily_exercise_time_minutes`) que inicialment havíem previst. Camps
disponibles útils per al matching:

| Camp disponible                | Ús                                              |
|--------------------------------|-------------------------------------------------|
| `temperament` (text)           | Font principal per derivar els eixos de temperament. Vocabulari **tancat de 49 termes**, no text lliure il·limitat (mitjana de 5,6 termes per raça) |
| `description`, `history` (text)| Context addicional (no s'analitza automàticament) |
| `breed_group`                  | Pista de propòsit, **previa normalització** dels 27 valors bruts a grups canònics |
| `life_span`                    | Informatiu                                      |
| `weight`, `height` (numèric)   | Eix de **mida** (l'únic eix quantitatiu directe) |
| ~~`bred_for`~~                 | **Descartat: arriba buit a totes les races** (§2.2) |

**Distribució dels termes de `temperament` (631 races).** Molt desigual, i això condiciona el
matching: `intelligent` apareix a 538 races (85 %), `loyal` a 454 (72 %), `alert` a 377 (60 %)
i `energetic` a 304 (48 %); a l'altre extrem, 14 termes apareixen una sola vegada. Un terme
present a gairebé totes les races **no discrimina**: si puntua alt en un eix, gairebé totes
les races puntuaran alt en aquell eix i deixarà de servir per ordenar el rànquing.

> **Decisió (v0.10):** s'accepta la limitació i **es documenta**, sense ponderar per raresa ni
> descartar els termes universals. Els termes freqüents es queden al diccionari; el que separa
> les races són els termes poc habituals que els acompanyen. A la pràctica això vol dir donar
> als termes gairebé universals una puntuació **moderada** (per exemple `intelligent` = 6–7 a
> entrenabilitat) i reservar els extrems per als termes que sí que discriminen (`eager to
> please` = 10, `independent` = 2). És una **limitació metodològica a explicar al treball**.

### 5.2. Estratègia de matching (Pla B — via adoptada)

Com que no es disposa dels *scores*, els eixos de temperament es **deriven per traducció**
del camp `temperament`, i la mida es pren directament de `weight`/`height`. **No** s'usa
extracció amb IA (descartada per complexitat d'entrada).

**Diccionari de traducció (artefacte propi del projecte).** Un mapa mantingut manualment que
associa paraules de temperament a eixos i puntuacions. Exemples orientatius:

| Paraules de `temperament`              | Eix                    | Efecte      |
|----------------------------------------|------------------------|-------------|
| loyal, intelligent, eager to please    | Entrenabilitat         | ↑           |
| stubborn, independent, aloof           | Entrenabilitat         | ↓           |
| active, energetic, playful             | Nivell d'energia       | ↑           |
| calm, gentle, docile                   | Nivell d'energia       | ↓           |
| alert, watchful                        | Alerta / lladruc       | ↑           |
| courageous, confident, bold            | Tolerància a entorns nous | ↑        |
| friendly, sociable, affectionate       | Sociabilitat           | ↑           |

El diccionari el defineixen la responsable del projecte i l'equip; és una **aportació
metodològica pròpia** i s'ha de poder explicar i defensar al treball.

**Escala de puntuació: 0 a 10.** Cada terme assigna una puntuació de 0 a 10 en **un sol eix**.
La puntuació baixa és la manera d'expressar l'efecte «↓» de la taula de dalt: `stubborn` no
resta entrenabilitat, sinó que hi puntua baix (per exemple 2). Si un terme ha d'afectar dos
eixos, es desdobla en dues entrades. Els termes sense eix assignat s'ignoren.

**No és una matriu.** El diccionari **no** puntua cada terme contra cada eix (49 × 9 = 441
caselles, la major part sense sentit). És una relació terme → eix → puntuació: una fila per
terme, i una segona fila només en el cas excepcional que el terme afecti dos eixos.

**Agregació per raça.** Per a cada raça es prenen els seus termes, es tradueixen a eixos i es
fa la **mitjana** dels que cauen al mateix eix. Exemple amb el Border Collie
(`intelligent, energetic, alert, work-focused, loyal, eager to please`): l'entrenabilitat és
la mitjana de les puntuacions d'`intelligent`, `work-focused` i `eager to please`.

**Eixos que una raça no toca.** Si cap terme d'una raça cau en un eix, aquell eix pren el
**valor neutre 5**, no 0. El Labrador Retriever no té cap terme d'alerta i seria injust
puntuar-lo 0 en un eix del qual l'API simplement no diu res. El valor neutre significa «no ho
sabem», i la interfície l'ha de poder distingir d'un valor derivat de debò.

### 5.2.1. Idioma dels termes de temperament

Els termes de `temperament` **es tradueixen al català** i és la versió catalana la que es
mostra a l'aplicació. Decisió de la responsable del projecte.

> **Divergència coneguda amb el handoff de disseny.** El `README.md` de `/docs/design` diu que
> els termes de `temperament` s'han de mostrar «tal com arriben de l'API (en anglès)» i que
> només els eixos derivats van en català. Aquesta decisió **el revoca**: tot es mostra en
> català, coherent amb l'idioma del producte (§1). Cal regenerar el handoff o anotar-hi
> l'excepció quan es torni a tocar el disseny.

La traducció viu a `docs/diccionari/traduccions-ca.csv` com a **artefacte editable**, no
incrustada al codi: canviar una paraula de la interfície no ha de requerir tocar cap component.
Les traduccions actuals són una **proposta pendent de revisió** per part de la responsable,
especialment les dels termes que competeixen entre si (`friendly`/`amiable`,
`happy`/`merry`, `smart`/`clever`/`intelligent`).

**Puntuació ponderada.** Un cop derivats els eixos, s'apliquen els **pesos del trastorn
seleccionat** (perfil per trastorn, §5.0 i §5.2.3) per obtenir el rànquing de compatibilitat
amb percentatge i explicació.

### 5.2.2. Eixos actius (v1) i eixos retirats

El diccionari està **construït** (`docs/diccionari/termes-temperament.csv`): 49 termes, 49
assignacions a eix i un terme ignorat. Els eixos derivats del temperament són **set**, més
`mida`, que es calcula de `weight`/`height` i no surt a `eixos.csv`.

Distribució real dels set eixos sobre les 631 races (desviació alta = l'eix ordena el rànquing;
desviació baixa = no separa res). Es pot recalcular amb `scripts/valida-diccionari.ts`:

| Eix | mín | mitjana | màx | desviació | races al neutre |
|---|---|---|---|---|---|
| `alerta` | 5,0 | 7,4 | 9,0 | 1,96 | 40 % |
| `energia` | 5,0 | 7,3 | 9,0 | 1,80 | 37 % |
| `tolerancia-entorns` | 3,0 | 6,8 | 9,0 | 1,75 | 45 % |
| `sociabilitat` | 2,0 | 6,4 | 9,0 | 1,64 | 48 % |
| `calma` | 3,0 | 5,8 | 9,0 | 1,61 | 76 % |
| `entrenabilitat` | 3,0 | 6,4 | 10,0 | 1,45 | 6 % |
| `orientacio-persona` | 4,0 | 6,0 | 8,0 | 0,94 | 18 % |

**Eixos retirats: `reactivitat` i `manteniment`.** Cap terme del vocabulari de The Dog API hi
cau, així que totes les races hi sortien al neutre 5 amb desviació 0,00: no aportaven res al
rànquing. El motiu és una **troballa a documentar al treball**: el vocabulari de 49 termes no
diu res sobre cura ni pèl, i la reactivitat queda absorbida per `alerta`, `calma` i
`tolerancia-entorns`. Els perfils de pesos per trastorn (§5.0) **no els poden referenciar**.

**Dues limitacions a documentar:**
- `orientacio-persona` amb prou feines separa races (desviació 0,94), perquè `loyal` és a 454
  races (72 %) i domina l'eix. És l'efecte descrit a la §5.1, i s'accepta conscientment.
- `calma` només es pot derivar en el **24 %** de les races: en el 76 % restant cap terme hi cau
  i queda al neutre. Per als trastorns on la calma pesi molt (TEPT, ansietat), el rànquing
  l'acabaran ordenant sobretot els altres eixos.

**On viu el diccionari.** A `/docs/diccionari` (§5.3): `termes-temperament.csv` és la
plantilla, `eixos.csv` la llista tancada d'eixos i `traduccions-ca.csv` les traduccions. L'eix
**`mida` no surt a `eixos.csv`** perquè es calcula directament de `weight`/`height` i no es
deriva de cap paraula.

### 5.2.3. Perfils de pesos per trastorn

Plantilla a `docs/diccionari/perfils-trastorns.csv`: **6 trastorns × 7 eixos = 42 files**
(els eixos derivats de §5.2.2). Validació amb `scripts/valida-perfils.ts`.

**Dues valoracions en paral·lel.** El fitxer conté dos jocs de columnes:

| Columnes | Qui les ha fetes |
|---|---|
| `pes`, `direccio`, `justificacio`, `font` | **L'equip** (l'Elna). Són les **autoritatives**: el motor de matching farà servir aquestes |
| `pes_proposta`, `direccio_proposta`, `justificacio_proposta`, `font_proposta` | Proposta independent elaborada a partir de la literatura (§ fonts a `docs/diccionari/fonts.md`), **per contrastar** |

Les de proposta **no s'usen en producció**. Serveixen per discutir les diferències i per poder
explicar al treball per què s'ha decidit el que s'ha decidit allà on les dues valoracions
discrepen. El validador comprova que tots dos jocs sumin 100.

**Cada fila té un pes i una direcció.**

- **`pes`** (0–100) — quant importa aquell eix per a aquell trastorn. Els pesos d'un mateix
  trastorn han de **sumar 100**.
- **`direccio`** (`suma` | `resta`) — si per a aquell trastorn convé que l'eix sigui **alt**
  (`suma`) o **baix** (`resta`).

La direcció cal perquè **no tots els eixos són «com més alt, millor»**. Per al TDAH interessa
un gos d'energia continguda: només amb pesos, un gos hiperactiu sortiria premiat per tenir
`energia` alta.

**És binària a posta.** Una versió anterior graduava un `ideal` de 0 a 10. Es va simplificar
perquè, amb dades derivades d'un diccionari de 49 termes, dir «l'ideal d'energia és 7» és
precisió falsa: no tenim resolució per distingir un 7 d'un 8. El binari també fa l'anàlisi
molt més ràpida d'omplir i molt més fàcil de defensar al treball.

> **La mida no hi és.** Els 7 eixos del perfil són els derivats del temperament. La mida actua
> només com a filtre i no entra a la fórmula (§5.2.4).

**Fórmula de compatibilitat.** Amb la direcció aplicada, és una mitjana ponderada normal:

```
valor_orientat_e = valor_e            si direccio = suma
                   10 − valor_e       si direccio = resta

compatibilitat (%) = Σ( pes_e × valor_orientat_e ) / ( Σ pes_e × 10 ) × 100
```

on `valor_e` és el valor 0–10 de l'eix per a la raça (mitjana dels termes, o 5 neutre si no
n'hi cau cap; §5.2). Amb els pesos sumant 100, el divisor és 1000. Una raça que tregui 10 a
tots els eixos que sumen i 0 a tots els que resten faria el 100 %.

> Aquesta fórmula dona **exactament el mateix resultat** que la de distància a l'ideal quan
> l'ideal era 0 o 10; `suma` equival a `ideal = 10` i `resta` a `ideal = 0`. La simplificació
> no canvia el model, només elimina els casos intermedis que no sabíem justificar.

**Parany a evitar: `resta` en un eix sense valors baixos.** A `energia` i `alerta`, cap raça
baixa de 5,0, perquè el diccionari no té cap terme que hi puntuï baix (§5.2.2). Posar-hi
`resta` no premia les races tranquil·les: premia les que **no tenen cap terme** d'aquell eix,
és a dir, aquelles de les quals no en sabem res. El validador n'avisa. Si per a un trastorn
convé energia baixa, val més **donar poc pes a `energia` amb `suma`** que invertir-la.

**Justificació i font.** Cada fila té columnes `justificacio` i `font`. La correlació
trastorn → eixos és una decisió d'operativa de l'equip i **s'ha de poder defensar al treball**,
idealment amb suport de fonts sobre gossos d'assistència per a cada trastorn (§5.0). El
validador avisa de les files que en van sense.

**Estat de l'evidència (important per al treball).** Cap font quantifica pesos per eix i per
trastorn: no existeix literatura que digui «per al TEPT la calma val un 25 %». El que sí que
està quantificat, i bé, és **quins trets prediuen que un gos superi l'ensinistrament
d'assistència** — i aquests trets són **els mateixos per a tots els trastorns**. La part
específica de cada trastorn es dedueix de les **tasques** que hi fa el gos, i aquesta deducció
és aportació nostra, no de les fonts. La revisió sistemàtica de referència conclou que les
debilitats metodològiques del camp impedeixen conclusions clares. Detall complet, per trastorn
i amb les referències, a **`docs/diccionari/fonts.md`**.

> **Troballa que hauria de condicionar com es presenta el rànquing.** Els instruments validats
> d'avaluació de temperament encerten el 85–92 % dels gossos que **fracassaran**, però només el
> 62–72 % dels que **triomfaran** (Bray et al., 2019). Serveixen molt millor per **descartar**
> que per **escollir**. El rànquing de Vincle hereta aquesta asimetria: és més fiable dient
> «aquesta raça probablement no encaixa» que «aquesta és la millor». Convé que la interfície i
> el treball ho reflecteixin i no venguin el primer resultat com una recomanació ferma.

### 5.2.4. La mida no és un eix del perfil: és un filtre

**Decisió (v0.13).** La mida **queda fora de la fórmula de compatibilitat**. No depèn del
trastorn: per al TDAH no hi ha cap raó per preferir un gos gros o un de petit. El que sí que
determina la mida és **l'entorn** on ha de viure i treballar el gos — l'espai de l'habitatge,
si ha d'entrar en una aula, si ha d'anar en transport públic. Atribuir-la al trastorn seria
donar-li una causalitat que no té, i el treball no ho podria defensar.

Això ja quedava ben resolt al handoff de disseny sense dir-ho: la pantalla `2b` demana el
**trastorn**, les **tasques** i l'**entorn habitual** (Casa / Escola / Transport) més el **pes
màxim** en passos separats. La mida hi viu com a filtre, no com a preferència del trastorn.

**Com actua.** Filtre dur sobre el pes mitjà adult (`weight.metric`), amb el valor que
l'usuari tria al control lliscant. **No cal cap escala 0–10**: el filtre treballa directament
amb quilos, que és una dada real i entenedora.

Les races que superen el màxim **no desapareixen**: baixen al final del rànquing amb el motiu
visible, tal com dibuixa la pantalla `4a` («penalitzada per mida (45 kg)»). Així mai no queda
una llista buida i l'usuari entén per què una raça que semblaria bona no és a dalt.

Impacte del filtre sobre el catàleg (629 races amb pes): un màxim de 20 kg en deixa fora el
59 %; 30 kg, el 24 %; 40 kg, el 12 %. Rang real del catàleg: de 2 kg (Chihuahua) a 79 kg
(English Mastiff), amb mediana de 22 kg — útil per calibrar els extrems del control lliscant.

> **Divergència amb el handoff de disseny.** El panell lateral de la pantalla `4a` mostra
> `mida 10 %` dins dels pesos del perfil. Amb aquesta decisió, aquell panell ha de mostrar
> només els **7 eixos** i el pes màxim s'ha de veure clarament com el que és: un filtre a part.
> Cal anotar-ho quan es regeneri el disseny (com la §5.2.1).

> **Possible ampliació, fora d'abast a v1.** Si algun dia la mida ha d'influir en la puntuació,
> el lloc natural **no és el trastorn sinó la tasca**: la pressió profunda demana un gos amb pes
> real. La pantalla `2b` ja recull les tasques, així que l'enganxall hi seria. Queda apuntat.

### 5.2.5. Longevitat: eix de pes fix, igual per a tots els trastorns

**Decisió (v0.16).** L'esperança de vida (`life_span`, disponible al **94 %** de les races)
entra al càlcul com un **eix més**, però amb un **pes fix del 10 % idèntic a tots els perfils**
i sempre amb direcció `suma`: com més llarga, millor.

**Per què no va a la plantilla de perfils.** Pel mateix motiu que la mida: la longevitat no
depèn del trastorn. Un gos que viu poc és igual de problemàtic per al TEA que per al TEPT. En
comptes d'afegir 42 files repetides, el motor **reserva el 10 %** i **reescala** els pesos de
temperament perquè el total continuï sumant 100. Els 42 pesos del CSV segueixen volent dir «com
es reparteixen els set eixos de temperament entre ells», que és el que va decidir l'equip.

**Per què compta.** Un gos d'assistència necessita uns **dos anys d'ensinistrament**, així que
la longevitat es tradueix directament en anys de feina útil. Una raça que viu 6,5 anys en dona
uns quatre i mig; una de 14, dotze.

**Escala.** Interpolació lineal entre punts d'ancoratge fixos, deliberadament **plana per dalt
i abrupta per baix**: el 76 % del catàleg viu entre 12 i 15 anys i no cal esmicolar-lo, mentre
que les races que no arriben als 9 anys sí que s'han de penalitzar.

| Esperança de vida | ≤ 7 anys | 9 anys | 11 anys | 13 anys | ≥ 15 anys |
|---|---|---|---|---|---|
| Valor de l'eix | 0 | 3 | 6 | 8,5 | 10 |

Sense dada (6 % de les races), **neutre 5**, el mateix criteri que a la resta d'eixos.

**Efecte mesurat** sobre les 631 races, amb `scripts/previsualitza-ranquing.ts`; l'informe
complet és a `docs/diccionari/previsualitzacio-ranquing.md`. Amb el 10 %, l'esperança de vida
mitjana del top 10 puja de 10,1 a
**13,1 anys** al TEPT i de 10,6 a 13,1 a l'ansietat, i desapareixen del podi els molossos
gegants (Leonberger, mastí napolità, bullmastiff, dogue de Bordeus) que hi entraven per estar
etiquetats com a `calm` o `gentle` i viure entre 6,5 i 9 anys. Als sis trastorns el top 10
queda ara per sobre de la mitjana del catàleg.

> **Efecte lateral a documentar.** La longevitat **perjudica el labrador retriever** (11 anys,
> per sota de la mediana de 13) i **afavoreix el caniche** (14 anys). No és un error: els
> labradors viuen efectivament menys que moltes races petites. Però il·lustra que el model
> segueix sense reproduir quines races es fan servir de debò per a assistència, que és una
> troballa del treball i no un defecte a corregir.

**Limitacions a documentar al treball (honestedat metodològica):**
- El `temperament` no és text lliure sinó un vocabulari tancat de 49 termes, però no és
  exhaustiu ni s'aplica de manera coherent entre races.
- La traducció paraula → puntuació és una simplificació decidida per l'equip.
- Dues races amb la mateixa etiqueta poden diferir en matisos que el diccionari no capta.
- La mida i la longevitat són els únics eixos amb dada numèrica directa i fiable.
- **El model no reprodueix quines races es fan servir de debò per a assistència.** A la
  previsualització, el labrador retriever —que la literatura descriu com la raça predominant
  en assistència psiquiàtrica— queda entre el lloc 138 i el 291 de 631 segons el trastorn, i
  el podi se l'emporten races molt poc habituals. No és un defecte a corregir: és la
  conseqüència mesurable de treballar amb 49 etiquetes de text, i **sosté la premissa del
  treball** (§1) que no existeixen races d'assistència. La selecció real es fa per criteris
  que l'API no conté: docilitat individual, salut, programes de cria i disponibilitat.

### 5.3. Tasca preparatòria — extracció de valors per al diccionari ✅ EXECUTADA

Perquè l'Elna pugui construir el diccionari de traducció (§5.2), primer cal conèixer
**l'univers real de termes** que apareixen als camps de text de The Dog API. Aquesta és una
**tasca única de preparació de dades**, executada un sol cop; **no** forma part de
l'aplicació en execució. Vincle, en marxa, farà servir el diccionari ja construït i **no**
tornarà a extreure res.

**Encàrrec a Claude Code:**

1. Connectar-se a The Dog API amb el token (ja disponible) i recuperar **totes les races**.
2. Del camp `temperament`, partir cada valor per comes i construir la **llista única de
   termes** de tot el catàleg (normalitzats: sense espais sobrants, sense duplicats).
3. Per a cada terme, comptar la **freqüència** (nombre de races que el contenen), per poder
   prioritzar els termes més habituals.
4. Fer el mateix procés, per separat, amb `breed_group` i `bred_for` (valors de text acotats
   que aporten pistes de propòsit i instint).
5. Exportar el resultat a un fitxer **CSV / full de càlcul** treballable, amb columnes:
   `terme`, `freqüència`, i columnes **buides** `eix` i `puntuació` perquè l'Elna les ompli.
   Aquest fitxer és la **plantilla del diccionari**.

> Aquest artefacte de sortida és la base sobre la qual l'Elna definirà les correlacions
> terme → eix → puntuació que alimentaran el matching.

**Resultat de l'execució (9 d'agost de 2026).** Script a `scripts/extreu-termes.ts`, sortida a
`/docs/diccionari` (veure'n el `README.md` per al detall i les instruccions d'ús):

| Fitxer | Contingut |
|---|---|
| `termes-temperament.csv` | **49 termes únics**, per freqüència, amb `eix` i `puntuacio` per omplir |
| `termes-breed-group.csv` | 27 valors + proposta de `grup_canonic` (11 grups) |
| `termes-bred-for.csv` | Buit: el camp no té dades. Es conserva com a evidència de la comprovació |
| `eixos.csv` | Els 9 eixos, per fer validació de dades al full de càlcul |
| `traduccions-ca.csv` | Fitxer d'**entrada** amb les traduccions al català (§5.2.1) |

Reexecució: `DOG_API_KEY=... node --experimental-strip-types scripts/extreu-termes.ts`.
Sobreescriu els CSV de sortida, així que cal fer còpia de la feina abans de tornar-lo a
executar. El token va per variable d'entorn o `.env` local; **mai** al repositori.

---

## 6. Funcionalitats del tracking

La part de tracking té una **doble funció**: serveix de **guia/manual d'ensinistrament** i de
**registre de seguiment**. El bucle previst és *consultar com fer l'exercici → practicar-lo →
registrar-lo*, tot al mateix lloc.

### 6.1. Guia d'exercicis (manual)

- **Catàleg fix i curat** d'exercicis (entitat `Exercise`, §4), consultable des de l'app.
- Cada exercici inclou objectiu, **passos basats en reforç positiu**, criteri d'assoliment i
  dificultat.
- És contingut de **referència**: es defineix un cop; a v1 l'entrenador no en crea de nous.

> **Origen i validació del contingut (important):** els exercicis descriuen com entrenar amb
> reforç positiu i **han de ser correctes**. El contingut l'ha de **curar i validar una
> persona** (l'Elna), a partir de fonts fiables, i la **font s'ha de documentar** al treball.
> No s'ha de publicar contingut d'ensinistrament generat automàticament sense revisió humana.

### 6.2. Registre de seguiment

- Registre de sessions amb durada i valoració; cada sessió pot referenciar l'`Exercise` treballat.
- Fites d'ensinistrament predefinides amb estat, associables a exercicis.
- Gràfics d'evolució per gos.
- Rols diferenciats (entrenador / família) amb vistes i permisos propis.
- Notes i incidències de comportament.

---

## 7. Convencions per a Claude Code i Claude Design

- Llegir **sempre** aquest fitxer abans d'una tasca; és la font de veritat.
- Mantenir **TypeScript** a tot arreu i **compartir tipus** via `/packages/shared-types`.
- Cap crida a l'API pública des del client.
- Codi comentat de manera pedagògica: aquest és un treball de recerca i el codi s'ha de poder
  explicar i defensar.
- Validar tota entrada externa amb **Zod**.
- Commits petits i descriptius.
- Quan una decisió d'operativa o producte no estigui definida, **preguntar** abans d'assumir.

---

## 8. Operativa del repositori i Git

- **Repositori:** `vincle-app`, a GitHub, creat i propietat del compte de l'**Elna**
  (responsable del projecte).
- **Autoria dels commits:** tots els commits han de quedar a nom de l'Elna. Al clon local
  de l'ordinador de treball s'ha configurat, **només dins d'aquest repositori** (sense
  `--global`), el `user.name` i el `user.email` de l'Elna (amb el seu correu verificat a
  GitHub). Això no afecta cap altre projecte de l'ordinador.
- **Autenticació / push:** es treballa des de l'ordinador on el compte de GitHub és el d'una
  altra persona, que ha estat **afegida com a col·laboradora** del repositori per l'Elna.
  Els commits queden a nom de l'Elna (per la configuració d'autoria); el push es fa amb el
  compte col·laborador. No es comparteixen credencials.
- **Co-autoria de Claude Code:** s'accepta que Claude Code afegeixi la seva línia de
  co-autoria als missatges de commit. No altera l'autor principal (l'Elna).
- **Verificació recomanada:** després de configurar-ho, fer un commit de prova i comprovar
  amb `git log` que l'autor és el correcte abans de començar a treballar de debò.

---

## 9. Pendents i decisions obertes

- [x] ~~Confirmar The Dog API com a font~~ → escollida; premium via tier d'estudiant.
- [x] ~~Validar que Supabase Free encaixi~~ → validat (§2.1).
- [x] ~~Triar nom de l'aplicació~~ → **Vincle**.
- [x] ~~Decidir idioma del producte~~ → **català**.
- [x] ~~Configurar autoria dels commits i accés al repositori~~ → fet (§8).
- [x] ~~Confirmar abast del tier d'estudiant de The Dog API~~ → només camps de text; adoptat
  **Pla B** (§5.2). Extracció amb IA descartada.
- [x] ~~Definir el punt de partida del matching~~ → el **trastorn del pacient** (§5, §5.0).
- [x] ~~Executar la tasca d'extracció de valors dels camps de text (§5.3)~~ → feta; plantilla a
  `/docs/diccionari`. Va revelar que `bred_for` arriba buit (§2.2).
- [x] ~~Fixar l'escala de puntuació del diccionari~~ → **0 a 10**, un eix per terme (§5.2).
- [x] ~~Decidir l'idioma dels termes de temperament~~ → **català** (§5.2.1), divergint del
  handoff de disseny.
- [ ] Confirmar la política de pausa per inactivitat de Supabase Free.
- [x] ~~Decidir com tractar els termes gairebé universals~~ → **acceptar-ho i documentar-ho**
  com a limitació metodològica, amb puntuacions moderades per als termes freqüents (§5.1).
- [x] ~~Decidir el valor dels eixos sense cap terme~~ → **5 neutre** («no ho sabem»), no 0 (§5.2).
- [x] ~~Construir el diccionari de traducció temperament → eixos~~ → **fet** (§5.2.2). 49 termes
  assignats sobre **7 eixos actius**; `reactivitat` i `manteniment` retirats per manca de dades.
- [ ] **Revisar les traduccions al català** proposades a `traduccions-ca.csv` (§5.2.1).
- [ ] **Revisar la proposta de grups canònics** de `breed_group` (columna `grup_canonic`).
- [x] ~~Decidir el paper de la mida al matching~~ → **fora de la fórmula**; només filtre de pes
  màxim, perquè depèn de l'entorn i no del trastorn (§5.2.4).
- [x] ~~Definir el perfil de pesos per trastorn~~ → **fet** per l'equip (§5.2.3), amb una
  proposta independent en paral·lel per contrastar. Ja **no bloqueja el motor de matching**.
- [x] ~~Decidir l'abast dels trastorns coberts~~ → **TOC retirat**; queden sis (§5.0).
- [ ] **Contrastar les dues valoracions** dels perfils i decidir on es mantenen les de l'equip
  i on s'adopta la proposta. Omplir `justificacio` i `font` de les columnes autoritatives.
- [ ] **Revisar la direcció `resta` a `energia` i `alerta`** (§5.2.3): el validador hi avisa en
  6 files, perquè cap raça no baixa del neutre en aquests dos eixos.
- [ ] **Propagar la retirada del TOC** a la resta del producte quan s'implementi: enum de
  `MatchProfile.disorder`, pantalla `2b` i selector de `4a` (§5.0).
- [ ] Definir el catàleg de preguntes del qüestionari de matching (si cal, més enllà del trastorn).
- [ ] Definir el llistat de fites d'ensinistrament predefinides.
- [ ] **Redactar / curar el catàleg d'exercicis** amb reforç positiu (§6.1), validat per una
  persona i amb font documentada.
- [ ] Decidir abast del rol "família d'acollida" (apartat de moment del matching; §5).

---

## 10. Registre de canvis del document

- **v0.1** — Versió inicial: context, stack, arquitectura, model de dades esborrany i
  convencions.
- **v0.2** — Nom del projecte (**Vincle**) i idioma (**català**). Supabase Free validat
  (§2.1). The Dog API premium via tier d'estudiant amb capa de normalització (§2.2). Mapa de
  camps premium → eixos de matching (§5.1). Pendents actualitzats.
- **v0.3** — Afegida l'operativa del repositori i Git (§8): autoria dels commits a nom de
  l'Elna, accés com a col·laborador i co-autoria de Claude Code.
- **v0.4** — Abast del tier d'estudiant de The Dog API confirmat: només camps de text (§2.2).
  Reescrita la lògica de matching amb el **Pla B** (derivació per diccionari de traducció
  temperament → eixos + mides reals; §5.1 i §5.2). Extracció amb IA descartada per
  complexitat. Pendents actualitzats amb la construcció del diccionari.
- **v0.5** — Afegida la tasca preparatòria d'extracció de valors dels camps de text (§5.3):
  encàrrec a Claude Code per generar la plantilla del diccionari (termes + freqüència).
  Marcada com a tasca única, no part de l'app en execució. Pendents actualitzats.
- **v0.6** — Fixat el **trastorn del pacient com a punt de partida** del matching (§5) i
  llista dels **7 trastorns coberts** a v1 (§5.0: TEA, depressió, ansietat, bipolar, TEPT,
  TOC, TDAH). El rol de **família d'acollida queda apartat** del matching de moment. Pesos ara
  per trastorn, no per perfil de família. Pendents actualitzats.
- **v0.7** — El tracking passa a tenir **doble funció**: guia/manual d'ensinistrament +
  registre (§6, reestructurada en §6.1 i §6.2). Nova entitat **Exercise** al model de dades
  (§4), catàleg fix i curat, relacionada amb sessions i fites. Contingut basat en **reforç
  positiu**, a curar i validar per una persona i amb font documentada. Pendents actualitzats.
- **v0.8** — Afegida la carpeta **`/docs/design`** a l'estructura del repositori (§3): handoff
  de disseny de Claude Design (`readme.md`, `Vincle.dc.html`, `support.js`) com a **referència
  de disseny**, no codi de producció.
- **v0.9** — **Executada la tasca d'extracció** de la §5.3 sobre les 631 races reals del
  catàleg. Conseqüències documentades: `bred_for` i `perfect_for` arriben **buits** i queden
  descartats (§2.2, §5.1, corregint versions anteriors); el vocabulari de `temperament` és
  **tancat i petit** (49 termes) però molt desigual, cosa que obre la decisió sobre els termes
  que no discriminen (§5.1, §9); `breed_group` arriba brut i necessita normalització. Fixada
  l'**escala de puntuació 0–10** amb un eix per terme (§5.2). Nova §5.2.1: els termes de
  `temperament` **es tradueixen al català**, divergint explícitament del handoff de disseny.
  Afegides `/scripts` i `/docs/diccionari` a l'estructura del repositori (§3).
- **v0.10** — Tancades les decisions que bloquejaven l'ompliment del diccionari. Termes
  gairebé universals: **s'accepten i es documenten** com a limitació, amb puntuacions moderades
  (§5.1). Precisat que el diccionari **no és una matriu** terme × eix sinó una relació
  terme → eix → puntuació, amb **mitjana** com a regla d'agregació per raça i **5 neutre** per
  als eixos que una raça no toca (§5.2).
- **v0.11** — **Diccionari construït** (§5.2.2). Set eixos actius amb la distribució real sobre
  les 631 races; **`reactivitat` i `manteniment` retirats** perquè cap terme del vocabulari de
  l'API hi cau. Afegit `scripts/valida-diccionari.ts`, que comprova el format del CSV (els fulls
  de càlcul l'exporten amb separadors variables), valida els eixos i les puntuacions, i calcula
  la capacitat de discriminació de cada eix. Documentades dues limitacions: `orientacio-persona`
  amb prou feines separa races i `calma` només es deriva en el 24 % del catàleg.
- **v0.12** — Nova §5.2.3: **perfils de pesos per trastorn**. Cada parella trastorn-eix porta
  **`pes` i `ideal`**, no només pes, perquè no tots els eixos són «com més alt millor» (el TDAH
  demana energia continguda). Fixada la **fórmula de compatibilitat** i l'**escala de l'eix
  `mida`** per llindars fixos de pes en kg, derivats de la distribució real del catàleg.
  Plantilla a `docs/diccionari/perfils-trastorns.csv` i validador `scripts/valida-perfils.ts`.
- **v0.13** — Nova §5.2.4: **la mida surt de la fórmula de compatibilitat** i queda només com a
  **filtre de pes màxim**. Motiu: no depèn del trastorn sinó de l'entorn on ha de viure i
  treballar el gos, i el disseny ja ho recollia en passos separats. Cau l'escala 0–10 de la
  mida (el filtre treballa amb quilos) i els perfils passen de 56 a **49 files**. Anotada la
  divergència amb el panell de la pantalla `4a`, que mostrava `mida 10 %` entre els pesos.
- **v0.14** — L'`ideal` de 0–10 passa a ser una **`direccio` binària** (`suma` / `resta`;
  §5.2.3). Amb dades derivades d'un diccionari de 49 termes, graduar l'ideal era precisió
  falsa. La fórmula queda com una **mitjana ponderada** i dona el mateix resultat que abans per
  als casos 0 i 10. Documentat el parany de posar `resta` a `energia` o `alerta`, on cap raça
  baixa del neutre i la inversió acabaria premiant la manca de dades; el validador n'avisa.
- **v0.15** — **TOC retirat** de la llista de trastorns; en queden **sis** (§5.0), amb la
  divergència corresponent anotada a les pantalles `2b` i `4a`. **Perfils omplerts per l'equip**
  i acompanyats d'una **proposta independent** en columnes paral·leles per contrastar-los
  (§5.2.3), amb la bibliografia verificada a `docs/diccionari/fonts.md`. Documentat l'estat real
  de l'evidència: cap font quantifica pesos per trastorn, i els instruments validats són molt
  millors descartant gossos que triant-ne, cosa que hauria de condicionar com es presenta el
  rànquing. El validador accepta `1`/`0` com a sinònims de `suma`/`resta`, descarta les columnes
  buides que hi afegeix Excel i entén les cometes del CSV.
- **v0.16** — **Previsualització del rànquing** sobre les 631 races
  (`scripts/previsualitza-ranquing.ts`, informe a `docs/diccionari/previsualitzacio-ranquing.md`).
  Va detectar que la direcció `resta` a `energia` feia que **no tenir dades pugés la raça** al
  rànquing (correlació +0,14) i omplia el podi de molossos de vida curta; **corregida a ansietat
  i TEPT**. Nova §5.2.5: la **longevitat** entra com a eix de **pes fix del 10 %** igual a tots
  els perfils, amb reescalat dels pesos de temperament perquè el CSV no s'hagi de tocar.
  Reordenades les subseccions §5.2.x, que estaven barrejades. Documentada com a limitació la
  troballa que el model **no reprodueix les races realment usades** per a assistència.
