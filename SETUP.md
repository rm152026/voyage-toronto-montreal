# Carnet de voyage à deux — privé, chiffré, permanent

Site statique (Toronto → Montréal). Mur à idées **synchronisé à deux**,
**privé** et **chiffré de bout en bout**. Backend = **votre** projet Supabase :
il ne stocke que du chiffré (AES-256-GCM). La clé est dérivée d'une **phrase
secrète** (PBKDF2, 210 000 itérations) que vous êtes seuls à connaître — elle
n'est ni dans le lien, ni transmise au serveur. Sans la phrase, le lien est
inutilisable, même pour quelqu'un qui l'intercepte.

---

## 1) Supabase (≈ 3 min)
1. https://supabase.com → **New project** (plan gratuit).
2. **Project Settings → API**, notez **Project URL** et la clé **anon public**.
3. **SQL Editor** → collez et exécutez :

```sql
create table if not exists public.trips (
  id         uuid primary key default gen_random_uuid(),
  data       jsonb not null,           -- chiffré {v,salt,iv,ct} uniquement
  updated_at timestamptz not null default now()
);

alter table public.trips enable row level security;

-- L'id (uuid) est une capacité secrète ; le contenu est chiffré ET protégé par
-- la phrase secrète. On autorise donc l'anon à lire/créer/mettre à jour.
create policy "trips read"   on public.trips for select using (true);
create policy "trips insert" on public.trips for insert with check (true);
create policy "trips update" on public.trips for update using (true) with check (true);

-- Temps réel (synchro instantanée entre vos 2 téléphones)
alter publication supabase_realtime add table public.trips;

-- Hygiène : purge auto des carnets inactifs > 6 mois (optionnel)
-- (à planifier via pg_cron si souhaité)
```

## 2) Brancher le site
Ouvrez `config.js`, remplacez `VOTRE_URL_SUPABASE` et `VOTRE_CLE_ANON`.

## 3) Héberger en HTTPS — lien PERMANENT
Le chiffrement (Web Crypto) exige **HTTPS** (ou `localhost`). Choisissez UNE option,
toutes gratuites et permanentes. Déposez ces fichiers : `index.html`, `app.js`,
`config.js` (pas besoin de SETUP.md en ligne).

- **Netlify Drop (le plus simple, zéro CLI)** : https://app.netlify.com/drop →
  glissez-déposez le dossier `voyage-toronto-montreal`. URL permanente immédiate ;
  renommable dans Site settings.
- **Cloudflare Pages** : Create project → Direct upload → glissez le dossier.
- **GitHub Pages** : `git init && git add . && git commit -m "voyage"` → push sur un
  repo → Settings → Pages → Deploy from branch. (Repo **privé** possible ; Pages
  reste servi en HTTPS.)
- **Votre VPS** : `caddy file-server` ou Nginx, avec HTTPS (Caddy le fait seul).

> Le tunnel Cloudflare utilisé pour la démo (`*.trycloudflare.com`) est
> **temporaire** : il meurt avec l'ordinateur. Les options ci-dessus sont permanentes.

### En-têtes de sécurité conseillés (si l'hébergeur les permet)
La page embarque déjà une **CSP stricte** via `<meta>`. Pour un cran de plus,
ajoutez ces en-têtes côté serveur (Netlify : fichier `_headers`) :

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 4) Partager — privé, à elle seule
1. Ouvrez le site → **Partager à deux**.
2. Choisissez une **phrase secrète** (4 mots, p. ex. « castor bleu lodge sept »).
3. Copiez le lien et envoyez-le-lui.
4. **Donnez-lui la phrase séparément** (Signal, de vive voix). Elle ouvre le lien,
   saisit la phrase → carnet déverrouillé et synchronisé.

> Astuce sécu : lien et phrase par **deux canaux différents**. Le lien intercepté
> seul ne donne accès à rien.

---

## Modèle de menace
- **Confidentialité** : AES-256-GCM côté client. Supabase / hébergeur / réseau ne
  voient que `{v,salt,iv,ct}` — du bruit.
- **Clé** : dérivée par PBKDF2-SHA256 (210k itérations) de la phrase secrète + sel
  aléatoire (16 o). La phrase n'est jamais stockée ni transmise.
- **Privé "à elle"** : il faut **le lien ET la phrase**. Le lien seul ne suffit pas
  (contrairement à une clé cachée dans l'URL).
- **Intégrité** : AES-GCM authentifié → toute altération est rejetée.
- **Surface web** : CSP stricte (scripts `'self'` + CDN épinglés en **SRI**), pas de
  `unsafe-inline` pour les scripts, `connect-src` limité à Supabase, `object-src
  'none'`, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`. Le texte des
  idées est rendu via `textContent` (pas d'injection HTML/XSS).
- **Résiduel** : qui obtient l'`uuid` ET la phrase a accès ; un `uuid` seul permet au
  pire d'écraser une ligne (déni de service, pas de lecture). Brute-force de la phrase
  freiné par PBKDF2 — d'où l'intérêt d'une phrase de 4+ mots.
