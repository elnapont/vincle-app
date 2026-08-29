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
ordre: 2
nom: Crida amb distraccions moderades
dificultat: intermedia
sessions: 15
minuts: 20
dies: 3
font: Manual X, pàg. 42
```

`dificultat` només accepta **`inicial`**, **`intermedia`** o **`avancada`**, sense accents.

Les tres xifres de la recomanació es llegeixen com «**15 sessions de 20 minuts durant
3 dies**». Van separades i no com a text perquè el seguiment hi pugui comparar el que
s'ha fet de debò.

A sota, tres seccions:

- **`## Objectiu`** — què s'ha d'aconseguir, en una o dues frases.
- **`## Passos`** — un pas per cada `###`. El número del títol és opcional. Cada pas
  necessita títol i descripció, i tot ha d'anar amb **reforç positiu**.
- **`## Criteri d'assoliment`** — com se sap que el gos l'ha assolit. Ha de ser
  observable i comptable, perquè el seguiment el pugui fer servir.

Els comentaris `<!-- ... -->` són ajudes: es poden esborrar o deixar, no molesten.

## Els blocs

`blocs.md` porta el nom i la descripció dels cinc. La descripció surt a la pantalla
del catàleg, sota el nom del bloc.

## La font és obligatòria

El §6.1 exigeix que el contingut d'ensinistrament el curi i el validi una persona i
que **la font quedi documentada**. Un exercici sense font no es genera: l'script
s'atura i diu quin fitxer li falta.

No és una formalitat. És contingut que algú aplicarà a un gos real, i la memòria del
treball ha de poder dir d'on surt cada cosa.

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
