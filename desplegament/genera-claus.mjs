/**
 * Genera el secret JWT i les dues claus d'API que demana el desplegament.
 *
 *   node desplegament/genera-claus.mjs
 *
 * A Supabase allotjat, aquestes claus les dona el tauler. En un servidor propi
 * no les dona ningú: són testimonis JWT signats amb el secret del servidor, i
 * s'han de fabricar. La `anon` viatja al navegador i és pública; la
 * `service_role` **es queda al servidor** —salta totes les polítiques RLS— i no
 * ha d'anar mai a la imatge de l'aplicació ni al repositori.
 *
 * Sense dependències: HMAC-SHA256 és a la biblioteca estàndard de Node.
 */

import { createHmac, randomBytes } from 'node:crypto';

const base64url = (dades) =>
  Buffer.from(dades).toString('base64')
    .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

function signa(carrega, secret) {
  const cap = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const cos = base64url(JSON.stringify(carrega));
  const firma = createHmac('sha256', secret).update(`${cap}.${cos}`).digest('base64')
    .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `${cap}.${cos}.${firma}`;
}

// 40 anys: aquestes claus identifiquen el projecte, no una sessió. Si caduquessin
// aviat, l'aplicació deixaria de funcionar un dia qualsevol sense que ningú
// hagués tocat res.
const ara = Math.floor(Date.now() / 1000);
const caducitat = ara + 60 * 60 * 24 * 365 * 40;

const secret = randomBytes(32).toString('hex');
const clau = (rol) => signa({ role: rol, iss: 'vincle', iat: ara, exp: caducitat }, secret);

console.log(`# Enganxa-ho al fitxer desplegament/.env
POSTGRES_PASSWORD=${randomBytes(18).toString('base64url')}
JWT_SECRET=${secret}
ANON_KEY=${clau('anon')}
SERVICE_ROLE_KEY=${clau('service_role')}`);
