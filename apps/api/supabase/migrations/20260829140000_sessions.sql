-- Sessions d'ensinistrament.
--
-- Tanca el bucle que descriu el §6: consultar l'exercici, practicar-lo i
-- registrar-lo. Cada sessió pertany a un gos i, opcionalment, a un exercici del
-- catàleg.

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  gos_id uuid not null references public.gossos (id) on delete cascade,

  -- Identificador d'exercici del catàleg («e1-1»). No és una clau forana perquè
  -- el catàleg és contingut estàtic generat des de docs/exercicis, no una taula.
  -- Es guarda també el nom perquè la sessió es pugui llegir encara que l'exercici
  -- es reanomeni o desaparegui d'una versió futura del catàleg.
  exercici_id text,
  exercici_nom text,

  data timestamptz not null default now(),
  duracio_segons integer not null default 0 check (duracio_segons >= 0),

  -- Valoració global de la sessió, d'1 a 5, com el selector «Com ha anat».
  valoracio integer check (valoracio between 1 and 5),

  repeticions_correctes integer not null default 0 check (repeticions_correctes >= 0),
  intents_totals integer not null default 0 check (intents_totals >= 0),

  -- No es poden encertar més repeticions que intents.
  constraint sessions_repeticions_coherents
    check (repeticions_correctes <= intents_totals),

  nota text not null default '',
  creat_el timestamptz not null default now()
);

comment on table public.sessions is
  'Sessions d''ensinistrament registrades per l''entrenador.';

create index if not exists sessions_gos_idx on public.sessions (gos_id, data desc);
create index if not exists sessions_entrenador_idx on public.sessions (entrenador_id, data desc);

alter table public.sessions enable row level security;

-- Les polítiques comproven dues coses: que la fila sigui de l'entrenador i que
-- el gos també ho sigui. Sense la segona, algú amb l'identificador d'un gos aliè
-- hi podria registrar sessions.
create policy "Cada entrenador veu les seves sessions"
  on public.sessions for select
  using (auth.uid() = entrenador_id);

create policy "Cada entrenador registra sessions dels seus gossos"
  on public.sessions for insert
  with check (
    auth.uid() = entrenador_id
    and exists (
      select 1 from public.gossos g
      where g.id = gos_id and g.entrenador_id = auth.uid()
    )
  );

create policy "Cada entrenador modifica les seves sessions"
  on public.sessions for update
  using (auth.uid() = entrenador_id)
  with check (auth.uid() = entrenador_id);

create policy "Cada entrenador esborra les seves sessions"
  on public.sessions for delete
  using (auth.uid() = entrenador_id);
