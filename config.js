/* ============================================================================
   Vihiga SPMS — server connection settings
   ----------------------------------------------------------------------------
   This is the ONLY file that says which server the app talks to. To point the
   app at a different server (for example a county-hosted one), change the two
   values below and upload this file. The app itself (index.html) needs no edit.

   The "key" below is the public (publishable) key. It is meant to be visible
   to anyone who opens the app; real protection comes from the database's
   access rules, not from hiding this key. NEVER put a secret / service key
   in this file.
   ============================================================================ */
window.SPMS_CONFIG = {
  supabaseUrl: "https://ufqwhnutbkeoviqsygfn.supabase.co",
  supabaseKey: "sb_publishable_irevoMWXidqNXc8TJTfTJg_JCeOml71"
};
