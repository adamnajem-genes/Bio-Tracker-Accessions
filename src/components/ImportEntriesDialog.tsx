import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText } from "lucide-react";
import { DATABASES, DB_LIST, detectDatabase, type DbKey } from "@/lib/databases";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  projects: Array<{ id: string; name: string }>;
  onCreated: () => void;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}

interface ParsedRow {
  accession_id: string;
  database: DbKey;
  title?: string | null;
  organism?: string | null;
  tags?: string[];
  notes?: string | null;
}

/** Parse a single CSV/TSV line, supporting "quoted, commas". */
function splitDelim(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseInput(raw: string): ParsedRow[] {
  const text = raw.trim();
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  // Detect delimiter from first line
  const firstLine = lines[0];
  const delim = firstLine.includes("\t") ? "\t" : firstLine.includes(",") ? "," : "";

  // If no delimiter — treat each line as a bare accession
  if (!delim) {
    return lines.map((acc) => ({
      accession_id: acc.trim(),
      database: detectDatabase(acc.trim()),
    })).filter((r) => r.accession_id);
  }

  // Look for header row
  const header = splitDelim(firstLine, delim).map((h) => h.toLowerCase());
  const known = ["accession", "accession_id", "id", "database", "db", "title", "name", "gene", "organism", "species", "tags", "notes"];
  const hasHeader = header.some((h) => known.includes(h));

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const colIdx = (names: string[]) => hasHeader ? header.findIndex((h) => names.includes(h)) : -1;

  const iAcc = hasHeader ? Math.max(colIdx(["accession", "accession_id", "id"]), 0) : 0;
  const iDb = colIdx(["database", "db"]);
  const iTitle = colIdx(["title", "name", "gene"]);
  const iOrg = colIdx(["organism", "species"]);
  const iTags = colIdx(["tags"]);
  const iNotes = colIdx(["notes"]);

  const rows: ParsedRow[] = [];
  for (const ln of dataLines) {
    const cols = splitDelim(ln, delim);
    const acc = (cols[iAcc] ?? "").trim();
    if (!acc) continue;
    const dbRaw = iDb >= 0 ? (cols[iDb] ?? "").trim().toUpperCase() : "";
    const db = (dbRaw && (DATABASES as Record<string, unknown>)[dbRaw]) ? (dbRaw as DbKey) : detectDatabase(acc);
    rows.push({
      accession_id: acc,
      database: db,
      title: iTitle >= 0 ? cols[iTitle] || null : null,
      organism: iOrg >= 0 ? cols[iOrg] || null : null,
      tags: iTags >= 0 ? (cols[iTags] || "").split(/[;,]/).map((t) => t.trim()).filter(Boolean) : [],
      notes: iNotes >= 0 ? cols[iNotes] || null : null,
    });
  }
  return rows;
}

export function ImportEntriesDialog({ userId, projects, onCreated, triggerRef }: Props) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [projectId, setProjectId] = useState("none");
  const [defaultDb, setDefaultDb] = useState<DbKey | "auto">("auto");
  const [busy, setBusy] = useState(false);
  if (triggerRef) triggerRef.current = () => setOpen(true);

  const preview = parseInput(raw).slice(0, 5);
  const totalCount = parseInput(raw).length;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_000_000) return toast.error("File too large (max 2 MB)");
    setRaw(await f.text());
  }

  async function handleImport() {
    const parsed = parseInput(raw);
    if (!parsed.length) return toast.error("No rows detected");
    if (parsed.length > 1000) return toast.error("Max 1000 rows per import");

    setBusy(true);
    const payload = parsed.map((r) => {
      const db = defaultDb === "auto" ? r.database : defaultDb;
      const info = DATABASES[db];
      return {
        user_id: userId,
        project_id: projectId === "none" ? null : projectId,
        database: db,
        entry_type: info.category,
        accession_id: r.accession_id,
        title: r.title || null,
        organism: r.organism || null,
        url: info.url(r.accession_id),
        notes: r.notes || null,
        tags: r.tags ?? [],
        status: "collected" as const,
      };
    });

    // Chunk to keep request size sane
    const chunks: typeof payload[] = [];
    for (let i = 0; i < payload.length; i += 200) chunks.push(payload.slice(i, i + 200));
    let inserted = 0;
    for (const chunk of chunks) {
      const { error } = await supabase.from("entries").insert(chunk);
      if (error) { toast.error(`Stopped at ${inserted}/${payload.length}: ${error.message}`); setBusy(false); return; }
      inserted += chunk.length;
    }

    setBusy(false);
    toast.success(`Imported ${inserted} entr${inserted === 1 ? "y" : "ies"}`);
    setRaw("");
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white/60 hover:bg-white/80 border-white/60">
          <Upload className="w-4 h-4 mr-1" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-0 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Mass import accessions</DialogTitle>
          <DialogDescription>
            Paste a CSV/TSV, upload a file, or paste one accession per line. Database is auto-detected when possible.
            Recognized columns: <code className="text-xs">accession, database, title, organism, tags, notes</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assign to project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="bubble-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default database</Label>
              <Select value={defaultDb} onValueChange={(v) => setDefaultDb(v as DbKey | "auto")}>
                <SelectTrigger className="bubble-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="auto">Auto-detect from ID</SelectItem>
                  {DB_LIST.map((d) => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Data</Label>
              <label className="text-xs text-primary hover:underline cursor-pointer inline-flex items-center gap-1">
                <FileText className="w-3 h-3" /> Upload .csv / .tsv / .txt
                <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onFile} />
              </label>
            </div>
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={8}
              placeholder={"accession,database,title,organism,tags\nNM_001301717,NCBI_NUCLEOTIDE,TP53,Homo sapiens,tumor;control\nP04637\nGSE12345"}
              className="bubble-input font-mono text-xs"
            />
          </div>

          {totalCount > 0 && (
            <div className="glass p-3 text-xs">
              <div className="font-semibold mb-2">{totalCount} row{totalCount === 1 ? "" : "s"} detected · preview</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {preview.map((r, i) => (
                  <div key={i} className="flex gap-2 font-mono">
                    <span className="text-primary">{r.accession_id}</span>
                    <span className="text-muted-foreground">→ {DATABASES[r.database].short}</span>
                    {r.title && <span className="text-muted-foreground">· {r.title}</span>}
                  </div>
                ))}
                {totalCount > preview.length && <div className="text-muted-foreground">…and {totalCount - preview.length} more</div>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={busy || !totalCount} className="aqua-pill border-0">
            Import {totalCount || ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
