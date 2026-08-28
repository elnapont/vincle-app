/**
 * Mòdul de matching: derivació d'eixos i puntuació de compatibilitat.
 *
 * Viu en un paquet propi i no dins de la capa d'API perquè el §3 del CLAUDE.md
 * demana que el matching sigui «un mòdul propi, aïllat i testejable». La funció
 * de servidor només n'és una closca prima.
 */
export * from './motor.ts';
export { DICCIONARI, TRADUCCIO_TERME } from './dades/diccionari.ts';
export { PERFILS } from './dades/perfils.ts';
export { perfilDe } from './perfils.ts';
