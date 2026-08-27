/**
 * Validació del diccionari de traducció (§5.2 del CLAUDE.md).
 *
 * Comprova que `docs/diccionari/termes-temperament.csv` sigui utilitzable pel motor
 * de matching abans de programar res contra ell. Es pot executar cada cop que la
 * responsable del projecte hi faci canvis.
 *
 * Els fulls de càlcul (Numbers, Excel) exporten CSV amb separadors i salts de línia
 * variables segons la configuració regional, així que el lector és tolerant: detecta
 * el separador i normalitza els salts de línia. Amb `--normalitza` reescriu el fitxer
 * en el format canònic del projecte (coma, LF, BOM UTF-8).
 *
 * Ús:
 *   node --experimental-strip-types scripts/valida-diccionari.ts
 *   node --experimental-strip-types scripts/valida-diccionari.ts --normalitza
 *
 * Si a més hi ha DOG_API_KEY a l'entorn, calcula la distribució real de cada eix
 * sobre les races del catàleg, que és la manera de veure si un eix discrimina o no.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'docs/diccionari';
const FITXER_TERMES = join(DIR, 'termes-temperament.csv');
const FITXER_EIXOS = join(DIR, 'eixos.csv');

/** Valor que pren un eix quan cap terme de la raça hi cau (§5.2). */
const NEUTRE = 5;

// ---------------------------------------------------------------------------
// Lectura tolerant de CSV
// ---------------------------------------------------------------------------

/**
 * Detecta el separador comptant quantes vegades apareix cada candidat a la
 * capçalera. Numbers en català exporta amb `;`, la majoria d'eines amb `,`.
 */
function detectaSeparador(capçalera: string): ';' | ',' | '\t' {
  const candidats = [';', ',', '\t'] as const;
  let millor: ';' | ',' | '\t' = ',';
  let maxim = 0;
  for (const sep of candidats) {
    const n = capçalera.split(sep).length - 1;
    if (n > maxim) { maxim = n; millor = sep; }
  }
  return millor;
}

interface CsvLlegit {
  capçaleres: string[];
  files: string[][];
  separador: string;
  teniaCrlf: boolean;
  teniaBom: boolean;
}

function llegeixCsv(cami: string): CsvLlegit {
  const brut = readFileSync(cami, 'utf8');
  const teniaBom = brut.charCodeAt(0) === 0xfeff;
  const teniaCrlf = brut.includes('\r\n');

  const text = (teniaBom ? brut.slice(1) : brut).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const linies = text.split('\n').filter((l) => l.trim() !== '');

  const separador = detectaSeparador(linies[0]);
  const [capçalera, ...resta] = linies;

  return {
    capçaleres: capçalera.split(separador).map((c) => c.trim()),
    files: resta.map((l) => l.split(separador).map((c) => c.trim())),
    separador,
    teniaCrlf,
    teniaBom,
  };
}

// ---------------------------------------------------------------------------
// Validació
// ---------------------------------------------------------------------------

const problemes: string[] = [];
const avisos: string[] = [];

function problema(msg: string): void { problemes.push(msg); }
function avis(msg: string): void { avisos.push(msg); }

interface Entrada {
  terme: string;
  termeCa: string;
  frequencia: number;
  eix: string;
  puntuacio: number | null;
}

function valida(): { entrades: Entrada[]; eixos: string[]; csv: CsvLlegit } {
  const eixosCsv = llegeixCsv(FITXER_EIXOS);
  const eixos = eixosCsv.files.map((f) => f[0]).filter(Boolean);

  const csv = llegeixCsv(FITXER_TERMES);

  const esperades = ['terme', 'terme_ca', 'frequencia', 'eix', 'puntuacio', 'notes', 'races_exemple'];
  for (const col of esperades) {
    if (!csv.capçaleres.includes(col)) problema(`Falta la columna «${col}» a la capçalera.`);
  }

  const idx = Object.fromEntries(csv.capçaleres.map((c, i) => [c, i]));
  const entrades: Entrada[] = [];
  const vistos = new Map<string, number>();

  csv.files.forEach((fila, i) => {
    const linia = i + 2; // +1 per la capçalera, +1 perquè els humans compten des d'1
    const terme = (fila[idx.terme] ?? '').trim();
    const eix = (fila[idx.eix] ?? '').trim();
    const punt = (fila[idx.puntuacio] ?? '').trim();

    if (!terme) { problema(`Línia ${linia}: fila sense terme.`); return; }

    // Duplicats: dues files amb el mateix terme I el mateix eix són un error;
    // amb eixos diferents és el desdoblament legítim que preveu la §5.2.
    const clau = `${terme}::${eix}`;
    if (vistos.has(clau)) {
      problema(`Línia ${linia}: «${terme}» ja apareix a la línia ${vistos.get(clau)} amb el mateix eix.`);
    }
    vistos.set(clau, linia);

    // Terme sense eix: legítim, vol dir «ignora'l». Però si té puntuació, és un descuit.
    if (!eix) {
      if (punt) problema(`Línia ${linia}: «${terme}» té puntuació (${punt}) però cap eix.`);
      entrades.push({
        terme, termeCa: fila[idx.terme_ca] ?? '', frequencia: Number(fila[idx.frequencia]) || 0,
        eix: '', puntuacio: null,
      });
      return;
    }

    if (!eixos.includes(eix)) {
      problema(`Línia ${linia}: eix «${eix}» desconegut. Valors vàlids: ${eixos.join(', ')}.`);
    }

    if (!punt) {
      problema(`Línia ${linia}: «${terme}» té eix «${eix}» però cap puntuació.`);
    }

    // Numbers pot exportar decimals amb coma; ho acceptem i ho normalitzem.
    const valor = Number(punt.replace(',', '.'));
    if (punt && (!Number.isFinite(valor) || valor < 0 || valor > 10)) {
      problema(`Línia ${linia}: puntuació «${punt}» fora de l'escala 0–10.`);
    }

    entrades.push({
      terme, termeCa: fila[idx.terme_ca] ?? '', frequencia: Number(fila[idx.frequencia]) || 0,
      eix, puntuacio: Number.isFinite(valor) ? valor : null,
    });
  });

  // Un terme puntuat exactament al neutre no és neutre: arrossega la mitjana de
  // l'eix cap al 5 i dilueix els termes que sí que diuen alguna cosa. Sovint és
  // un descuit i el que es volia era deixar la fila sense eix.
  const alNeutre = entrades.filter((e) => e.eix && e.puntuacio === NEUTRE);
  if (alNeutre.length > 0) {
    avis(
      `${alNeutre.length} terme(s) puntuats exactament a ${NEUTRE}: ` +
      alNeutre.map((e) => `«${e.terme}» (${e.eix})`).join(', ') +
      `.\n    Un ${NEUTRE} NO és el mateix que deixar l'eix en blanc: compta a la mitjana i ` +
      `l'arrossega cap al centre.\n    Si el que vols és que el terme no digui res d'aquell eix, deixa la columna «eix» buida.`,
    );
  }

  // Eixos declarats però que cap terme fa servir: quedarien sempre al neutre.
  const usats = new Set(entrades.filter((e) => e.eix).map((e) => e.eix));
  const senseUsar = eixos.filter((e) => !usats.has(e));
  if (senseUsar.length > 0) {
    avis(
      `Eixos declarats a eixos.csv que cap terme fa servir: ${senseUsar.join(', ')}.\n    ` +
      `Totes les races hi tindrien el valor neutre ${NEUTRE}, així que no ordenarien res. ` +
      `Convé treure'ls de la llista d'eixos actius o documentar per què hi són.`,
    );
  }

  return { entrades, eixos, csv };
}

// ---------------------------------------------------------------------------
// Distribució real dels eixos sobre el catàleg (només amb DOG_API_KEY)
// ---------------------------------------------------------------------------

interface RaçaApi { name: string; temperament?: string | null }

async function distribucio(entrades: Entrada[], eixos: string[]): Promise<void> {
  const clau = process.env.DOG_API_KEY;
  if (!clau) {
    console.log('\n(Sense DOG_API_KEY: no es calcula la distribució real dels eixos.)');
    return;
  }

  const races: RaçaApi[] = [];
  for (let pagina = 0; ; pagina += 1) {
    const r = await fetch(`https://api.thedogapi.com/v1/breeds?limit=500&page=${pagina}`, {
      headers: { 'x-api-key': clau },
    });
    const bloc = (await r.json()) as RaçaApi[];
    races.push(...bloc);
    if (bloc.length < 500) break;
  }

  // Índex terme → llista de (eix, puntuació): un terme pot afectar més d'un eix.
  const perTerme = new Map<string, { eix: string; puntuacio: number }[]>();
  for (const e of entrades) {
    if (!e.eix || e.puntuacio === null) continue;
    const llista = perTerme.get(e.terme) ?? [];
    llista.push({ eix: e.eix, puntuacio: e.puntuacio });
    perTerme.set(e.terme, llista);
  }

  // Per a cada raça, mitjana dels termes que cauen a cada eix; neutre si no n'hi ha cap.
  const valorsPerEix = new Map<string, number[]>(eixos.map((e) => [e, []]));
  let ambNeutre = new Map<string, number>(eixos.map((e) => [e, 0]));

  for (const raça of races) {
    const termes = (raça.temperament ?? '')
      .split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

    const acumulat = new Map<string, number[]>();
    for (const t of termes) {
      for (const { eix, puntuacio } of perTerme.get(t) ?? []) {
        acumulat.set(eix, [...(acumulat.get(eix) ?? []), puntuacio]);
      }
    }

    for (const eix of eixos) {
      const vals = acumulat.get(eix);
      if (vals?.length) {
        valorsPerEix.get(eix)!.push(vals.reduce((a, b) => a + b, 0) / vals.length);
      } else {
        valorsPerEix.get(eix)!.push(NEUTRE);
        ambNeutre.set(eix, ambNeutre.get(eix)! + 1);
      }
    }
  }

  console.log(`\nDISTRIBUCIÓ DELS EIXOS sobre ${races.length} races`);
  console.log('  (desviació alta = l\'eix separa races; desviació baixa = no ordena res)\n');
  console.log('  eix                   mín   mitj   màx   desv   races al neutre');

  for (const eix of eixos) {
    const v = valorsPerEix.get(eix)!;
    const mitjana = v.reduce((a, b) => a + b, 0) / v.length;
    const desviacio = Math.sqrt(v.reduce((a, b) => a + (b - mitjana) ** 2, 0) / v.length);
    const neutres = ambNeutre.get(eix)!;
    console.log(
      '  ' + eix.padEnd(20) +
      Math.min(...v).toFixed(1).padStart(5) +
      mitjana.toFixed(1).padStart(7) +
      Math.max(...v).toFixed(1).padStart(6) +
      desviacio.toFixed(2).padStart(7) +
      `   ${neutres} (${Math.round(neutres / races.length * 100)} %)`,
    );
  }
}

// ---------------------------------------------------------------------------
// Normalització del fitxer al format canònic del projecte
// ---------------------------------------------------------------------------

function normalitza(csv: CsvLlegit): void {
  const cel·la = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const linies = [csv.capçaleres, ...csv.files].map((f) => f.map(cel·la).join(','));
  writeFileSync(FITXER_TERMES, '﻿' + linies.join('\n') + '\n', 'utf8');
  console.log(`\nFitxer normalitzat: separador «,», salts LF, BOM UTF-8 → ${FITXER_TERMES}`);
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { entrades, eixos, csv } = valida();

  console.log(`Format detectat: separador «${csv.separador === '\t' ? 'tab' : csv.separador}»` +
    `, salts ${csv.teniaCrlf ? 'CRLF' : 'LF'}, BOM ${csv.teniaBom ? 'sí' : 'no'}`);

  if (csv.separador !== ',' || csv.teniaCrlf || !csv.teniaBom) {
    avis('El format no és el canònic del projecte (coma, LF, BOM UTF-8). ' +
      'Executa amb --normalitza per arreglar-ho.');
  }

  const ambEix = entrades.filter((e) => e.eix).length;
  console.log(`Files: ${entrades.length} · amb eix assignat: ${ambEix} · ignorades: ${entrades.length - ambEix}`);

  if (problemes.length) {
    console.log(`\nERRORS (${problemes.length}):`);
    problemes.forEach((p) => console.log('  ✗ ' + p));
  }
  if (avisos.length) {
    console.log(`\nAVISOS (${avisos.length}):`);
    avisos.forEach((a) => console.log('  ! ' + a));
  }
  if (!problemes.length && !avisos.length) console.log('\nTot correcte.');

  await distribucio(entrades, eixos);

  if (process.argv.includes('--normalitza')) normalitza(csv);

  process.exit(problemes.length ? 1 : 0);
}

main().catch((e) => {
  console.error('Error:', e instanceof Error ? e.message : e);
  process.exit(1);
});
