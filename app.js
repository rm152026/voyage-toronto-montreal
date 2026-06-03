'use strict';
/* ============================================================
   Carnet de voyage Toronto → Montréal
   - Synchro à deux PRIVÉE, chiffrée de bout en bout (AES-256-GCM)
   - Clé dérivée d'une PHRASE SECRÈTE (PBKDF2) connue de vous deux :
     elle n'est ni dans le lien, ni envoyée au serveur.
   - Aucun handler inline → CSP stricte sans 'unsafe-inline' pour les scripts.
   ============================================================ */

/* ===================== COMPTE À REBOURS ===================== */
(function () {
  const dep = new Date('2026-07-09T00:00:00');
  const el = document.getElementById('countdown');
  function tick() {
    const diff = dep - new Date();
    if (diff <= 0) { el.textContent = '🎉 Le voyage est commencé — profitez-en !'; return; }
    const days = Math.floor(diff / 86400000);
    el.innerHTML = 'Plus que <b>' + days + ' jours</b> avant le grand départ.';
  }
  tick(); setInterval(tick, 60000);
})();

/* ===================== BANGER — conseils + animations ===================== */
const BANGER_TIPS = [
  'Réservez les lodges tôt — en juillet, les plus beaux partent vite ! 🌲',
  'Un imper léger pour les chutes du Niagara : ça éclabousse 💦',
  'Lever de soleil en canot = magique, mais couchez-vous tôt 🛶',
  'Bagels de Montréal &gt; tout le reste. J\'ai goûté, je confirme 🥯',
  'Spa nordique après une journée de route : le vrai bonheur ♨️',
  'Gardez une soirée libre à Toronto ET à Montréal pour improviser ✨',
  'Cartes hors-ligne avant les zones sans réseau dans les parcs 🗺️',
  'Le soir en forêt il fait frais : glissez un pull dans le sac 🧥',
  'Le parc Algonquin au crépuscule : guettez les orignaux 🫎',
  'Une bonne playlist road-trip, c\'est la moitié du voyage 🎶'
];
let bangerI = -1, bangerTimer;
function bangerSay() {
  bangerI = (bangerI + 1) % BANGER_TIPS.length;
  const b = document.getElementById('bubble');
  b.innerHTML = '<b>Banger 🐧 dit :</b><br>' + BANGER_TIPS[bangerI];
  b.classList.add('show');
  clearTimeout(bangerTimer);
  bangerTimer = setTimeout(() => b.classList.remove('show'), 6500);
  const m = document.getElementById('mascot');
  m.classList.remove('wave'); void m.offsetWidth; m.classList.add('wave');
}
document.getElementById('mascot').addEventListener('click', bangerSay);
setTimeout(bangerSay, 2600);

/* confetti estival */
function confetti() {
  const emojis = ['☀️', '🌴', '🐧', '🛶', '♥', '✨', '🌲'];
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('div');
    s.className = 'confetti';
    s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = (Math.random() * 0.3) + 's';
    s.style.fontSize = (14 + Math.random() * 16) + 'px';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 2600);
  }
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ===================== CARTE ===================== */
const STOPS = [
  { name: 'Toronto',        sub: 'Arrivée · 9 juil.',     lat: 43.6532, lng: -79.3832, emoji: '🛬' },
  { name: 'Chutes du Niagara', sub: 'Excursion d\'une journée', lat: 43.0896, lng: -79.0849, emoji: '💦' },
  { name: 'Muskoka',        sub: '1ᵉʳ lodge · lacs',       lat: 45.0376, lng: -79.3016, emoji: '🌲' },
  { name: 'Parc Algonquin', sub: 'Nature & canot',         lat: 45.5800, lng: -78.3500, emoji: '🛶' },
  { name: 'Mille-Îles',     sub: 'Sur la route',           lat: 44.3300, lng: -76.1600, emoji: '🏝️' },
  { name: 'Ottawa',         sub: 'Étape possible',         lat: 45.4215, lng: -75.6972, emoji: '🏛️' },
  { name: 'Mont-Tremblant', sub: '2ᵉ lodge · Laurentides', lat: 46.1185, lng: -74.5962, emoji: '♨️' },
  { name: 'Tadoussac',      sub: 'Fjord & baleines',       lat: 48.1429, lng: -69.7164, emoji: '🐋' },
  { name: 'Montréal',       sub: 'Départ · 23 juil.',      lat: 45.5017, lng: -73.5673, emoji: '🛫' }
];
const ROUTE = ['Toronto', 'Muskoka', 'Parc Algonquin', 'Ottawa', 'Mont-Tremblant', 'Tadoussac', 'Montréal'];
let map, markers = {};
(function initMap() {
  map = L.map('map', { scrollWheelZoom: false }).setView([45.0, -76.8], 6);
  map.on('click', () => map.scrollWheelZoom.enable());
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO', maxZoom: 19
  }).addTo(map);
  STOPS.forEach(s => {
    markers[s.name] = L.marker([s.lat, s.lng]).addTo(map).bindPopup('<b>' + s.emoji + ' ' + s.name + '</b><br>' + s.sub);
  });
  const pts = ROUTE.map(n => { const s = STOPS.find(x => x.name === n); return [s.lat, s.lng]; });
  L.polyline(pts, { color: '#c97b4a', weight: 4, opacity: 0.9, dashArray: '1,10', lineCap: 'round' }).addTo(map);
  const niag = STOPS.find(s => s.name === 'Chutes du Niagara'), tor = STOPS.find(s => s.name === 'Toronto');
  L.polyline([[tor.lat, tor.lng], [niag.lat, niag.lng]], { color: '#6b8f71', weight: 3, opacity: 0.7, dashArray: '2,8' }).addTo(map);
  map.fitBounds(STOPS.map(s => [s.lat, s.lng]), { padding: [40, 40] });
  const list = document.getElementById('routeList');
  STOPS.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'route-item';
    b.innerHTML = '<span class="num">' + (i + 1) + '</span><span class="meta"><span class="name">' + s.emoji + ' ' + s.name + '</span><span class="sub">' + s.sub + '</span></span>';
    b.addEventListener('click', () => { map.flyTo([s.lat, s.lng], 9, { duration: 0.8 }); markers[s.name].openPopup(); });
    list.appendChild(b);
  });
})();

/* ===================== ÉTAT & PERSISTANCE ===================== */
const COLS = [
  { id: 'lieux',     title: 'Lieux à voir',    color: '#6b8f71', seed: ['Chutes du Niagara', 'Parc Algonquin', 'Vieux-Montréal'] },
  { id: 'activites', title: 'Activités',        color: '#c97b4a', seed: ['Canot au lever du soleil', 'Spa nordique', 'Balade en vélo'] },
  { id: 'bouffe',    title: 'Restos & bouffe',  color: '#8a5a36', seed: ['Bagels de Montréal', 'Poutine', 'Marché Jean-Talon'] },
  { id: 'reves',     title: 'Nos petits rêves', color: '#5a4a6b', seed: ['Voir les étoiles', 'Pique-nique au bord du lac'] }
];
const TASKS = ['Réserver les vols', 'Réserver les lodges (vite !)', 'Louer la voiture', 'Permis de conduire international', 'Assurance voyage', 'Forfait / carte eSIM', 'Faire les valises', 'Cartes hors-ligne', 'Playlist road-trip ♫'];
const BUDGET = ['Vols (Toronto / Montréal)', 'Location de voiture (15 j)', 'Lodges & hôtels', 'Activités (canot, spa, Niagara…)', 'Restaurants & sorties', 'Essence & péages', 'Marge imprévus ♥'];

const LS_KEY = 'tripState_v2';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function freshState() {
  const ideas = {};
  COLS.forEach(c => { ideas[c.id] = c.seed.map(t => ({ id: uid(), t })); });
  return { ideas, deleted: [], checks: {}, budget: {}, ts: Date.now() };
}
let state = (function load() {
  try { const v = localStorage.getItem(LS_KEY); if (v) return JSON.parse(v); } catch (e) {}
  return freshState();
})();
function saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }

/* ===================== RENDU ===================== */
const board = document.getElementById('board');
function renderBoard() {
  board.innerHTML = '';
  COLS.forEach(col => {
    const wrap = document.createElement('div');
    wrap.className = 'column';
    const h3 = document.createElement('h3');
    const dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = col.color;
    h3.appendChild(dot); h3.appendChild(document.createTextNode(col.title));
    const ul = document.createElement('ul'); ul.className = 'ideas';
    const addrow = document.createElement('div'); addrow.className = 'addrow';
    const input = document.createElement('input'); input.type = 'text'; input.placeholder = 'Ajouter une idée…';
    const addBtn = document.createElement('button'); addBtn.title = 'Ajouter'; addBtn.textContent = '+';
    addrow.appendChild(input); addrow.appendChild(addBtn);
    wrap.appendChild(h3); wrap.appendChild(ul); wrap.appendChild(addrow);
    board.appendChild(wrap);

    const items = state.ideas[col.id] || (state.ideas[col.id] = []);
    if (!items.length) {
      const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Rien encore…'; ul.appendChild(li);
    }
    items.forEach(item => {
      const li = document.createElement('li');
      const span = document.createElement('span'); span.textContent = item.t; // textContent = pas d'injection HTML
      const del = document.createElement('button'); del.textContent = '×'; del.title = 'Supprimer';
      del.addEventListener('click', () => {
        state.ideas[col.id] = state.ideas[col.id].filter(x => x.id !== item.id);
        state.deleted.push(item.id);
        touch();
      });
      li.appendChild(span); li.appendChild(del); ul.appendChild(li);
    });
    function add() {
      const v = input.value.trim(); if (!v) return;
      state.ideas[col.id].push({ id: uid(), t: v.slice(0, 280) });
      input.value = ''; touch();
      requestAnimationFrame(() => { const ni = board.children[COLS.indexOf(col)].querySelector('input'); if (ni) ni.focus(); });
    }
    addBtn.addEventListener('click', add);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  });
}
function renderChecks(elId, labels, key) {
  const ul = document.getElementById(elId); ul.innerHTML = '';
  labels.forEach((label, i) => {
    const id = key + i;
    const li = document.createElement('li');
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = id; cb.checked = !!state[key][id];
    const lb = document.createElement('label'); lb.htmlFor = id; lb.textContent = label;
    cb.addEventListener('change', () => { state[key][id] = cb.checked; touch(); });
    li.appendChild(cb); li.appendChild(lb); ul.appendChild(li);
  });
}
function renderAll() {
  renderBoard();
  renderChecks('checklist', TASKS, 'checks');
  renderChecks('budget', BUDGET, 'budget');
}
function touch() { state.ts = Date.now(); saveLocal(); renderAll(); schedulePush(); }
renderAll();

/* ===================== SYNCHRO PRIVÉE & CHIFFRÉE (Supabase + PBKDF2/AES-GCM) ===================== */
let pushTimer = null, polling = null, busy = false, channel = null;
let cryptoKey = null;        // CryptoKey AES-GCM dérivée de la phrase secrète
let roomSalt = null;         // sel PBKDF2 (par carnet), stocké AVEC le chiffré
let pendingEnv = null;       // enveloppe distante en attente de déverrouillage

const CFG = window.TRIP_CONFIG || {};
const CONFIGURED = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && !/VOTRE_/.test(CFG.SUPABASE_URL + CFG.SUPABASE_ANON_KEY));
const TABLE = CFG.TABLE || 'trips';
let sb = null;
if (CONFIGURED && window.supabase) {
  try { sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, { auth: { persistSession: false } }); } catch (e) {}
}
const SC = !!(window.isSecureContext && window.crypto && crypto.subtle);

const b64u = {
  enc: buf => btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
};
const frag = new URLSearchParams(location.hash.slice(1));
let roomId = frag.get('sync');

async function deriveKey(pass, saltU8) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltU8, iterations: 210000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function seal(obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, new TextEncoder().encode(JSON.stringify(obj)));
  return { v: 2, salt: b64u.enc(roomSalt), iv: b64u.enc(iv), ct: b64u.enc(ct) };
}
async function unseal(env) {
  if (!env || env.v !== 2 || !env.iv || !env.ct || !cryptoKey) return null;
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64u.dec(env.iv) }, cryptoKey, b64u.dec(env.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch (e) { return null; } // mauvaise phrase ou données altérées
}

function setStatus(mode, text) {
  const el = document.getElementById('syncStatus');
  el.className = 'sync-status' + (mode ? ' ' + mode : '');
  document.getElementById('syncText').textContent = text;
}
function mergeRemote(r) {
  if (!r || typeof r !== 'object') return false;
  const delSet = new Set([...(state.deleted || []), ...(r.deleted || [])]);
  COLS.forEach(c => {
    const m = new Map();
    (r.ideas && r.ideas[c.id] || []).forEach(it => { if (it && it.id) m.set(it.id, { id: String(it.id), t: String(it.t || '').slice(0, 280) }); });
    (state.ideas[c.id] || []).forEach(it => m.set(it.id, it));
    state.ideas[c.id] = [...m.values()].filter(it => !delSet.has(it.id)).sort((a, b) => a.id < b.id ? -1 : 1);
  });
  state.deleted = [...delSet];
  if ((r.ts || 0) > (state.ts || 0)) {
    state.checks = Object.assign({}, state.checks, r.checks);
    state.budget = Object.assign({}, state.budget, r.budget);
    state.ts = r.ts;
  }
  return true;
}

async function pull() {
  if (!roomId || !cryptoKey || !sb || busy) return;
  busy = true;
  try {
    const { data, error } = await sb.from(TABLE).select('data').eq('id', roomId).single();
    if (!error && data) {
      const d = await unseal(data.data);
      if (d) { mergeRemote(d); saveLocal(); renderAll(); setStatus('live', 'Synchronisé à deux · privé 🔒'); }
    }
  } catch (e) { setStatus('', 'Hors-ligne — réessai…'); }
  finally { busy = false; }
}
function schedulePush() {
  if (!roomId) return;
  setStatus('syncing', 'Chiffrement & envoi…');
  clearTimeout(pushTimer); pushTimer = setTimeout(doPush, 600);
}
async function doPush() {
  if (!roomId || !cryptoKey || !sb) return;
  busy = true;
  try {
    try { const { data } = await sb.from(TABLE).select('data').eq('id', roomId).single(); if (data) { const d = await unseal(data.data); if (d) mergeRemote(d); } } catch (e) {}
    state.ts = Date.now(); saveLocal();
    const env = await seal(state);
    const { error } = await sb.from(TABLE).update({ data: env, updated_at: new Date().toISOString() }).eq('id', roomId);
    setStatus(error ? '' : 'live', error ? 'Sauvegarde locale (cloud indispo.)' : 'Synchronisé à deux · privé 🔒');
  } catch (e) { setStatus('', 'Sauvegarde locale (hors-ligne)'); }
  finally { busy = false; }
}
function startSync() {
  if (!roomId || !cryptoKey || !sb) return;
  history.replaceState(null, '', '#sync=' + roomId);
  setStatus('syncing', 'Connexion chiffrée…');
  pull();
  if (channel) { sb.removeChannel(channel); channel = null; }
  channel = sb.channel('trip-' + roomId)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLE, filter: 'id=eq.' + roomId },
      payload => { (async () => { const d = await unseal(payload.new && payload.new.data); if (d) { mergeRemote(d); saveLocal(); renderAll(); setStatus('live', 'Synchronisé à deux · privé 🔒'); } })(); })
    .subscribe();
  clearInterval(polling);
  polling = setInterval(() => { if (!document.hidden) pull(); }, 10000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
}
async function createRoom(pass) {
  if (!SC) throw new Error('insecure-context');
  if (!sb) throw new Error('not-configured');
  setStatus('syncing', 'Création du carnet chiffré…');
  roomSalt = crypto.getRandomValues(new Uint8Array(16));
  cryptoKey = await deriveKey(pass, roomSalt);
  state.ts = Date.now();
  const env = await seal(state);
  const { data, error } = await sb.from(TABLE).insert({ data: env }).select('id').single();
  if (error) throw error;
  roomId = data.id;
  startSync();
}

/* ===================== PARTAGE (UI) ===================== */
function shareUrl() { return location.origin + location.pathname + '#sync=' + roomId; }
function snapshotUrl() {
  const payload = { ideas: state.ideas, deleted: state.deleted, checks: state.checks, budget: state.budget, ts: state.ts };
  return location.origin + location.pathname + '#carnet=' + b64u.enc(new TextEncoder().encode(JSON.stringify(payload)));
}
const $ = id => document.getElementById(id);
function showShareLinkView(link, desc) {
  $('shareCreate').style.display = 'none';
  $('shareLinkView').style.display = '';
  $('shareDesc').innerHTML = desc;
  $('shareInput').value = link;
  $('nativeShareBtn').style.display = navigator.share ? 'inline-flex' : 'none';
  setTimeout(() => { $('shareInput').focus(); $('shareInput').select(); }, 50);
}
function openShare() {
  const modal = $('shareModal');
  modal.classList.add('show');
  if (CONFIGURED && sb && SC) {
    if (roomId && cryptoKey) {
      showShareLinkView(shareUrl(), 'Lien <b>privé, chiffré, synchronisé en temps réel</b> 🔒. Donne la <b>phrase secrète</b> à part (Signal…) — sans elle, le lien est inutile.');
    } else {
      // vue création : demander la phrase secrète
      $('shareCreate').style.display = '';
      $('shareLinkView').style.display = 'none';
      setTimeout(() => $('sharePass').focus(), 50);
    }
  } else {
    // pas de Supabase → lien instantané (le carnet voyage dans le lien)
    showShareLinkView(snapshotUrl(),
      'Lien <b>instantané</b> ✨ : il contient une photo de votre carnet. Pour un lien <b>privé + synchro live</b>, configure Supabase (voir SETUP.md).');
  }
}
function closeShare() { $('shareModal').classList.remove('show'); }

async function doCreate() {
  const pass = $('sharePass').value.trim();
  if (pass.length < 4) { toast('Choisis une phrase secrète un peu plus longue 🔒'); return; }
  const btn = $('createBtn'); btn.disabled = true; btn.textContent = 'Création…';
  try {
    await createRoom(pass);
    $('sharePass').value = '';
    showShareLinkView(shareUrl(), 'Lien <b>privé, chiffré, synchronisé en temps réel</b> 🔒. Donne la <b>phrase secrète</b> à part (Signal…) — sans elle, le lien est inutile.');
    confetti();
  } catch (e) {
    toast('⚠️ Création impossible — vérifie Supabase (table + RLS)');
  } finally { btn.disabled = false; btn.textContent = '🔒 Créer le lien privé'; }
}
function copyLink() {
  const input = $('shareInput'); const txt = input.value;
  const ok = () => { toast('Lien copié ♥ partage-le'); confetti(); };
  const fallback = () => { input.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Copie le lien affiché'); } };
  if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
}
async function nativeShare() {
  try { await navigator.share({ title: 'Notre voyage Toronto → Montréal', text: 'Notre carnet de voyage à deux ♥ (avec Banger 🐧)', url: $('shareInput').value }); } catch (e) {}
}

/* ===================== DÉVERROUILLAGE (ouverture d'un lien privé) ===================== */
async function beginUnlock() {
  setStatus('syncing', 'Carnet privé — déverrouillage…');
  try {
    const { data, error } = await sb.from(TABLE).select('data').eq('id', roomId).single();
    if (error || !data || !data.data || !data.data.salt) { setStatus('', '⚠️ Carnet introuvable ou lien invalide'); return; }
    pendingEnv = data.data;
    roomSalt = b64u.dec(pendingEnv.salt);
    $('unlockModal').classList.add('show');
    setTimeout(() => $('unlockPass').focus(), 60);
  } catch (e) { setStatus('', 'Hors-ligne — réessaie'); }
}
async function tryUnlock() {
  const pass = $('unlockPass').value.trim();
  if (!pass) return;
  const btn = $('unlockBtn'); btn.disabled = true; btn.textContent = '…';
  try {
    cryptoKey = await deriveKey(pass, roomSalt);
    const d = await unseal(pendingEnv);
    if (!d) { cryptoKey = null; $('unlockErr').style.display = ''; return; }
    mergeRemote(d); saveLocal(); renderAll();
    $('unlockModal').classList.remove('show');
    $('unlockPass').value = '';
    startSync();
    toast('Carnet privé ouvert 🔒');
  } catch (e) { $('unlockErr').style.display = ''; }
  finally { btn.disabled = false; btn.textContent = 'Ouvrir'; }
}

/* ===================== BRANCHEMENT DES BOUTONS ===================== */
$('navShareBtn').addEventListener('click', openShare);
$('syncShareBtn').addEventListener('click', openShare);
$('shareCloseBtn').addEventListener('click', closeShare);
$('createBtn').addEventListener('click', doCreate);
$('sharePass').addEventListener('keydown', e => { if (e.key === 'Enter') doCreate(); });
$('copyBtn').addEventListener('click', copyLink);
$('nativeShareBtn').addEventListener('click', nativeShare);
$('shareModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeShare(); });
$('unlockBtn').addEventListener('click', tryUnlock);
$('unlockPass').addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
$('unlockPass').addEventListener('input', () => { $('unlockErr').style.display = 'none'; });
$('unlockCancel').addEventListener('click', () => { $('unlockModal').classList.remove('show'); setStatus('', '🔒 Carnet verrouillé — recharge pour entrer la phrase'); });

/* ===================== À L'OUVERTURE ===================== */
(async () => {
  // 1) lien "instantané" : importer le carnet contenu dans le lien
  const snap = frag.get('carnet');
  if (snap) {
    try {
      if (snap.length < 200000) {
        const data = JSON.parse(new TextDecoder().decode(b64u.dec(snap)));
        mergeRemote(data); saveLocal(); renderAll();
      }
      history.replaceState(null, '', location.pathname);
      toast('Carnet de votre moitié importé ♥');
    } catch (e) { toast('⚠️ Lien de carnet illisible'); }
    return;
  }
  // 2) lien privé Supabase : demander la phrase secrète
  if (roomId) {
    if (!SC) { setStatus('', '🔒 Ouvre ce lien en HTTPS pour la synchro chiffrée'); return; }
    if (!CONFIGURED || !sb) { setStatus('', '⚙️ Supabase non configuré (config.js)'); return; }
    beginUnlock();
    return;
  }
  // 3) carnet local
  if (!CONFIGURED) setStatus('', '🐧 Carnet prêt — « Partager » crée un lien privé à envoyer à votre moitié');
})();
