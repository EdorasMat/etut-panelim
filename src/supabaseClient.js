import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aaotxnjyuzsicinlbigt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_L3cm0Hn6sb6VLxbssKLISg_wE1tTALz";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
