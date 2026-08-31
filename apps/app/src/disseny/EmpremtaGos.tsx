/**
 * Empremta dins d'un cercle, per als estats en què encara no hi ha cap gos.
 *
 * El handoff demana per a la llista buida un «marcador de 76px» i no en diu res
 * més, així que fins ara era literalment un cercle gris. Dibuixar-hi alguna cosa
 * és una **decisió de producte**, presa per la responsable, no del paquet de
 * disseny.
 *
 * És una empremta i no un gos perquè un cap de gos, a 76px i en silueta plana,
 * no s'acaba de llegir: es queda en una taca amb orelles. L'empremta és
 * inconfusible a qualsevol mida i encaixa amb un sistema que no té cap icona
 * dibuixada, perquè no pretén ser-ne una: és una forma, com les altres formes
 * geomètriques del producte.
 *
 * Va en `react-native-svg` i no com a fitxer d'imatge perquè així pren els colors
 * dels tokens, es veu nítida a qualsevol densitat de pantalla i el repositori no
 * ha de guardar cap binari —el handoff diu explícitament que no n'hi ha cap.
 */

import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { color } from './tokens.ts';

/** El mateix to que fan servir els marcadors d'imatge de `FotoRaca`. */
const FONS = '#e6ddd2';

export function EmpremtaGos({ mida = 76 }: { mida?: number }) {
  return (
    <Svg
      width={mida}
      height={mida}
      viewBox="0 0 100 100"
      // És decoració: el titular i l'explicació de sota ja diuen què passa, i
      // repetir-ho aquí només faria que un lector de pantalla ho digués dues
      // vegades.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle cx={50} cy={50} r={50} fill={FONS} />

      {/*
        L'opacitat va al grup i no a cada forma. Amb l'opacitat per forma, els
        llocs on els dits toquen el coixinet es veuen més foscos i la silueta
        deixa de ser una de sola.
      */}
      <G
        fill={color.granat}
        opacity={0.5}
        transform="translate(50 51) scale(0.88) rotate(-4) translate(-50 -50)"
      >
        <Ellipse cx={30} cy={43} rx={7.4} ry={9.8} transform="rotate(-22 30 43)" />
        <Ellipse cx={43} cy={33} rx={7.9} ry={10.8} transform="rotate(-8 43 33)" />
        <Ellipse cx={57} cy={33} rx={7.9} ry={10.8} transform="rotate(8 57 33)" />
        <Ellipse cx={70} cy={43} rx={7.4} ry={9.8} transform="rotate(22 70 43)" />
        <Path
          d="M50 51
             C61 51 73 60 73 69.5
             C73 78.5 64 82 56.5 79.5
             C52 78 48 78 43.5 79.5
             C36 82 27 78.5 27 69.5
             C27 60 39 51 50 51 Z"
        />
      </G>
    </Svg>
  );
}
