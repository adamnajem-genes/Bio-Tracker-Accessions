import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { DB_LIST, DATABASES, detectDatabase, type DbKey } from "@/lib/databases";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { enrichAccession } from "@/lib/enrich.functions";

interface Props {
  userId: string;
  projects: Array<{ id: string; name: string }>;
  onCreated: () => void;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}

export function AddEntryDialog({ userId, projects, onCreated, triggerRef }: Props) {
  const [open, setOpen] = useState(false);
  const [accession, setAccession] = useState("");
  const [db, setDb] = useState<DbKey>("NCBI_NUCLEOTIDE");
  const [autoDetected, setAutoDetected] = useState(false);
  const [title, setTitle] = useState("");
  const [organism, setOrganism] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [status, setStatus] = useState("collected");
  const [busy, setBusy] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichSource, setEnrichSource] = useState<string | null>(null);
  const enrichTimer = useRef<number | null>(null);
  const enrich = useServerFn(enrichAccession);

  // expose open() to parent (so the command palette / hotkeys can trigger us)
  if (triggerRef) triggerRef.current = () => setOpen(true);

  function runEnrich(acc: string, dbKey: DbKey) {
    if (enrichTimer.current) window.clearTimeout(enrichTimer.current);
    enrichTimer.current = window.setTimeout(async () => {
      if (!acc || dbKey === "OTHER") return;
      setEnriching(true);
      setEnrichSource(null);
      try {
        const r = await enrich({ data: { database: dbKey, accession: acc } });
        // Only fill fields that are still empty so we don't blow away user input
        if (r.title) setTitle((cur) => cur || r.title!);
        if (r.organism) setOrganism((cur) => cur || r.organism!);
        if (r.description) setNotes((cur) => cur || r.description!);
        if (r.source) setEnrichSource(r.source);
        if (!r.title && !r.organism && !r.description) setEnrichSource("(no metadata returned)");
      } catch {
        setEnrichSource(null);
      } finally {
        setEnriching(false);
      }
    }, 450);
  }

  function onAccChange(v: string) {
    setAccession(v);
    setEnrichSource(null);
    let nextDb = db;
    if (!autoDetected || db === "OTHER") {
      const detected = detectDatabase(v);
      if (detected !== "OTHER") {
        nextDb = detected;
        setDb(detected);
        setAutoDetected(true);
      }
    }
    if (v.trim().length >= 3) runEnrich(v.trim(), nextDb);
  }

  function onDbChange(v: DbKey) {
    setDb(v);
    setAutoDetected(true);
    if (accession.trim().length >= 3) runEnrich(accession.trim(), v);
  }

  function reset() {
    setAccession(""); setTitle(""); setOrganism(""); setTags(""); setNotes("");
    setAutoDetected(false); setEnrichSource(null); setProjectId("none"); setStatus("collected");
  }

  async function handleSave() {
    if (!accession.trim()) {
      toast.error("Accession ID required");
      return;
    }
    setBusy(true);
    const info = DATABASES[db];
    const { error } = await supabase.from("entries").insert({
      user_id: userId,
      project_id: projectId === "none" ? null : projectId,
      database: db,
      entry_type: info.category,
      accession_id: accession.trim(),
      title: title.trim() || null,
      organism: organism.trim() || null,
      url: info.url(accession.trim()),
      notes: notes.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      status,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Added to deck");
    reset();
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="aqua-pill border-0 hover:opacity-90">
          <Plus className="w-4 h-4 mr-1" /> Track accession
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-0 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Track an accession</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Accession ID *</Label>
            <div className="relative mt-1">
              <Input
                value={accession}
                onChange={(e) => onAccChange(e.target.value)}
                placeholder="e.g. NM_001301717 or P04637"
                className="bubble-input font-mono pr-9"
                autoFocus
              />
              {enriching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
              )}
              {!enriching && enrichSource && enrichSource !== "(no metadata returned)" && (
                <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-muted-foreground">
                {accession && DATABASES[db] ? DATABASES[db].note : "Paste an ID — we'll auto-detect the source and pull metadata."}
              </span>
              {enrichSource && (
                <span className={`shrink-0 ml-2 ${enrichSource.startsWith("(") ? "text-muted-foreground italic" : "text-emerald-700 font-medium"}`}>
                  {enrichSource.startsWith("(") ? enrichSource : `↳ via ${enrichSource}`}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Database</Label>
              <Select value={db} onValueChange={(v) => onDbChange(v as DbKey)}>
                <SelectTrigger className="bubble-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {DB_LIST.map((d) => (
                    <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="bubble-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Title / gene symbol</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bubble-input mt-1" placeholder="TP53" />
            </div>
            <div>
              <Label>Organism</Label>
              <Input value={organism} onChange={(e) => setOrganism(e.target.value)} className="bubble-input mt-1" placeholder="Homo sapiens" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tags (comma sep.)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} className="bubble-input mt-1" placeholder="rna-seq, control" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bubble-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="analyzing">Analyzing</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bubble-input mt-1" rows={3} placeholder="Why this matters to the project…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy} className="aqua-pill border-0">Save entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
