-- Rols i esquema `auth` que Supabase dona fet i que, en un servidor propi, cal
-- crear a mà. S'executa un sol cop, quan el volum de dades encara és buit.
--
-- Quatre rols, cadascun amb una feina:
--
--   anon           qui no ha entrat. És el rol amb què PostgREST atén les
--                  peticions sense sessió.
--   authenticated  qui ha entrat. És el que les polítiques RLS deixen operar.
--   service_role   la funció de races, que ha de poder escriure la còpia del
--                  catàleg sense passar per cap política.
--   authenticator  el rol amb què PostgREST es connecta. No pot fer res per si
--                  mateix: només canviar-se per un dels tres de dalt segons el
--                  testimoni que porti la petició.

\set ON_ERROR_STOP on

-- GoTrue en necessita una i les claus primàries de Vincle fan servir
-- `gen_random_uuid()`, que a Postgres 17 ja és de sèrie però pgcrypto reforça.
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- La contrasenya arriba per l'entorn i no escrita aquí. `\getenv` la porta a una
-- variable de psql, i `set_config` la deixa a l'abast del bloc de sota, on cal
-- muntar les ordres com a text.
\getenv contrasenya POSTGRES_PASSWORD
select set_config('vincle.contrasenya', :'contrasenya', false);

-- Els rols es creen amb guarda perquè la imatge de Supabase ja en porta algun.
-- La contrasenya, en canvi, s'assigna sempre: si el rol ja existia, porta la que
-- va posar la imatge i no la nostra, i ni PostgREST ni GoTrue no podrien entrar.
do $$
declare
  contrasenya text := current_setting('vincle.contrasenya');
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;

  if not exists (select from pg_roles where rolname = 'authenticator') then
    create role authenticator noinherit;
  end if;
  execute format('alter role authenticator with login password %L', contrasenya);

  if not exists (select from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin noinherit;
  end if;
  execute format(
    'alter role supabase_auth_admin with login createrole password %L', contrasenya
  );
end
$$;

grant anon, authenticated, service_role to authenticator;

-- GoTrue necessita manar dins del seu esquema: hi crea i hi migra les taules.
create schema if not exists auth authorization supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role;
alter role supabase_auth_admin set search_path = auth;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
