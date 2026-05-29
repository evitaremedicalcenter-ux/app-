import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rkytbsemqhhabibhtyrx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreXRic2VtcWhoYWJpYmh0eXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NjY1NzcsImV4cCI6MjA5NTU0MjU3N30.hnRrwOUB2vMjhGduzHfJdj9vwMx0K9EtdbYwZIPIAvA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
