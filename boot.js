/* ============================================================
   boot.js — Écran de verrouillage + déchiffrement E2E du carnet.
   La page publique ne contient AUCUNE donnée de voyage : tout
   (le contenu + l'app) vit dans content.enc, déchiffrable seulement
   avec la phrase secrète. La phrase n'est jamais envoyée au serveur
   (lue depuis le fragment #k= du lien, qui reste côté navigateur).
   ============================================================ */
(function () {
  'use strict';

  // base64url -> Uint8Array
  function dec(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    var b = atob(s), u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  var $ = function (id) { return document.getElementById(id); };
  var gate = $('gate'), input = $('gatePass'), btn = $('gateBtn'),
      err = $('gateErr'), card = $('gateCard');

  // content.enc n'est chargé qu'une fois, à la première tentative
  var envPromise = null;
  function loadEnv() {
    if (!envPromise) {
      envPromise = fetch('content.enc?v=1', { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('fetch'); return r.json(); });
    }
    return envPromise;
  }

  async function deriveKey(pass, salt) {
    var base = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 210000, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }

  async function tryOpen(pass) {
    if (!pass) { showErr('Entre la phrase secrète.'); return false; }
    if (!(window.crypto && crypto.subtle && window.isSecureContext)) {
      showErr('Contexte non sécurisé — ouvre la page en HTTPS.'); return false;
    }
    setBusy(true);
    try {
      var env = await loadEnv();
      var key = await deriveKey(pass, dec(env.salt));
      var ptBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: dec(env.iv) }, key, dec(env.ct));
      var payload = JSON.parse(new TextDecoder().decode(ptBuf));
      reveal(payload);
      return true;
    } catch (e) {
      setBusy(false);
      showErr('Phrase incorrecte — réessaie.');
      return false;
    }
  }

  function reveal(payload) {
    // 1) on retire le verrou, 2) on injecte le contenu réel,
    // 3) on lance l'app (app.js) via un blob (CSP : script-src blob:)
    if (gate) gate.remove();
    document.body.setAttribute('data-active-tab', 'inspiration');
    document.body.insertAdjacentHTML('afterbegin', payload.body);
    var blob = new Blob([payload.js], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var s = document.createElement('script');
    s.src = url;
    s.onload = function () { URL.revokeObjectURL(url); };
    document.body.appendChild(s);
  }

  function setBusy(b) {
    if (!btn) return;
    btn.disabled = b;
    btn.textContent = b ? 'Ouverture…' : 'Ouvrir';
    if (b && err) err.textContent = '';
  }
  function showErr(m) {
    setBusy(false);
    if (err) err.textContent = m;
    if (card) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
  }

  if (btn) btn.addEventListener('click', function () { tryOpen(input.value); });
  if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryOpen(input.value); });

  // Phrase intégrée au lien : #k=<phrase>  (ouverture automatique)
  var frag = new URLSearchParams(location.hash.slice(1));
  var k = frag.get('k');
  if (k) {
    tryOpen(decodeURIComponent(k)).then(function (ok) { if (!ok && input) input.focus(); });
  } else if (input) {
    input.focus();
  }
})();
