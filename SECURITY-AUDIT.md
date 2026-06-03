# Rapport de pentest & audit OWASP — Carnet de voyage Toronto → Montréal

**Cible** : application web statique (`index.html`, `app.js`, `config.js`) + backend Supabase (PostgREST + Realtime).
**Type** : carnet de voyage à deux, synchro chiffrée de bout en bout (AES-256-GCM, clé dérivée par PBKDF2 d'une phrase secrète).
**Date** : 2026-06-03
**Méthode** : revue de code (white-box), analyse de la surface d'attaque côté client et de l'API Supabase, mapping OWASP Top 10 (2021) et OWASP API Security Top 10 (2023).
**Périmètre** : code applicatif du dépôt. Le compte Supabase (clés, RLS réellement déployées, quotas) n'a pas été testé en live — les constats backend s'appuient sur le SQL documenté dans `SETUP.md`.

> ⚠️ Ce rapport est défensif : il documente des faiblesses et propose des correctifs. Aucune attaque n'a été menée contre une infrastructure tierce.

---

## 1. Synthèse exécutive

L'architecture est **solide pour un projet personnel** : chiffrement de bout en bout réel (AES-256-GCM authentifié), clé jamais transmise, rendu via `textContent` (pas de XSS DOM), CSP stricte sans `unsafe-inline` pour les scripts, et SRI sur les dépendances CDN. Le serveur ne voit que du chiffré.

Les risques résiduels viennent **du modèle d'accès du backend** et de **la politique de phrase secrète**, pas de la cryptographie elle-même.

| # | Constat | Sévérité | OWASP |
|---|---------|----------|-------|
| F1 | RLS permissive (`using (true)`) → lecture de **toute** la table de chiffrés | Élevée | A01 / API1 |
| F2 | Phrase secrète : minimum réel de **4 caractères** (pas 4 mots) | Élevée | A02 / A07 |
| F3 | Aucune limitation de débit/volume sur l'API anon (insert/update) | Moyenne | A04 / API4 |
| F4 | UPDATE ouvert à l'anon → écrasement/altération d'un carnet (DoS) | Moyenne | A05 / API5 |
| F5 | Lien « instantané » `#carnet=` contient le carnet **en clair** (base64) | Moyenne | A02 |
| F6 | PBKDF2 à 210 000 itérations (sous la reco OWASP 2023 : 600 000) | Faible | A02 |
| F7 | État local stocké **non chiffré** dans `localStorage` | Faible | A04 |
| F8 | En-têtes de sécurité HTTP en `<meta>` uniquement, non garantis serveur | Faible | A05 |

Aucune vulnérabilité **critique** (RCE, XSS exploitable, fuite de clé/plaintext vers le serveur) n'a été identifiée.

---

## 2. Architecture & modèle de menace

```
[Navigateur A] ──phrase secrète──┐
                                 ▼  AES-256-GCM (clé = PBKDF2(phrase, salt))
   chiffré {v,salt,iv,ct}  ◄──►  Supabase (PostgREST + Realtime)  ◄──►  [Navigateur B]
                                 │ ne stocke/voit QUE du chiffré
                                 │ clé anon = PUBLIQUE par design
```

- **Confidentialité** : repose sur la phrase secrète + AES-GCM. Le serveur, le réseau et l'hébergeur ne voient que `{v,salt,iv,ct}`.
- **Capacité d'accès** : l'`uuid` du carnet (dans le fragment `#sync=`) + la phrase. L'`uuid` seul ne donne pas le plaintext.
- **Clé anon Supabase** : publique par conception (elle part dans chaque navigateur). La sécurité **ne doit pas** dépendre d'elle — c'est correctement assumé dans `config.js`.

---

## 3. OWASP Top 10 (2021) — application web

### A01 — Broken Access Control *(F1, F4)* — **Élevé**
Les politiques RLS de `SETUP.md` sont totalement ouvertes :
```sql
create policy "trips read"   on public.trips for select using (true);
create policy "trips insert" on public.trips for insert with check (true);
create policy "trips update" on public.trips for update using (true) with check (true);
```
Conséquences avec la clé anon (publique) :
- **`select * from trips`** renvoie **tous** les enregistrements chiffrés de tous les couples utilisateurs, pas seulement celui dont on possède l'`uuid`. L'attaquant récupère `salt`, `iv`, `ct` de chaque carnet → **brute-force PBKDF2 hors-ligne** sur n'importe quelle phrase faible (voir F2). Le chiffrement tient encore, mais la barrière « il faut connaître l'uuid » **n'existe pas** au niveau base.
- **UPDATE** sur n'importe quel `id` connu → écrasement du carnet d'autrui (intégrité/DoS). Déjà partiellement assumé dans le modèle de menace, mais reste une faiblesse d'autorisation au niveau objet.

**Correctif** : ne pas exposer la lecture en masse. L'`id` (uuid v4, 122 bits) doit servir de capacité — donc forcer un filtre par `id` et bloquer l'énumération. Voir §6.

### A02 — Cryptographic Failures *(F2, F5, F6)* — **Élevé**
- **F2** — `doCreate()` n'exige que `pass.length < 4` ⇒ une phrase de **4 caractères** est acceptée alors que l'UI promet « 4 mots ». Couplé à F1 (chiffrés en masse), une phrase courte tombe en brute-force.
- **F5** — Le lien `#carnet=` (chemin sans Supabase) encode le carnet **en clair** (base64 ≠ chiffrement). Le fragment n'est pas envoyé au serveur, mais reste dans l'historique du navigateur, les logs de l'app de messagerie, le presse-papiers, etc. Ce chemin **contredit** la promesse « privé/chiffré ».
- **F6** — PBKDF2-SHA256 à **210 000** itérations : correct, mais l'OWASP Password Storage Cheat Sheet (2023) recommande **600 000** pour PBKDF2-HMAC-SHA256.

Points **positifs** : AES-256-GCM (chiffrement authentifié → intégrité), `iv` aléatoire de 96 bits par message, `salt` de 128 bits par carnet, clé non extractible (`extractable=false`), phrase jamais transmise.

### A03 — Injection — **Faible (maîtrisé)**
Les idées utilisateur sont rendues via `span.textContent = item.t` ⇒ **pas d'injection HTML/XSS**. Les `innerHTML` présents n'utilisent que des **chaînes statiques** (conseils de Banger, descriptions de partage) ou des données de configuration internes (`STOPS` dans les popups Leaflet), jamais d'entrée utilisateur. La longueur des idées est bornée (`slice(0, 280)`). RAS.

### A04 — Insecure Design *(F3, F7)* — **Moyen**
- **F3** — Aucune limitation de débit ni de volume : un porteur de la clé anon peut **insérer en masse** (épuisement du stockage/quota Supabase) ou marteler l'API.
- **F7** — `saveLocal()` écrit l'état **en clair** dans `localStorage`. Sur un appareil partagé/volé, le carnet déchiffré est lisible hors session. À assumer ou à documenter.

### A05 — Security Misconfiguration *(F4, F8)* — **Moyen/Faible**
- **F8** — Les en-têtes de durcissement (`X-Frame-Options`, `X-Content-Type-Options`, HSTS, `Referrer-Policy`, `Permissions-Policy`) ne sont **conseillés** que dans `SETUP.md`. Sur un hébergeur qui ne les pose pas, seule la CSP `<meta>` protège. La CSP en `<meta>` ne couvre pas `frame-ancestors` de façon fiable sur tous les navigateurs → poser `X-Frame-Options`/`frame-ancestors` côté serveur. Fournir un fichier `_headers` (Netlify) / `_headers`-équivalent par défaut.
- **F4** — voir A01 : config d'autorisation trop permissive.

**Positif** : CSP stricte — `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'none'`, `base-uri 'self'`, `connect-src` limité à Supabase, pas de `unsafe-inline` pour les scripts.

### A06 — Vulnerable & Outdated Components — **Faible**
Dépendances épinglées **et** protégées par SRI : Leaflet 1.9.4 (SRI sha256), Supabase-js 2.107.0 (SRI sha384), CSS Leaflet (SRI). Bon point. **Recommandation** : surveiller les avis de sécurité et figer aussi `script-src`/`img-src` sur des sous-ressources précises plutôt que des CDN entiers (`unpkg.com`, `cdn.jsdelivr.net`) — le SRI compense déjà le risque de substitution.

### A07 — Identification & Authentication Failures *(F2)* — **Moyen**
Pas d'authentification utilisateur : modèle **par capacité** (lien + phrase), légitime ici. La seule faiblesse d'« auth » est la **politique de phrase** trop laxiste (F2). Imposer une longueur/entropie minimale réelle.

### A08 — Software & Data Integrity Failures — **Faible (bien géré)**
SRI présent sur tout le CDN (intégrité du code tiers). AES-GCM garantit l'intégrité des données chiffrées (toute altération est rejetée par `unseal`). Le seul angle restant est l'écrasement autorisé (F4), qui est de l'**intégrité applicative**, pas cryptographique.

### A09 — Security Logging & Monitoring Failures — **N/A**
Front statique : pas de journalisation côté client attendue. Côté Supabase, activer les logs d'API et des alertes de quota (détection de F3).

### A10 — SSRF — **N/A**
Aucune requête sortante pilotée par l'utilisateur. `connect-src` verrouillé sur Supabase.

---

## 4. OWASP API Security Top 10 (2023) — backend Supabase

L'API réellement exposée est l'endpoint **PostgREST**/Realtime de Supabase, atteignable avec la clé anon publique.

| ID | Risque | État | Détail |
|----|--------|------|--------|
| **API1** Broken Object Level Authorization | ⚠️ **Présent** | F1 : `select using(true)` autorise la lecture de **tout** objet, pas seulement celui dont on a l'`uuid`. L'autorisation au niveau objet repose uniquement sur la confidentialité de l'uuid, non appliquée en base. |
| **API2** Broken Authentication | ◐ Par design | Clé anon publique, pas d'auth par utilisateur. Acceptable **si** F1/F3/F4 sont corrigés ; sinon la clé devient une porte d'entrée en lecture/écriture massive. |
| **API3** Broken Object Property Level Auth | ◐ Mineur | `select('data')` renvoie l'enveloppe complète. Comme c'est du chiffré, l'exposition de propriétés est limitée, mais `salt`/`iv` aident le brute-force (lié à F1). |
| **API4** Unrestricted Resource Consumption | ⚠️ **Présent** | F3 : aucune limite de débit/taille/volume. Insert spam, épuisement de stockage, abus du Realtime. PBKDF2 est côté client → pas de protection serveur contre le brute-force massif si la table est lisible (F1). |
| **API5** Broken Function Level Authorization | ⚠️ **Présent** | F4 : `insert`/`update` ouverts à l'anon sur **n'importe quel** `id`. Pas de séparation de fonctions. (Le `delete` est implicitement bloqué — bon point.) |
| **API6** Unrestricted Access to Sensitive Business Flows | ◐ Mineur | Création de carnets illimitée (lié à API4). |
| **API7** SSRF | ✅ N/A | Pas de fetch piloté par l'utilisateur côté serveur. |
| **API8** Security Misconfiguration | ⚠️ **Présent** | RLS permissive (F1/F4), Realtime exposé à tout porteur de l'uuid. À durcir. |
| **API9** Improper Inventory Management | ✅ OK | Une seule table/endpoint, surface minimale. |
| **API10** Unsafe Consumption of APIs | ✅ Bien | Le client consomme Supabase en TLS, SDK épinglé + SRI, `connect-src` verrouillé. |

---

## 5. Tests d'intrusion réalisés (revue) & vérifications suggérées

| Test | Résultat |
|------|----------|
| Injection HTML/XSS via une idée (`<img onerror>`, `<script>`) | **Bloqué** — rendu `textContent`. |
| Exfiltration de la clé/plaintext vers le serveur | **Aucune** — seul `{v,salt,iv,ct}` part. |
| Altération du chiffré (bit-flip) | **Rejetée** — AES-GCM authentifié (`unseal` renvoie `null`). |
| Mauvaise phrase | **Échec propre** — `unlockErr`, pas de fuite. |
| Contournement CSP (script inline) | **Bloqué** — pas de `unsafe-inline` script. |
| `delete from trips` (anon) | **Bloqué** — pas de policy delete. |
| **`select * from trips` (anon)** | ⚠️ **Réussit** (F1) — fuite de masse des chiffrés. *À confirmer en live.* |
| **`update ... where id=<uuid connu>` (anon)** | ⚠️ **Réussit** (F4) — écrasement. *À confirmer en live.* |
| **Insert en boucle (anon)** | ⚠️ **Non limité** (F3). *À confirmer en live.* |

> Pour confirmer F1/F3/F4 sur votre instance, testez avec la clé anon **uniquement sur votre propre projet** :
> `curl '$SUPABASE_URL/rest/v1/trips?select=id' -H "apikey: $ANON"` — s'il renvoie plus d'une ligne, F1 est confirmé.

---

## 6. Remédiations recommandées (par priorité)

### P1 — Verrouiller l'accès objet (corrige F1, F4 / A01, API1, API5, API8)
Faire de l'`uuid` une vraie capacité : interdire l'énumération et n'autoriser que l'accès ciblé. Deux options.

**Option A (simple, garde l'anon) — exiger un secret partagé d'accès** : ajouter une colonne secrète indexée et forcer le filtre. Le plus robuste reste de passer par une **fonction RPC** `SECURITY DEFINER` qui prend `(id, ...)` et n'autorise jamais le `select` direct sur la table :

```sql
revoke all on public.trips from anon;
alter table public.trips enable row level security;
-- aucune policy select/insert/update directe pour anon

create or replace function public.trip_get(p_id uuid)
returns jsonb language sql security definer set search_path = public as $$
  select data from public.trips where id = p_id;
$$;

create or replace function public.trip_upsert(p_id uuid, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.trips set data = p_data, updated_at = now() where id = p_id;
  if not found then insert into public.trips(id, data) values (p_id, p_data); end if;
end; $$;

grant execute on function public.trip_get(uuid), public.trip_upsert(uuid, jsonb) to anon;
```
→ Plus de `select *` possible ; l'accès exige l'`uuid` exact (122 bits, non énumérable). Adapter `pull/doPush` pour appeler `sb.rpc('trip_get'/'trip_upsert', …)`.

**Option B (rapide) — au minimum** retirer la lecture en masse en exigeant l'égalité d'id côté policy n'est pas exprimable simplement en RLS pure ; privilégier l'option A.

### P2 — Politique de phrase secrète (corrige F2 / A02, A07)
Dans `doCreate()`, remplacer `pass.length < 4` par une exigence réelle : **≥ 12 caractères** ou **≥ 4 mots** (compter les espaces), idéalement avec un indicateur d'entropie (zxcvbn). Message d'erreur explicite.

### P3 — PBKDF2 (corrige F6 / A02)
Porter `iterations` de `210000` à **600000** (`deriveKey`). Tester la latence sur mobile ; sinon envisager **Argon2id** (via WASM) pour un meilleur coût mémoire. Conserver la compat ascendante via le champ `v` de l'enveloppe.

### P4 — Limiter le débit/volume (corrige F3 / A04, API4)
Activer le rate-limiting Supabase / un quota, et/ou un trigger limitant le nombre de lignes et la taille de `data`. Alertes de quota.

### P5 — Lien « instantané » (corrige F5 / A02)
Soit chiffrer aussi le contenu du lien `#carnet=` (mot de passe à saisir), soit afficher un **avertissement clair** que ce lien transporte le carnet en clair, soit le retirer au profit du seul chemin Supabase chiffré.

### P6 — En-têtes serveur (corrige F8 / A05)
Livrer par défaut un fichier `_headers` (Netlify/Cloudflare Pages) avec ceux déjà listés dans `SETUP.md` (HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`).

### P7 — Durcissements mineurs
- Documenter F7 (`localStorage` en clair) ou chiffrer le cache local.
- Restreindre `script-src`/`img-src` à des sous-ressources précises plutôt qu'aux CDN entiers (le SRI couvre déjà l'essentiel).

---

## 7. Conclusion

Le cœur cryptographique est **bien conçu et correctement implémenté** ; la promesse « le serveur ne voit que du bruit » tient. Les efforts de durcissement doivent porter sur **le modèle d'accès du backend (RLS/RPC)** et sur **la robustesse de la phrase secrète**, qui sont aujourd'hui les maillons faibles. En appliquant P1 et P2, le projet atteint un niveau de sécurité très satisfaisant pour son usage.

*Rapport généré dans le cadre d'un audit défensif autorisé du dépôt.*
