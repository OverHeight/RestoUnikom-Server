import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase credentials not configured");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    await supabase.auth.getSession();
    console.log("Supabase connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to Supabase:", error);
  }
})();
