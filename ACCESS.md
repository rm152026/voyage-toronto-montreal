# Protéger le site par mot de passe — Cloudflare Access (gratuit)

> ⚠️ Cloudflare Access se configure **dans ton compte Cloudflare** (Zero Trust),
> pas dans ce dépôt. Aucun fichier ici ne « l'active » : suis les étapes ci-dessous.
> C'est gratuit jusqu'à 50 utilisateurs.

Une fois en place : avant même d'afficher le site, Cloudflare demande au visiteur
de prouver son identité (code envoyé par e-mail, ou autre méthode). Seuls les e-mails
que tu autorises peuvent entrer. Combiné au chiffrement de bout en bout déjà présent,
ça donne deux barrières : **accès** (Access) + **contenu** (phrase secrète).

---

## Prérequis
Le site doit être servi derrière Cloudflare :
- **Cloudflare Pages** (recommandé) : héberge `index.html`, `app.js`, `config.js`,
  `robots.txt`, `_headers` ici présents. Voir `SETUP.md` §3.
- ou un domaine dont le DNS est géré par Cloudflare (proxy activé, nuage orange).

## Étapes (≈ 5 min)
1. **Active Zero Trust** : dashboard Cloudflare → **Zero Trust**. Au 1er accès, choisis
   un nom de team (ex. `monvoyage`) → ton portail sera `https://monvoyage.cloudflareaccess.com`.
   Le plan **Free** suffit (carte bancaire parfois demandée, non débitée).

2. **Méthode de connexion** : Zero Trust → **Settings → Authentication →
   Login methods**. Active **One-time PIN** (code par e-mail) — zéro config, idéal pour
   2 personnes. (Tu peux aussi ajouter Google, GitHub, etc.)

3. **Crée l'application** : **Access → Applications → Add an application →
   Self-hosted**.
   - **Application name** : `Carnet de voyage`
   - **Session duration** : `1 week` (vous ne ressaisirez pas le code à chaque visite)
   - **Application domain** : le domaine du site
     (ex. `trip-7f3k9q2x.pages.dev`, ou ton domaine perso). Laisse le chemin vide
     pour protéger tout le site.

4. **Politique d'accès** : **Add a policy**
   - **Policy name** : `Nous deux`
   - **Action** : `Allow`
   - **Include** → **Emails** → ajoute **vos deux adresses** exactes
     (la tienne + la sienne).
   - (Optionnel **Require** → Emails identiques pour durcir.)
   - Enregistre.

5. **Termine** : Save. Ouvre le site dans une fenêtre privée → Cloudflare doit
   demander un e-mail, envoyer un code, puis n'ouvrir qu'aux adresses autorisées.

## Partage
Tu partages **le même lien** qu'avant (`…/#sync=…`). À la première ouverture,
ta moitié reçoit un code par e-mail (sur l'adresse que tu as autorisée), entre le
code, puis saisit la **phrase secrète** du carnet. Donne-lui la phrase par un canal
séparé (Signal, de vive voix) comme dans `SETUP.md` §4.

## Retirer / modifier l'accès
- Ajouter/enlever une personne : Access → Applications → l'app → **Policies** → édite les e-mails.
- Tout désactiver : supprime l'application (le site redevient public, mais toujours `noindex`).

---

## Option : infra-as-code (Terraform)
Si tu préfères versionner la config plutôt que cliquer. Nécessite un
**API token** Cloudflare (Account → Access: Apps and Policies: Edit) et ton
`account_id` — **ne les commite pas**, passe-les en variables d'environnement.

```hcl
terraform {
  required_providers {
    cloudflare = { source = "cloudflare/cloudflare", version = "~> 4" }
  }
}
provider "cloudflare" {} # CLOUDFLARE_API_TOKEN via l'environnement

variable "account_id" { type = string }
variable "site_domain" { type = string } # ex. trip-7f3k9q2x.pages.dev
variable "allowed_emails" { type = list(string) }

resource "cloudflare_access_application" "carnet" {
  account_id       = var.account_id
  name             = "Carnet de voyage"
  domain           = var.site_domain
  session_duration = "168h" # 1 semaine
  type             = "self_hosted"
}

resource "cloudflare_access_policy" "nous_deux" {
  account_id     = var.account_id
  application_id = cloudflare_access_application.carnet.id
  name           = "Nous deux"
  precedence     = 1
  decision       = "allow"
  include { email = var.allowed_emails }
}
```
```bash
export CLOUDFLARE_API_TOKEN=••••••
terraform init
terraform apply -var account_id=••• -var site_domain=trip-xxxx.pages.dev \
  -var 'allowed_emails=["toi@exemple.com","elle@exemple.com"]'
```

---

### Alternatives (rappel)
- **Netlify** : Site settings → Visitor access → Password protection (plan **Pro**, payant).
- **VPS Nginx/Caddy** : HTTP Basic Auth (`.htpasswd`). Gratuit mais un seul mot de passe partagé.
