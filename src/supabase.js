import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rkytbsemqhhabibhtyrx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pbIFwkcs1S0Ry1bT5sQfEg_RhsNsmWH";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
