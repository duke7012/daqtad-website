/* ==========================================================================
   DA'QTAD — database connection
   --------------------------------------------------------------------------
   Paste the two values from your Supabase project here, then save.

     Supabase dashboard → Project Settings → API keys
       url = Project URL          e.g. https://abcdefgh.supabase.co
       key = Publishable key      starts with sb_publishable_
             (older projects call this the "anon" key — that works too)

   Both values are meant to be public: they end up in the page source, and
   the database only allows visitors to read. Editing requires a login.

   Leave them blank and the site quietly falls back to the sample content in
   data.js, so nothing breaks while you set this up.
   ========================================================================== */

window.SUPABASE_CONFIG = {
  url: '',
  key: ''
};
