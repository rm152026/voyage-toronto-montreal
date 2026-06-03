variable "account_id" {
  type        = string
  description = "ID de ton compte Cloudflare (dashboard → barre latérale, ou page d'accueil du compte)."
}

variable "site_domain" {
  type        = string
  description = "Domaine du site déployé, ex. trip-7f3k9q2x.pages.dev ou ton domaine perso."
}

variable "allowed_emails" {
  type        = list(string)
  description = "Adresses e-mail autorisées à ouvrir le site (vous deux)."
}
