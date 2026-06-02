/* ============================================================
   CONFIG — Carnet de voyage privé (chiffré de bout en bout)
   ------------------------------------------------------------
   Remplissez les 2 valeurs avec VOTRE projet Supabase
   (Supabase → Project Settings → API) :

   • SUPABASE_URL      : https://xxxx.supabase.co
   • SUPABASE_ANON_KEY : la clé "anon public" — publique PAR DESIGN.
     La confidentialité ne repose PAS sur elle, mais sur :
       1) le chiffrement de bout en bout (AES-256-GCM côté client),
       2) une PHRASE SECRÈTE (PBKDF2) que vous êtes seuls à connaître
          et qui n'est ni dans le lien, ni envoyée au serveur.

   Tant que ces valeurs ne sont pas renseignées, le site fonctionne
   en local et le partage se fait via un lien "instantané".
   Voir SETUP.md pour le SQL (table + RLS + temps réel) et le déploiement.
   ============================================================ */
window.TRIP_CONFIG = {
  SUPABASE_URL: 'VOTRE_URL_SUPABASE',
  SUPABASE_ANON_KEY: 'VOTRE_CLE_ANON',
  TABLE: 'trips'
};
