/* ============================================================
   CONFIG — Carnet de voyage privé (chiffré de bout en bout)
   ------------------------------------------------------------
   SUPABASE_ANON_KEY = clé "publishable" Supabase : PUBLIQUE PAR DESIGN
   (elle part dans chaque navigateur). La confidentialité ne repose PAS
   sur elle, mais sur :
     1) le chiffrement de bout en bout (AES-256-GCM côté client),
     2) une PHRASE SECRÈTE (PBKDF2) connue de vous deux seulement,
        jamais dans le lien ni envoyée au serveur.
   Voir SETUP.md pour le SQL (table + RLS + temps réel).
   ============================================================ */
window.TRIP_CONFIG = {
  SUPABASE_URL: 'https://qedzhuapcaqiiarpebda.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable__lIW4UzRgbDDtLROuDPbZw_lQsN_kcy',
  TABLE: 'trips'
};
