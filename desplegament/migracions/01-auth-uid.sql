-- Reemplaça `auth.uid()` i `auth.role()` per una versió que llegeixi el
-- testimoni tal com el desa PostgREST 16.
--
-- Les crea GoTrue amb les seves pròpies migracions, i per això aquest fitxer no
-- pot anar a la inicialització de Postgres: allà encara no existeixen, i crear-
-- les abans li barraria el pas —GoTrue no en seria l'amo i no les podria
-- reemplaçar.
--
-- La versió de GoTrue llegeix `request.jwt.claim.sub`, que és on PostgREST
-- deixava cada reclamació per separat. Des de la versió 12 les deixa totes
-- juntes en un JSON a `request.jwt.claims`, i amb la definició antiga
-- `auth.uid()` tornaria NUL: cap política RLS de Vincle deixaria veure res.
--
-- Es miren els dos llocs perquè el fitxer no depengui de la versió de PostgREST.

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )
$$;

grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;
