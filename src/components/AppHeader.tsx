import { Link, useNavigate } from "@tanstack/react-router";
import { FlaskConical, LogOut, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AppHeader({ user }: { user: User | null }) {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }
  return (
    <header className="glass sticky top-4 mx-4 lg:mx-8 mt-4 z-30 px-5 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="aqua-pill w-9 h-9 rounded-xl flex items-center justify-center">
          <FlaskConical className="w-4 h-4" />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-tight">AccessionDeck</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">bio data workbench</div>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        {user && (
          <>
            <span className="hidden sm:block text-sm text-muted-foreground mr-1">{user.email}</span>
            <Link to="/account">
              <Button size="sm" variant="ghost" className="bg-white/50 hover:bg-white/80">
                <UserCog className="w-4 h-4 mr-1" /> Account
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={signOut} className="bg-white/50 hover:bg-white/80">
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
