/**
 * Punt de tall actual segons l'amplada de la finestra.
 *
 * El handoff dissenya el web a 1180px de contingut. Per sota de 900px el panell
 * lateral passa a sobre del contingut; per sota de 640px es fa servir directament
 * la variant mòbil.
 */
import { useWindowDimensions } from 'react-native';
import { trencament } from './tokens.ts';

export type Format = 'mobil' | 'compacte' | 'ample';

export function useTrencament(): {
  format: Format;
  esMobil: boolean;
  lateralASobre: boolean;
  amplada: number;
} {
  const { width } = useWindowDimensions();

  const format: Format =
    width < trencament.mobil ? 'mobil'
      : width < trencament.lateral ? 'compacte'
        : 'ample';

  return {
    format,
    esMobil: format === 'mobil',
    // Tant a mòbil com al format compacte el panell lateral deixa de ser lateral.
    lateralASobre: format !== 'ample',
    amplada: width,
  };
}
