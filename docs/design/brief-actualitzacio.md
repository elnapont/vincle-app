# Brief per a Claude Design — actualització del handoff de Vincle

Aquest document recull els canvis que s'han decidit **després** de generar el paquet de disseny
`h1` (8 d'agost de 2026) i que el fan quedar desactualitzat en alguns punts. El `README.md` del
handoff diu que, quan hi hagi canvis, se't digui quins són i regeneris el paquet sencer: això és
aquesta llista.

**On viu la veritat.** Totes aquestes decisions estan documentades al `CLAUDE.md` de l'arrel del
repositori, que és la font de veritat del projecte. Les seccions rellevants són §5.0, §5.2.1,
§5.2.2, §5.2.3, §5.2.4 i §5.2.5. El `README.md` del handoff **no** les recull encara.

Els canvis es divideixen en tres tipus, i el tercer és el més important:

- **A. Correccions** — coses que la maqueta dibuixa i que ara són factualment incorrectes.
- **B. Un requisit nou** — un estat que el sistema visual encara no sap representar.
- **C. Un replantejament** — el titular del resultat, ara que sabem quins números surten de debò.

---

## A. Correccions

### A1. Sis trastorns, no set — el TOC surt

El trastorn obsessiu-compulsiu s'ha retirat del projecte: no s'ha trobat prou vinculació
documentada entre el TOC i l'assistència amb gossos. Els sis que queden són **TEA, depressió,
trastorns d'ansietat, trastorn bipolar, TEPT i TDAH**.

- **`2b`, pas 1** — són sis targetes, no set. La graella actual té el TOC i el TDAH compartint
  fila; cal reorganitzar-la per a sis elements.
- **`4a`, panell lateral** — fora el xip «TOC» del selector de trastorn.

### A2. La mida surt dels pesos del perfil

La mida ja no és un eix ponderat: no depèn del trastorn sinó de l'entorn on ha de viure i
treballar el gos. Actua **només com a filtre de pes màxim**.

- **`4a`, panell lateral** — treu `Mida 10 %` de la llista de pesos. El control lliscant de pes
  màxim es queda, però s'ha de llegir clarament com un **filtre a part**, no com un eix més.
  Val la pena separar-los visualment perquè no es confonguin.

### A3. Els eixos derivats són set, i «Manteniment» no hi és

Es van retirar dos eixos perquè cap terme del vocabulari de l'API hi queia i totes les races hi
sortien al valor neutre: **`Reactivitat`** i **`Manteniment`**. Els set que queden, amb el nom
tal com s'ha de mostrar:

`Entrenabilitat` · `Energia` · `Calma` · `Sociabilitat` · `Orientació a la persona` ·
`Alerta` · `Tolerància a entorns`

- **`2c`, targeta d'eixos derivats** — ara hi surt `Manteniment`. Cal substituir-lo. La graella
  ha de mostrar **vuit valors**: aquests set més la longevitat (vegeu A4).

### A4. Hi ha un vuitè valor: la longevitat

L'esperança de vida entra al càlcul com un eix amb **pes fix del 10 %, igual per a tots els
trastorns** i sempre en positiu (com més llarga, millor). No apareix a la plantilla de perfils
perquè no depèn del trastorn, però **sí que s'ha de veure** a la fitxa de raça i al panell de
pesos.

- **`2c`** — afegeix `Longevitat` a la targeta d'eixos.
- **`4a`, panell lateral** — afegeix `Longevitat 10 %` als pesos, marcada d'alguna manera com a
  **fixa**: és l'únic pes que no canvia entre trastorns.

### A5. Els termes de temperament van en català

El `README.md` del handoff diu que els termes de `temperament` es mostrin «tal com arriben de
l'API (en anglès)». **Aquesta decisió s'ha revocat**: es tradueixen i es mostren en català,
coherent amb l'idioma del producte.

- **`2c`, xips de temperament** — en català. Exemples reals: `amigable`, `intel·ligent`,
  `entregat`, `segur de si mateix`, `lleial`, `disposat a complaure`.

### A6. La marca del diccionari

La maqueta posa `diccionari v0.3 · 6 termes`. El diccionari real té **49 termes** en total, i
cada raça en fa servir **5,6 de mitjana** (mínim 1, màxim 9). El format està bé; només cal que
les xifres siguin plausibles.

---

## B. Requisit nou: l'estat «sense dades»

**Aquest és el punt que més feina de disseny demana, i el que més importa.**

Un eix pot valer 5 sobre 10 per dues raons completament diferents:

1. Perquè els termes de la raça donen una mitjana de 5.
2. Perquè **cap terme de la raça cau en aquell eix** i el model hi posa un 5 que vol dir «no ho
   sabem».

Ara mateix el sistema visual dibuixa els dos casos igual: una barra a mitja alçada. Això no és
un detall, és enganyós, i en un treball de recerca és el tipus de cosa que un tribunal detecta.

**No és un cas marginal.** Sobre les 631 races del catàleg:

| Eix | Races sense cap dada |
|---|---|
| Calma | 76 % |
| Sociabilitat | 48 % |
| Tolerància a entorns | 45 % |
| Alerta | 40 % |
| Energia | 37 % |
| Orientació a la persona | 18 % |
| Longevitat | 6 % |
| Entrenabilitat | 6 % |

I afecta de ple els resultats que més es veuran: **les races del top 10 tenen entre 1 i 3 eixos
dels 8 sense dades**. El golden retriever, que és un exemple perfectament realista per a la
fitxa, en té tres.

**Què cal dissenyar.** Un tractament visual per a «desconegut» que funcioni a totes les barres
d'eix: `2c` (targeta d'eixos derivats), `4a` (barres de les files de resultat) i `1a`, `1b`,
`3a` (els tres eixos destacats del rànquing). Idealment també una manera de dir-ho en text a la
targeta «A tenir en compte» de `2c`.

El sistema ja té vocabulari per a l'absència — la franja lateral `rgba(36,26,22,.15)` per a
«no iniciat» — o sigui que hi hauria d'encaixar sense inventar res nou. La decisió és teva:
barra buida amb contorn, tramat, valor en gris amb un guionet en comptes de xifra… El que sigui
coherent amb la resta.

---

## C. Replantejament: el percentatge com a titular

Hem calculat el rànquing real sobre les 631 races i els sis trastorns. Els números surten així:

| | Rang entre els sis trastorns |
|---|---|
| Puntuació mínima | **40,6 – 44,0 %** |
| Mitjana | **58,9 – 62,8 %** |
| Puntuació màxima | **75,1 – 79,6 %** |

**Cap raça no arriba al 80 %, i la meitat central del catàleg cau entre el 54 % i el 68 %.**

Això té una conseqüència directa sobre el disseny. La pantalla `1b` posa el percentatge en
serif de 128px com a titular absolut. Un «75 %» a aquesta mida es llegeix com «molt compatible»,
quan en realitat vol dir «el millor que hi ha, i tampoc no gaire». El recorregut real és
d'uns 34–38 punts, no de 100.

Hi ha una segona raó, i és metodològica. La literatura sobre selecció de gossos d'assistència
(Bray et al., 2019) mesura que els instruments d'avaluació de temperament encerten el **85–92 %**
dels gossos que **fracassaran** i només el **62–72 %** dels que **triomfaran**. Serveixen molt
millor per descartar que per triar. La nostra previsualització ho reprodueix: la cua del
rànquing és molt estable entre trastorns, mentre que el cap balla molt.

**El que et demanem** no és una solució concreta sinó que ho tinguis en compte en com es
presenta el resultat. Algunes direccions possibles, per si ajuden:

- Acompanyar el percentatge de la **posició** (`#3 de 631`), que informa més que la xifra sola.
- Fer que l'escala visual de les barres i el percentatge reflecteixi el **recorregut real**
  (40–80) en comptes de 0–100.
- Donar pes de debò a la cua i al motiu del descart, que és on el model és fiable.
- Un peu o un microcopy que digui què vol dir la xifra sense espantar.

La decisió és teva. Només volem que el disseny no vengui el primer resultat com una recomanació
ferma, perquè les dades no ho sostenen.

---

## D. Dades reals per substituir els exemples

El handoff diu que els valors numèrics són dades d'exemple. Aquí tens els reals, per si vols
que la maqueta sigui fidel.

### Perfil de pesos del TEA (el que fa servir `4a` d'exemple)

| Eix | Pes | Direcció |
|---|---|---|
| Sociabilitat | 25 % | com més alt, millor |
| Orientació a la persona | 20 % | com més alt, millor |
| Calma | 15 % | com més alt, millor |
| Energia | 12 % | com més alt, millor |
| Entrenabilitat | 10 % | com més alt, millor |
| **Alerta** | 10 % | **com més baix, millor** |
| Tolerància a entorns | 8 % | com més alt, millor |
| **Longevitat** | **10 % fix** | com més alt, millor |

Els set primers sumen 100 entre ells i es reescalen al 90 % per deixar lloc a la longevitat.
Fixa't que **`Alerta` va en negatiu**: el disseny hauria de poder indicar que en aquell eix
interessa un valor baix, perquè si no, una barra curta sembla un defecte quan és una virtut.

### Rànquing real del TEA

```
 1.  75,1 %   Bohemian Shepherd            22 kg   13 anys    1 eix sense dades
 2.  75,0 %   American Pit Bull Terrier    21 kg   14 anys    2 eixos sense dades
 3.  74,2 %   Redbone Coonhound            26 kg   13,5 anys  3 eixos sense dades
 4.  74,0 %   Pointer                      27 kg   14,5 anys  1 eix sense dades
 5.  73,9 %   Brittanydoodle               22 kg   13,5 anys  3 eixos sense dades
 …
     41,5 %   Saarloos Wolfdog             36 kg
```

### Fitxa de raça per a `2c` — golden retriever, dades reals

Recomanem aquesta raça per a la maqueta: és reconeixible, queda en una posició realista i té
**tres eixos sense dades**, o sigui que obliga el disseny a resoldre el punt B.

```
Golden Retriever · grup Sporting · 30 kg · 11 anys
Compatibilitat amb TEA: 68,7 %  ·  posició #67 de 631

Temperament (6 termes):
  amigable · intel·ligent · entregat · segur de si mateix · lleial · disposat a complaure

Eixos derivats:
  Entrenabilitat            8,5
  Sociabilitat              9,0
  Tolerància a entorns      9,0
  Orientació a la persona   6,5
  Longevitat                6,0
  Energia                   — sense dades
  Calma                     — sense dades
  Alerta                    — sense dades
```

---

## Què NO canvia

Perquè quedi clar l'abast: **tota la resta del handoff es manté**. Els design tokens, la
tipografia, l'escala d'espaiat, els radis, la franja lateral de 6px, les barres de progrés, el
to del contingut, el rol únic d'entrenadora, l'exclusió de la vista de família d'acollida i
totes les pantalles de tracking (`2d`, `2e`, `5a`, `5b`, `5c`, `6a`, `6b`, `6c`) queden igual.

Les pantalles afectades són **`2b`, `2c`, `4a`** i, per al punt C, les tres direccions de
rànquing **`1a`, `1b`, `3a`**.

---

## Resum en una llista

- [ ] `2b` — sis targetes de trastorn, fora el TOC, graella reorganitzada
- [ ] `4a` — fora el xip TOC; fora `Mida 10 %` dels pesos; afegir `Longevitat 10 %` marcada com a fixa; separar visualment el filtre de pes màxim
- [ ] `2c` — substituir `Manteniment` per `Tolerància a entorns`; afegir `Longevitat`; xips de temperament en català; xifres del diccionari plausibles
- [ ] **Tot el sistema** — dissenyar l'estat «sense dades» per a les barres d'eix
- [ ] `1a`/`1b`/`3a` — replantejar el titular del percentatge amb el recorregut real (41–80 %)
- [ ] Actualitzar el `README.md` del handoff i afegir una línia al registre de versions
