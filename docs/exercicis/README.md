# Catàleg d'exercicis

Contingut de referència del seguiment (§6.1 del `CLAUDE.md`): **catàleg fix i curat**,
escrit i validat per una persona a partir de fonts fiables. L'aplicació el consulta;
l'entrenadora no en crea de nous a la v1.

Hi ha **19 exercicis en cinc blocs** (3 · 5 · 4 · 3 · 4), un fitxer per exercici,
amb el nom `bloc-ordre.md`.

## Com omplir-ho

Cada fitxer té dues parts. Al capdamunt, entre dues línies de `---`, les dades:

```
bloc: 1
ordre: 1
nom: Clicker
sessions: 3-4
frequencia: diaria
dies: 6
minuts:
```

**La recomanació de pràctica** admet les dues formes que té el contingut real:

| El que diu el paper | Com s'escriu |
|---|---|
| «3-4 sessions diàries durant 6 dies» | `sessions: 3-4` · `frequencia: diaria` · `dies: 6` |
| «15 sessions de 20 minuts durant 3 dies» | `sessions: 15` · `minuts: 20` · `frequencia: total` · `dies: 3` |
| «1 sessió diària», sense final | `sessions: 1` · `frequencia: diaria` · `dies:` en blanc |
| «Fins que el cadell canvia les dents» | S'escriu la frase sencera a `sessions` |

`sessions` accepta un número, un rang o **una frase**. Si el que hi poses no són
xifres, es guarda tal qual com a recomanació qualitativa: hi ha exercicis que no
tenen cap nombre de sessions i inventar-n'hi un seria pitjor.

`frequencia` és **`diaria`** si les sessions són per dia, o **`total`** si són el
total repartit pel període.

`minuts` i `dies` són **opcionals**: si la recomanació no diu quant dura cada
sessió, o si la pràctica no té final marcat, es deixen en blanc.

A sota, dues seccions:

- **`## Explicació`** — l'exercici explicat, amb reforç positiu. **Prosa seguida**,
  no cal partir-ho en passos numerats.
- **`## Nota`** — opcional. Adaptacions o alternatives, com ara que el clicker es
  pot substituir per paraules o carícies. Si l'exercici no en té, esborra la secció.

Els comentaris `<!-- ... -->` són ajudes i no compten com a contingut: es poden
deixar o esborrar.

## Els blocs

`blocs.md` porta el nom i la descripció dels cinc. La descripció surt a la pantalla
del catàleg, sota el nom del bloc.

## Sense font ni dificultat

El model no en té, i és deliberat. Aquest contingut **no ve d'un manual extern**:
l'ha preparat la responsable del projecte a partir de la seva formació, i generar
un pla d'ensinistrament per a gossos de teràpia forma part del marc pràctic del
treball de recerca. Citar-ne una font seria atribuir a algú altre una feina que és
del treball.

Tampoc no hi ha **criteri d'assoliment**: no es té encara i no s'ha volgut inventar
un criteri comptable que ningú no ha decidit. Quan hi sigui, s'afegirà.

## Generar-ho

```
npm run exercicis:genera
```

Llegeix els fitxers, els valida i escriu `apps/app/src/dades/exercicis.ts`, que és
el que fa servir l'aplicació. **Amb errors no escriu res**: val més quedar-se amb la
versió d'abans que generar-ne una d'incompleta.

Cal tornar-lo a executar cada vegada que es toqui un fitxer d'aquesta carpeta.

## Les fites, per ara buides

El model preveu que un exercici s'associï a una o més fites, però el llistat de fites
encara és un pendent del §9. El camp es genera buit i s'omplirà després **sense haver
de tocar cap d'aquests fitxers**.
