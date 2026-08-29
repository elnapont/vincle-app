-- Gossos en seguiment.
--
-- Primera taula de dades pròpies del projecte: fins ara només hi havia la cache
-- del catàleg extern. A diferència d'aquella, aquí hi ha dades que pertanyen a
-- algú, així que cada fila va lligada a l'entrenador que la crea i les polítiques
-- d'accés ho fan complir a la base de dades i no a l'aplicació.

create table if not exists public.gossos (
  id uuid primary key default gen_random_uuid(),

  -- Propietari de la fila. Per defecte, qui fa la inserció.
  entrenador_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  nom text not null check (length(trim(nom)) > 0),

  -- Raça de referència del catàleg de The Dog API. És opcional: un mestís pot no
  -- tenir-ne. Es guarda també el nom perquè la fitxa es pugui llegir encara que
  -- la raça desaparegui del catàleg extern.
  breed_id text,
  breed_nom text,

  data_naixement date not null check (data_naixement <= current_date),

  estat text not null default 'avaluacio'
    check (estat in ('ensinistrament', 'avaluacio', 'assignat')),

  familia_acollida text,
  foto_url text,

  creat_el timestamptz not null default now()
);

comment on table public.gossos is
  'Gossos en seguiment d''ensinistrament, un per entrenador.';
comment on column public.gossos.breed_nom is
  'Nom de la raça en el moment de crear el gos, per no dependre del catàleg extern.';

create index if not exists gossos_entrenador_idx on public.gossos (entrenador_id);

-- A diferència del catàleg de races, que és públic, aquí cada entrenador només ha
-- de veure els seus gossos. Sense aquestes polítiques, la clau anònima de
-- l'aplicació donaria accés a les files de tothom.
alter table public.gossos enable row level security;

create policy "Cada entrenador veu els seus gossos"
  on public.gossos for select
  using (auth.uid() = entrenador_id);

create policy "Cada entrenador crea els seus gossos"
  on public.gossos for insert
  with check (auth.uid() = entrenador_id);

create policy "Cada entrenador modifica els seus gossos"
  on public.gossos for update
  using (auth.uid() = entrenador_id)
  with check (auth.uid() = entrenador_id);

create policy "Cada entrenador esborra els seus gossos"
  on public.gossos for delete
  using (auth.uid() = entrenador_id);
