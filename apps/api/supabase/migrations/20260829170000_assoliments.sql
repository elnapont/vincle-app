-- Exercicis donats per assolits manualment.
--
-- El camí calcula l'assoliment comptant sessions contra la pauta recomanada, però
-- hi ha exercicis amb pauta qualitativa —«fins que el cadell canvia les dents»—
-- que no tenen cap xifra contra la qual comparar i s'hi encallarien per sempre.
--
-- També serveix per a la resta: el llindar de sessions és una aproximació, i qui
-- ensinistra pot veure que el gos ho té abans d'arribar-hi. Un assoliment manual
-- preval sobre el recompte.

create table if not exists public.assoliments (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  gos_id uuid not null references public.gossos (id) on delete cascade,

  -- Identificador del catàleg («e1-2»). Com a les sessions, no és clau forana:
  -- el catàleg és contingut estàtic, no una taula.
  exercici_id text not null,

  data_assoliment timestamptz not null default now(),
  -- Per què s'ha donat per assolit, si qui ho fa ho vol deixar escrit.
  nota text not null default '',

  -- Un exercici s'assoleix un sol cop per gos.
  unique (gos_id, exercici_id)
);

comment on table public.assoliments is
  'Exercicis que l''entrenador dona per assolits, per damunt del recompte de sessions.';

create index if not exists assoliments_gos_idx on public.assoliments (gos_id);

alter table public.assoliments enable row level security;

-- Com a les sessions: la fila ha de ser de l'entrenador i el gos també.
create policy "Cada entrenador veu els seus assoliments"
  on public.assoliments for select
  using (auth.uid() = entrenador_id);

create policy "Cada entrenador marca assoliments dels seus gossos"
  on public.assoliments for insert
  with check (
    auth.uid() = entrenador_id
    and exists (
      select 1 from public.gossos g
      where g.id = gos_id and g.entrenador_id = auth.uid()
    )
  );

create policy "Cada entrenador desfà els seus assoliments"
  on public.assoliments for delete
  using (auth.uid() = entrenador_id);
