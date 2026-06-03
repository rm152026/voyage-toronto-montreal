terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4"
    }
  }
}

# Le token se lit dans l'environnement : export CLOUDFLARE_API_TOKEN=••••••
# (Account → Access: Apps and Policies: Edit). NE PAS le commiter.
provider "cloudflare" {}

# Application Access protégeant tout le site (servi via Cloudflare Pages).
resource "cloudflare_access_application" "carnet" {
  account_id       = var.account_id
  name             = "Carnet de voyage"
  domain           = var.site_domain # ex. trip-7f3k9q2x.pages.dev
  session_duration = "168h"          # 1 semaine — pas de re-login à chaque visite
  type             = "self_hosted"
}

# Seules les adresses listées peuvent ouvrir le site.
resource "cloudflare_access_policy" "nous_deux" {
  account_id     = var.account_id
  application_id = cloudflare_access_application.carnet.id
  name           = "Nous deux"
  precedence     = 1
  decision       = "allow"

  include {
    email = var.allowed_emails
  }
}
