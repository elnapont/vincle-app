import type { PerfilTrastorn, Trastorn } from '@vincle/shared-types';
import { PERFILS } from './dades/perfils.ts';

/** Perfil d'un trastorn. Llança si no hi és: seria un error de dades, no d'usuari. */
export function perfilDe(trastorn: Trastorn): PerfilTrastorn {
  const perfil = PERFILS.find((p) => p.trastorn === trastorn);
  if (!perfil) throw new Error(`No hi ha perfil per al trastorn «${trastorn}».`);
  return perfil;
}
