import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Permanently deletes the signed-in user's account and all owned rows.
 * Requires the user to confirm by re-entering their email exactly.
 */
export const deleteOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ confirmEmail: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!u.user?.email || u.user.email.toLowerCase() !== data.confirmEmail.toLowerCase()) {
      throw new Error("Email confirmation did not match.");
    }
    await supabaseAdmin.from("entries").delete().eq("user_id", userId);
    await supabaseAdmin.from("projects").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });
