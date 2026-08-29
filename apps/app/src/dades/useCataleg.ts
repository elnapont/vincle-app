/**
 * Càrrega del catàleg de races amb els seus estats.
 *
 * Les tres pantalles de matching el necessiten, i totes tres han de tractar igual
 * els tres casos: carregant, llest i error. El cas «llest amb còpia de la cache»
 * no és un error — vol dir que l'API externa ha fallat però tenim el catàleg
 * d'abans, i la pantalla ho ha d'anunciar sense deixar de funcionar (§5c).
 */

import { useCallback, useEffect, useState } from 'react';
import { carregaCataleg, type CatalegRaces } from './races.ts';

export type EstatCataleg =
  | { fase: 'carregant' }
  | { fase: 'llest'; cataleg: CatalegRaces }
  | { fase: 'error'; missatge: string };

export function useCataleg(): { estat: EstatCataleg; reintenta: () => void } {
  const [estat, setEstat] = useState<EstatCataleg>({ fase: 'carregant' });
  const [intent, setIntent] = useState(0);

  useEffect(() => {
    // Si la pantalla es tanca mentre la petició vola, no s'ha d'actualitzar
    // l'estat d'un component que ja no hi és.
    let viu = true;

    carregaCataleg()
      .then((cataleg) => { if (viu) setEstat({ fase: 'llest', cataleg }); })
      .catch((error: unknown) => {
        if (!viu) return;
        setEstat({
          fase: 'error',
          missatge: error instanceof Error ? error.message : 'Error desconegut',
        });
      });

    return () => { viu = false; };
  }, [intent]);

  // L'estat de càrrega es posa aquí i no dins de l'efecte: fer-ho a l'efecte
  // provoca un dibuix de més i React ho desaconsella.
  const reintenta = useCallback(() => {
    setEstat({ fase: 'carregant' });
    setIntent((n) => n + 1);
  }, []);
  return { estat, reintenta };
}
