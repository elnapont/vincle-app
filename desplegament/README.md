# Desplegament de Vincle en un servidor propi

Aquesta carpeta munta Vincle sencer —aplicació i backend— en una màquina amb
Docker, per exemple un Debian. És una alternativa a Supabase allotjat, **no un
substitut decidit**: la §2.1 del `CLAUDE.md` tria el pla Free de Supabase, i
aquesta carpeta existeix per poder-ho desplegar en un servidor propi sense
canviar aquella decisió.

## Què s'aixeca, i què no

Només allò que Vincle crida de debò:

| Servei | Imatge | Per què hi és |
|---|---|---|
| `postgres` | `postgres:17-alpine` | Les dades |
| `auth` | `supabase/gotrue` | Entrada amb correu i contrasenya |
| `rest` | `postgrest/postgrest` | L'API de taules que fa servir `supabase-js` |
| `funcions` | `supabase/edge-runtime` | La funció `races` |
| `migracions` | `postgres:17-alpine` | Un sol ús: aplica les migracions i s'atura |
| `web` | construïda aquí | L'aplicació i la passarel·la |

**No** hi ha Storage, ni Realtime, ni Studio, ni Analytics, que la pila oficial
d'autoallotjament sí que porta. Vincle no els crida: mantenir-los només serien
serveis més per vigilar i actualitzar.

Tot passa per un sol punt d'entrada. Com que el navegador demana la pàgina i
l'API **al mateix origen**, no hi ha CORS enlloc i només s'ha de publicar un port.

```
navegador ──▶ web (nginx) ┬── /               l'aplicació, fitxers estàtics
                          ├── /auth/v1/       auth
                          ├── /rest/v1/       rest
                          └── /functions/v1/  funcions
                                   │
                              postgres
```

## Posar-lo en marxa

```sh
cp desplegament/.env.example desplegament/.env

# Les quatre claus. Si el servidor no té Node —i no cal que en tingui—, es
# generen dins d'un contenidor d'un sol ús:
docker run --rm -v "$PWD/desplegament:/d:ro" node:22-alpine node /d/genera-claus.mjs

# Amb Node al servidor, l'equivalent és:
#   node desplegament/genera-claus.mjs

$EDITOR desplegament/.env                 # enganxa-hi les quatre línies,
                                          # més URL_PUBLICA i DOG_API_KEY

docker compose -f desplegament/docker-compose.yml up -d --build
```

L'ordre de dalt s'executa **des de l'arrel del repositori**. No instal·la res: el
contenidor s'esborra tot seguit i l'única petja que deixa és la imatge
descarregada, que de tota manera fa servir la construcció del servei `web`.

`URL_PUBLICA` ha de ser **l'adreça de debò** des d'on es veurà Vincle, amb
esquema i port si en porta. No és cosmètica: se li cou a dins l'aplicació perquè
hi busqui l'API.

Un cop amunt, crear el compte de l'Elna (no hi ha alta d'usuari, §3):

```sh
curl -X POST "$URL_PUBLICA/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"...","password":"...","email_confirm":true}'
```

## Les claus

A Supabase allotjat les dona el tauler. Aquí no les dona ningú: són testimonis
JWT signats amb el secret del servidor i s'han de fabricar, que és el que fa
`genera-claus.mjs`.

- `ANON_KEY` viatja al navegador. És **pública** per disseny: qui pot obrir
  Vincle la pot llegir. Qui la té no pot fer res que les polítiques RLS no
  deixin fer a un visitant sense sessió.
- `SERVICE_ROLE_KEY` **es queda al servidor**. Salta totes les polítiques RLS.
  No ha d'anar mai a la imatge de l'aplicació, ni al repositori, ni a un correu.

## Quan es canvia el codi

```sh
docker compose -f desplegament/docker-compose.yml up -d --build
```

Les migracions noves s'apliquen soles: el servei `migracions` porta el compte de
les que ja ha passat a la taula `public.migracions_aplicades` i només executa les
que falten. Les migracions de Vincle **no són reidempotents** —`create policy` no
admet `if not exists`—, i per això cal portar-ne el compte en comptes de
tornar-les a passar totes.

## Coses que aquest muntatge no resol

Val més dir-les que descobrir-les:

- **No hi ha HTTPS.** El contenidor `web` parla HTTP pel port que digui
  `PORT_PUBLIC`. En un servidor de debò cal posar-hi al davant alguna cosa que
  acabi el TLS —Caddy o nginx amb Let's Encrypt— i apuntar-hi `URL_PUBLICA`.
- **No hi ha còpies de seguretat.** Les dades viuen al volum
  `vincle_dades-postgres`. Cal programar un `pg_dump` i endur-se'l a un altre
  lloc; un volum de Docker al mateix servidor no és una còpia de seguretat.
- **No hi ha servidor de correu.** Per això `GOTRUE_MAILER_AUTOCONFIRM` va a
  `true`: sense correu no es poden enviar confirmacions, i un compte creat a mà
  no podria entrar mai. Com que no hi ha alta d'usuari, no es perd res.
- **Canviar de domini demana refer la imatge web.** Expo resol les variables
  `EXPO_PUBLIC_*` en construir, no en executar, i queden cuites al JavaScript.
- **Les versions van clavades** a `docker-compose.yml`. Actualitzar-les és una
  decisió, no una cosa que hagi de passar sola un dia qualsevol.

## Comprovat

L'stack s'ha aixecat sencer i s'hi ha provat, el 29 d'agost de 2026: alta de
compte i entrada, alta d'un gos amb sessió, que les polítiques RLS tanquin la
taula sense sessió, la funció de races contra The Dog API (631 races), que en
desi la còpia i que la serveixi quan l'API no és a l'abast, i que tornar a
executar les migracions no en repeteixi cap.
