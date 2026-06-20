/* ============================================================
   build.mjs — Chiffre le contenu privé du carnet (app-body.html
   + app.js) en un seul blob content.enc (AES-256-GCM, clé dérivée
   de la phrase via PBKDF2-SHA256 210k). Le déploiement public ne
   contient alors que du chiffré : impossible de lire l'itinéraire,
   les dates ou les notes sans la phrase.

   Usage :  node build.mjs "<phrase secrète>"
   Le lien sécurisé à partager est affiché à la fin :  .../#k=<phrase>

   ⚠️ La phrase n'est jamais écrite sur disque ni commitée — garde-la
      hors du dépôt (qui est public).
   ============================================================ */
import { readFile, writeFile } from 'node:fs/promises';
import { webcrypto as crypto } from 'node:crypto';

const pass = process.argv[2];
if (!pass) {
  console.error('Usage : node build.mjs "<phrase secrète>"');
  process.exit(1);
}

// Uint8Array -> base64url
const b64u = (u8) =>
  Buffer.from(u8).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const here = (p) => new URL(p, import.meta.url);

const body = await readFile(here('./app-body.html'), 'utf8');
const js = await readFile(here('./app.js'), 'utf8');
const payload = JSON.stringify({ v: 1, body, js });

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(payload)));

const envelope = { v: 1, salt: b64u(salt), iv: b64u(iv), ct: b64u(ct) };
await writeFile(here('./content.enc'), JSON.stringify(envelope));

console.log('✓ content.enc écrit — ' + ct.length + ' octets chiffrés (body + app.js).');
console.log('  Lien sécurisé : https://rm152026.github.io/voyage-toronto-montreal/#k=' + encodeURIComponent(pass));
