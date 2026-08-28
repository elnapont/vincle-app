-- Cache del catàleg de races de The Dog API.
--
-- El client no crida mai l'API pública (§3 del CLAUDE.md): hi va sempre a través
-- d'aquesta capa, que normalitza les dades al model intern `Breed` i en guarda
-- una còpia. La còpia no és una optimització sinó un requisit de disseny: si la
-- crida externa falla, la pantalla d'error de `5c` ha de poder ensenyar l'última
-- còpia amb la seva data, i mai una llista buida.
--
-- És una sola fila: el catàleg sencer com un document. Són 631 races i unes
-- poques centenes de kB, i no cal consultar-les una per una des de la base de
-- dades — el matching sempre les recorre totes.

create table if not exists public.cataleg_races (
  -- Clau fixa: només hi ha un catàleg. El `check` impedeix que se n'hi colin més.
  id text primary key default 'races' check (id = 'races'),
  races jsonb not null,
  -- Quantes races portava la còpia, per poder-ho ensenyar sense desempaquetar el jsonb.
  total integer not null,
  actualitzat_el timestamptz not null default now()
);

comment on table public.cataleg_races is
  'Còpia normalitzada del catàleg de The Dog API. Serveix de reserva quan l''API externa falla.';

-- El catàleg és públic de lectura: no conté cap dada personal i el necessiten
-- totes les pantalles de races. L'escriptura queda reservada al servidor, que hi
-- accedeix amb la clau de servei i no passa per aquestes polítiques.
alter table public.cataleg_races enable row level security;

create policy "El catàleg es pot llegir sempre"
  on public.cataleg_races for select
  using (true);
