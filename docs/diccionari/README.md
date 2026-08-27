# Diccionari de traducció — plantilla i dades d'origen

Aquesta carpeta conté la **plantilla del diccionari de traducció** de la §5.2 del `CLAUDE.md`:
l'artefacte metodològic propi del projecte que converteix les paraules del camp `temperament`
de The Dog API en **eixos puntuats** que després alimenten el matching.

Els fitxers d'aquesta carpeta els genera `scripts/extreu-termes.ts` (tasca §5.3). És una tasca
**única de preparació de dades**: l'aplicació en marxa no torna a extreure res, només consulta
el diccionari ja omplert.

## Com regenerar-ho

```
DOG_API_KEY=el_teu_token node --experimental-strip-types scripts/extreu-termes.ts
```

El token **no** es guarda al repositori. Passa'l per variable d'entorn o posa'l a un `.env`
local (ja ignorat pel Git).

> Atenció: tornar a executar l'script **sobreescriu** `termes-temperament.csv`,
> `termes-breed-group.csv` i `termes-bred-for.csv`. Si ja hi has omplert les columnes `eix` i
> `puntuacio`, fes-ne còpia abans, o treballa sobre una còpia al full de càlcul.
> `traduccions-ca.csv` no es toca mai: és d'entrada, no de sortida.

## Fitxers

| Fitxer | Què és |
|---|---|
| `termes-temperament.csv` | **La plantilla principal.** 49 termes únics de `temperament`, ordenats per freqüència. Columnes `eix` i `puntuacio` buides per omplir. |
| `termes-breed-group.csv` | 27 valors únics de `breed_group`, amb una proposta d'agrupació canònica. |
| `termes-bred-for.csv` | Buit a propòsit: el camp `bred_for` arriba sense dades (vegeu «Troballes»). Es conserva com a evidència de la comprovació. |
| `eixos.csv` | Llista tancada d'eixos, per fer validació de dades al full de càlcul. |
| `traduccions-ca.csv` | Fitxer **d'entrada**: traduccions al català. L'script el llegeix i n'omple la columna `terme_ca`. Edita'l aquí si vols canviar una traducció. |
| `perfils-trastorns.csv` | **Pendent d'omplir.** Pesos i ideals de cada eix per a cadascun dels 7 trastorns (§5.2.3 del CLAUDE.md). |

## Perfils de pesos per trastorn

`perfils-trastorns.csv` té **42 files**: els 6 trastorns × els 7 eixos del diccionari. El TOC es
va retirar de la llista per manca de vinculació documentada amb l'assistència amb gossos.

El fitxer porta **dos jocs de columnes en paral·lel**:

| Columnes | Qui | Ús |
|---|---|---|
| `pes`, `direccio`, `justificacio`, `font` | L'equip | **Autoritatives.** Són les que farà servir el motor |
| `pes_proposta`, `direccio_proposta`, `justificacio_proposta`, `font_proposta` | Proposta a partir de la literatura | Només per **contrastar**; no s'usen en producció |

Les referències de la columna `font_proposta` estan desenvolupades a **`fonts.md`**, que també
explica fins on arriba (i fins on no) l'evidència disponible.

De cada fila autoritativa cal omplir dues columnes numèriques, i idealment les altres dues:

- **`pes`** (0–100) — quant importa aquell eix per a aquell trastorn. **Els 7 pesos d'un mateix
  trastorn han de sumar exactament 100.**
- **`direccio`** — escriu `suma` si per a aquell trastorn convé que l'eix sigui **alt**, o
  `resta` si convé que sigui **baix**.
- **`justificacio`** — per què. El treball ha de poder defensar cada número.
- **`font`** — la referència que ho sustenta.

**Per què cal la direcció i no només el pes.** No tots els eixos són «com més alt, millor».
Per al TDAH interessa un gos d'energia continguda: si només hi hagués pes, un gos hiperactiu
sortiria premiat per tenir l'energia alta.

**Compte amb `resta` a `energia` i `alerta`.** En aquests dos eixos cap raça no baixa de 5,0,
perquè el diccionari no té cap terme que hi puntuï baix. Posar-hi `resta` no premia les races
tranquil·les: premia les que **no tenen cap terme** d'aquell eix, o sigui aquelles de les quals
no en sabem res. Si per a un trastorn convé energia baixa, val més **donar poc pes a `energia`
amb `suma`** que invertir-la. El validador t'ho avisa.

Per comprovar-ho:

```
node --experimental-strip-types scripts/valida-perfils.ts
node --experimental-strip-types scripts/valida-perfils.ts --normalitza   # arregla el format
```

Comprova que hi siguin els 7 trastorns amb els 7 eixos, que els pesos sumin 100, que la
direcció sigui `suma` o `resta`, i avisa de les files sense justificació o sense font.

> **La mida no hi és, i és a posta.** No depèn del trastorn sinó de l'entorn on ha de viure i
> treballar el gos, així que actua només com a **filtre de pes màxim** i no entra a la fórmula
> de compatibilitat. Si hi afegeixes una fila amb l'eix `mida`, el validador la rebutjarà.

## Estat actual: diccionari construït

`termes-temperament.csv` **ja està omplert**: 49 termes, 49 assignacions a eix (n'hi ha una de
desdoblada) i un terme ignorat. Els eixos actius són **set**; `reactivitat` i `manteniment` es
van retirar perquè cap terme del vocabulari de l'API hi queia i totes les races hi sortien al
neutre.

Per comprovar que segueix sent vàlid després de qualsevol canvi:

```
node --experimental-strip-types scripts/valida-diccionari.ts
node --experimental-strip-types scripts/valida-diccionari.ts --normalitza   # arregla el format
```

Amb `DOG_API_KEY` a l'entorn, a més calcula la distribució de cada eix sobre les 631 races, que
és la manera de veure si un eix separa races o no.

> **Decisió deliberada, no la «corregiu».** El validador avisa que `happy` (sociabilitat),
> `determined` (alerta) i `even-tempered` (calma) estan puntuats exactament a 5, i que un 5
> arrossega la mitjana cap al centre en comptes de no dir res. **Està valorat i es manté així**
> per decisió de la responsable del projecte. L'avís es conserva perquè és informatiu, no un error.

## Com omplir la plantilla

Obre `termes-temperament.csv` amb un full de càlcul i, per a cada terme:

1. **`eix`** — tria'n un de la llista d'`eixos.csv`. Si el terme no aporta res a cap eix,
   deixa'l buit: quedarà ignorat pel matching.
2. **`puntuacio`** — un valor **de 0 a 10** que indica quant puntua aquell terme en aquell eix.
   La puntuació baixa és la manera d'expressar l'efecte «↓» de la taula del `CLAUDE.md`:
   `stubborn` no resta entrenabilitat, sinó que hi puntua baix (per exemple 2).
3. **`notes`** — per justificar decisions dubtoses. Serveix per defensar el criteri al treball.

Un terme només pot apuntar a **un** eix. Si en necessita dos (per exemple `gentle`, que parla
de calma i també de reactivitat), duplica la fila i posa un eix a cadascuna.

L'eix **`mida` no surt a la llista**: és l'únic que es calcula directament de `weight`/`height`
i no es deriva de cap paraula.

## Troballes de l'extracció (9 d'agost de 2026, 631 races)

Coses que no coincideixen amb el que suposava el `CLAUDE.md` §5.1 i que caldrà corregir-hi:

- **`bred_for` arriba buit a les 631 races** (0 % de cobertura). El `CLAUDE.md` el llista com a
  disponible i útil per a «pistes de propòsit i instint». No ho és: no aporta res.
- **`perfect_for`**, un camp que el `CLAUDE.md` no esmenta, també arriba buit a totes.
- El **vocabulari de `temperament` és molt més petit i regular** del previst: només **49 termes
  únics** en 631 races (mitjana de 5,6 termes per raça). Això fa el diccionari perfectament
  abastable a mà, que és una bona notícia.
- La **cua és molt llarga**: 20 termes cobreixen la pràctica totalitat del catàleg i els altres
  29 apareixen 13 vegades o menys (14 d'ells, una sola vegada). Prioritzar per freqüència val
  molt la pena.
- **`breed_group` arriba brut**: 27 valors amb sinònims i variants del mateix grup
  (`scenthound` / `scent hound`, `spitz` / `spitz-type` / `spitz and primitive types`,
  `mixed` / `mixed breed`). Per això la columna `grup_canonic`, que és una **proposta** a revisar.
- Un «terme» no és un terme: `variable depending on ancestry and individual traits` és una frase
  sencera que apareix a la raça *Mongrel*. Es pot deixar sense eix.
- Cobertura de la resta de camps: `temperament`, `description`, `history`, `origin`, `weight`,
  `height` i `image` al 100 %; `life_span` al 94 %.

### El problema dels termes massa comuns

Val la pena tenir-ho present en construir el diccionari i **documentar-ho al treball** com a
limitació metodològica:

| Terme | Races que el contenen |
|---|---|
| `intelligent` | 538 de 631 (85 %) |
| `loyal` | 454 de 631 (72 %) |
| `alert` | 377 de 631 (60 %) |
| `energetic` | 304 de 631 (48 %) |

Un terme present a gairebé totes les races **no distingeix cap raça de cap altra**. Si
`intelligent` puntua alt a entrenabilitat, gairebé totes les races puntuaran alt en aquell eix
i l'eix deixarà de servir per ordenar el rànquing.

**Decisió presa: acceptar-ho i documentar-ho.** Els termes freqüents es queden al diccionari;
el que separa les races són els termes poc habituals que els acompanyen. A la pràctica, dona
als termes gairebé universals una puntuació **moderada** i reserva els extrems per als termes
que sí que discriminen:

| terme | freqüència | eix | puntuació |
|---|---|---|---|
| `intelligent` | 85 % | `entrenabilitat` | 6–7 — present a gairebé tot, no ha de dominar |
| `eager to please` | 7 % | `entrenabilitat` | 10 — aquest sí que separa |
| `independent` | 33 % | `entrenabilitat` | 2 — el contrapès |

Això és una **limitació metodològica** que s'ha d'explicar al treball de recerca.

## Dos paranys en omplir la plantilla

**`calm` no va a `energia`.** Els eixos `energia` i `calma` són diferents i és fàcil
confondre'ls: energia = necessitat d'exercici; calma = estabilitat i capacitat de quedar-se
quiet. Un Border Collie pot ser **alt** en tots dos alhora. Posa cada terme a l'eix del qual
parla directament, no al seu contrari.

**Eixos que una raça no toca.** Si cap terme d'una raça cau en un eix, aquell eix val **5
(neutre)**, no 0. El Labrador Retriever (`friendly, outgoing, energetic, intelligent, gentle,
eager to please`) no diu res sobre alerta, i seria injust puntuar-lo 0 en un eix del qual
l'API simplement no informa. El 5 vol dir «no ho sabem».
