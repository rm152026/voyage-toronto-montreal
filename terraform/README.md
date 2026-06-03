# Terraform — Cloudflare Access

Verrouille l'accès au site (mot de passe / code e-mail) en infra-as-code.
Voir `../ACCESS.md` pour la version « clic-clic » dans le dashboard.

## Prérequis
- Le site est déjà déployé derrière Cloudflare (voir `../DEPLOY.md`).
- [Terraform](https://developer.hashicorp.com/terraform/install) installé.
- Un **API token** Cloudflare : My Profile → API Tokens → Create Token →
  permission *Account · Access: Apps and Policies · Edit*.

## Utilisation
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # puis édite tes valeurs
export CLOUDFLARE_API_TOKEN=••••••             # ne le commite jamais
terraform init
terraform plan
terraform apply
```

## Où trouver les valeurs
- `account_id` : dashboard Cloudflare → page d'accueil du compte (ou barre latérale).
- `site_domain` : l'URL `*.pages.dev` créée au déploiement, ou ton domaine perso.
- `allowed_emails` : vos deux adresses exactes.

## Sécurité
- `terraform.tfvars`, `*.tfstate` et `.terraform/` sont **gitignorés** : ils
  contiennent vos e-mails / l'état de l'infra et ne doivent pas partir dans un
  dépôt public.
- Le token passe par variable d'environnement, jamais dans un fichier versionné.

## Retirer la protection
```bash
terraform destroy
```
