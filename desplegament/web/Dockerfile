# Imatge de l'aplicació: construeix l'export web d'Expo i el serveix amb nginx.
#
# El context de construcció és **l'arrel del repositori**, no aquesta carpeta:
# `apps/app` depèn de `packages/shared-types` i `packages/matching` per
# workspaces, i sense l'arrel no es podrien resoldre.

# -----------------------------------------------------------------------------
# 1. Construcció
# -----------------------------------------------------------------------------
FROM node:22-alpine AS construccio

WORKDIR /repo

# Primer només els manifests. Així la capa de dependències només es torna a fer
# quan canvia un `package.json`, i no cada cop que es toca una línia de codi.
COPY package.json package-lock.json ./
COPY apps/app/package.json apps/app/
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/matching/package.json packages/matching/
RUN npm ci

COPY . .

# Expo resol les `EXPO_PUBLIC_*` **en construir**, no en executar: queden cuites
# dins del JavaScript. Per això són arguments de construcció i no variables del
# contenidor, i per això canviar de domini demana refer la imatge.
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY

# Que no arrenqui amb una configuració a mitges: si falta l'URL o la clau, la
# imatge sortiria apuntant a `127.0.0.1`, que al servidor no és enlloc.
RUN test -n "$EXPO_PUBLIC_SUPABASE_URL" \
      || (echo 'Falta EXPO_PUBLIC_SUPABASE_URL' >&2; exit 1) \
 && test -n "$EXPO_PUBLIC_SUPABASE_ANON_KEY" \
      || (echo 'Falta EXPO_PUBLIC_SUPABASE_ANON_KEY' >&2; exit 1)

WORKDIR /repo/apps/app
RUN npx expo export --platform web --output-dir /aplicacio

# -----------------------------------------------------------------------------
# 2. Servei
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine

COPY --from=construccio /aplicacio /usr/share/nginx/html
COPY desplegament/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY desplegament/web/capcaleres-proxy.conf /etc/nginx/capcaleres-proxy.conf

EXPOSE 80
