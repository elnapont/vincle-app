#!/bin/sh
#
# Aplica les migracions de `apps/api/supabase/migrations` una sola vegada.
#
# Existeix per dues raons que no es poden resoldre deixant els fitxers a la
# inicialització de Postgres:
#
#   1. Les taules referencien `auth.users`, que no existeix fins que GoTrue no ha
#      passat les seves migracions. Cal esperar-lo.
#   2. Les migracions **no són reidempotents**: les taules i els índexs porten
#      `if not exists`, però `create policy` no en té, i tornar-les a passar
#      petaria. Per això es porta el compte de les que ja s'han aplicat.
#
# En local això ho fa `supabase db reset`, que aquí no hi és.

set -eu

espera_auth() {
  echo 'Esperant que GoTrue creï l esquema auth...'
  n=0
  while [ $n -lt 60 ]; do
    n=$((n + 1))
    if psql -tAqc 'select 1 from auth.users limit 1' >/dev/null 2>&1; then
      echo 'auth.users ja hi és.'
      return 0
    fi
    sleep 2
  done
  echo 'auth.users no ha aparegut en dos minuts. Mira els registres del servei auth.' >&2
  return 1
}

espera_auth

psql -v ON_ERROR_STOP=1 -qc '
  create table if not exists public.migracions_aplicades (
    fitxer text primary key,
    moment timestamptz not null default now()
  )'

# Primer les correccions pròpies del desplegament, després les de l'aplicació.
for fitxer in /correccions/*.sql /migracions/*.sql; do
  nom=$(basename "$fitxer")

  if [ "$(psql -tAqc "select count(*) from public.migracions_aplicades where fitxer = '$nom'")" != '0' ]; then
    echo "  ja aplicada  $nom"
    continue
  fi

  echo "  aplicant     $nom"
  # Cada migració va dins d'una transacció: si peta a la meitat, no queda a
  # mitges ni s'apunta com a feta.
  psql -v ON_ERROR_STOP=1 --single-transaction -qf "$fitxer"
  psql -v ON_ERROR_STOP=1 -qc \
    "insert into public.migracions_aplicades (fitxer) values ('$nom')"
done

echo 'Migracions al dia.'
