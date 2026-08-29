# Capa d'API de Vincle

Proxy amb cache de The Dog API i, més endavant, la resta de funcions de servidor.
Corre sobre Supabase: en local, dins de contenidors Docker que aixeca la CLI.

## Posar-ho en marxa

Cal tenir **Docker engegat**. La CLI de Supabase ja ve com a dependència del
monorepo, així que no s'ha d'instal·lar res global.

```
cd apps/api
npx supabase start
```

La primera vegada es descarreguen les imatges i triga uns minuts. Quan acaba,
imprimeix les adreces; les que fem servir són:

| | |
|---|---|
| API i funcions | `http://127.0.0.1:54321` |
| Estudi (interfície web) | `http://127.0.0.1:54323` |
| Base de dades | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

L'aplicació ja apunta aquí per defecte: no cal configurar cap variable d'entorn
per treballar en local.

Per aturar-ho, `npx supabase stop`. Les dades es conserven.

## El token de The Dog API

La funció `races` el necessita. Va a `supabase/functions/.env`, que **està
ignorat pel Git**:

```
cp supabase/functions/.env.example supabase/functions/.env
# i posa-hi el token
```

Sense token, la funció encara respon si hi ha una còpia guardada a la cache;
només falla si no n'hi ha cap.

## Usuari de prova

L'stack local arrenca sense cap usuari. Per crear-ne un i poder entrar a
l'aplicació:

```
SERVICE=$(npx supabase status -o json | node -pe "JSON.parse(require('fs').readFileSync(0)).SERVICE_ROLE_KEY")

curl -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" \
  -H "Content-Type: application/json" \
  -d '{"email":"elna@vincle.cat","password":"vincle-local-2026","email_confirm":true}'
```

Aquestes credencials són **només per a desenvolupament local**. L'stack local de
Supabase no és accessible des de fora de l'ordinador i les seves claus són
públiques i idèntiques a totes les instal·lacions.

## Estructura

```
supabase/
  config.toml
  migrations/          esquema de la base de dades
  functions/
    races/             proxy amb cache de The Dog API
      index.ts         la funció
      normalitza.ts    traducció de l'API externa al model intern Breed
```

## Desplegament

Les funcions són **Deno**, no Node. El mateix codi corre a tres llocs sense
canvis: a l'stack local dins d'un contenidor, al pla gratuït de Supabase amb
`npx supabase functions deploy races`, i auto-allotjat amb la imatge pública
`supabase/edge-runtime`. Triar Supabase no tanca la porta a contenidors propis.
