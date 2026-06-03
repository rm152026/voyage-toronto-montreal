# Déployer sur Cloudflare Pages (prérequis pour Access)

Site statique → hébergement gratuit, HTTPS automatique, et compatible avec
Cloudflare Access (`ACCESS.md`) pour le protéger par mot de passe.

## Méthode A — connecté à GitHub (recommandé, redéploie à chaque push)
1. Dashboard Cloudflare → **Workers & Pages** → **Create** → onglet **Pages** →
   **Connect to Git**.
2. Autorise GitHub, choisis le dépôt **`rm152026/voyage-toronto-montreal`**
   (privé ou public, peu importe) et la branche à déployer (`main`).
3. **Build settings** — c'est un site statique sans build :
   - **Framework preset** : `None`
   - **Build command** : *(laisser vide)*
   - **Build output directory** : `/` (la racine du dépôt)
4. **Save and Deploy**. Au bout d'une minute tu obtiens une URL
   `https://<projet>.pages.dev`.
5. **Rends l'URL difficile à deviner** : Settings → réglages du projet →
   renomme en quelque chose d'aléatoire (ex. `trip-7f3k9q2x`).
   → l'URL devient `https://trip-7f3k9q2x.pages.dev`.

> Les fichiers `_headers` (en-têtes de sécurité + `X-Robots-Tag`) et `robots.txt`
> présents dans le dépôt sont servis automatiquement par Pages.

## Méthode B — Direct Upload (sans connecter GitHub)
1. **Workers & Pages → Create → Pages → Upload assets**.
2. Glisse les fichiers du site : `index.html`, `app.js`, `config.js`,
   `robots.txt`, `_headers`.
3. Déploie → même type d'URL `*.pages.dev`.

## Ensuite
- Note l'URL `*.pages.dev` : c'est le `site_domain` pour Access.
- Active la protection : suis **`ACCESS.md`** (clic-clic) ou **`terraform/`**
  (infra-as-code).
- Le lien à partager reste `https://<projet>.pages.dev/#sync=…`.
