import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FolderPlus } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PALETTE = ["#7dd3fc", "#86efac", "#fcd34d", "#fda4af", "#c4b5fd", "#f9a8d4"];

export function NewProjectDialog({ userId, onCreated, triggerRef }: { userId: string; onCreated: () => void; triggerRef?: React.MutableRefObject<(() => void) | null> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [busy, setBusy] = useState(false);
  if (triggerRef) triggerRef.current = () => setOpen(true);

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("projects").insert({
      user_id: userId, name: name.trim(), description: description.trim() || null, color,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Project created");
    setName(""); setDescription("");
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-white/60">
          <FolderPlus className="w-4 h-4 mr-2" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-0">
        <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="bubble-input mt-1" placeholder="p53 cancer regulation" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bubble-input mt-1" rows={2} /></div>
          <div>
            <Label>Color tag</Label>
            <div className="flex gap-2 mt-2">
              {PALETTE.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className="w-8 h-8 rounded-full border-2 shadow-md"
                  style={{ background: c, borderColor: color === c ? "white" : "transparent", boxShadow: color === c ? "0 0 0 2px " + c : undefined }} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy} className="aqua-pill border-0"><Plus className="w-4 h-4 mr-1" />Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
