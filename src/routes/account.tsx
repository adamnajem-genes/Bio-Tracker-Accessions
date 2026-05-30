import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, Key, Trash2, AlertTriangle } from "lucide-react";
import { deleteOwnAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account · AccessionDeck" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const deleteAccount = useServerFn(deleteOwnAccount);

  const [newEmail, setNewEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

  if (!user) return null;

  async function onChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Confirmation email sent. Check both inboxes.");
    setNewEmail("");
  }

  async function onChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy("pw");
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    setNewPw("");
  }

  async function onDelete() {
    if (!confirm("This permanently deletes your account, projects, and all collected entries. Continue?")) return;
    setBusy("del");
    try {
      await deleteAccount({ data: { confirmEmail } });
      await supabase.auth.signOut();
      toast.success("Account deleted.");
      navigate({ to: "/login", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <AppHeader user={user} />
      <main className="max-w-2xl mx-auto px-4 lg:px-8 mt-8 space-y-5">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to deck
        </Link>

        <div className="glass-card p-6">
          <h1 className="font-display text-2xl font-bold mb-1">Account & security</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-mono">{user.email}</span>
          </p>
        </div>


        <section className="glass-card p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="aqua-pill w-9 h-9 rounded-xl flex items-center justify-center shrink-0"><Mail className="w-4 h-4" /></div>
            <div>
              <h2 className="font-semibold">Change email</h2>
              <p className="text-xs text-muted-foreground">You'll receive confirmation at both old and new addresses.</p>
            </div>
          </div>
          <form onSubmit={onChangeEmail} className="flex gap-2">
            <Input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" className="bubble-input" />
            <Button type="submit" disabled={busy === "email"} className="aqua-pill border-0">Update</Button>
          </form>
        </section>

        <section className="glass-card p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="aqua-pill w-9 h-9 rounded-xl flex items-center justify-center shrink-0"><Key className="w-4 h-4" /></div>
            <div>
              <h2 className="font-semibold">Change password</h2>
              <p className="text-xs text-muted-foreground">Minimum 8 characters. Use a unique passphrase.</p>
            </div>
          </div>
          <form onSubmit={onChangePw} className="flex gap-2">
            <Input type="password" required minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" className="bubble-input" />
            <Button type="submit" disabled={busy === "pw"} className="aqua-pill border-0">Update</Button>
          </form>
        </section>

        <section className="glass-card p-5 border-2 border-destructive/30">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-destructive/15 text-destructive"><Trash2 className="w-4 h-4" /></div>
            <div>
              <h2 className="font-semibold text-destructive">Delete account</h2>
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                Irreversible. Deletes your profile, all projects, and every collected accession.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Type your email to confirm</Label>
            <Input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder={user.email ?? ""} className="bubble-input" />
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={busy === "del" || confirmEmail.toLowerCase() !== (user.email ?? "").toLowerCase()}
              className="w-full"
            >
              Permanently delete my account
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
