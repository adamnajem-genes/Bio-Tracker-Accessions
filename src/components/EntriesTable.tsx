import { useMemo, useState } from "react";
import { ExternalLink, Trash2, Copy, X, Tag, FolderInput, ChevronDown, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DATABASES, type DbKey } from "@/lib/databases";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Entry {
  id: string;
  database: string;
  accession_id: string;
  title: string | null;
  organism: string | null;
  url: string | null;
  notes: string | null;
  tags: string[];
  status: string;
  project_id: string | null;
  created_at: string;
}

interface Props {
  entries: Entry[];
  projects: Array<{ id: string; name: string; color: string }>;
  userId: string;
  onChanged: () => void;
  /** Full entry set used to detect duplicates across projects. Defaults to entries. */
  allEntries?: Entry[];
}

const STATUS_STYLES: Record<string, string> = {
  collected: "bg-sky-200/70 text-sky-900",
  reviewing: "bg-amber-200/70 text-amber-900",
  analyzing: "bg-violet-200/70 text-violet-900",
  done: "bg-emerald-200/70 text-emerald-900",
};

const STATUS_LABELS: Record<string, string> = {
  collected: "Collected",
  reviewing: "Reviewing",
  analyzing: "Analyzing",
  done: "Done",
};

export function EntriesTable({ entries, projects, userId, onChanged, allEntries }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [sortKey, setSortKey] = useState<"created_at" | "database" | "accession_id" | "title" | "organism" | "status">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Duplicate detection: map "{db}:{accession}" -> array of entries (across all projects)
  const dupIndex = useMemo(() => {
    const src = allEntries ?? entries;
    const m = new Map<string, Entry[]>();
    for (const e of src) {
      const k = `${e.database}:${e.accession_id.toLowerCase()}`;
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [allEntries, entries]);

  const sorted = useMemo(() => {
    const arr = [...entries];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [entries, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  // Reconcile selection when entries change (e.g., after delete)
  const visibleIds = useMemo(() => new Set(entries.map((e) => e.id)), [entries]);
  const cleanSelected = useMemo(() => new Set([...selected].filter((id) => visibleIds.has(id))), [selected, visibleIds]);
  const allSelected = entries.length > 0 && cleanSelected.size === entries.length;
  const someSelected = cleanSelected.size > 0 && !allSelected;

  function toggle(id: string) {
    const next = new Set(cleanSelected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(entries.map((e) => e.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  // -------- single-row actions --------
  async function remove(entry: Entry) {
    const snapshot = entry;
    const { error } = await supabase.from("entries").delete().eq("id", entry.id);
    if (error) return toast.error(error.message);
    onChanged();
    toast.success("Entry removed", {
      action: {
        label: "Undo",
        onClick: async () => {
          const { error: rErr } = await supabase.from("entries").insert({
            id: snapshot.id,
            user_id: userId,
            database: snapshot.database,
            accession_id: snapshot.accession_id,
            title: snapshot.title,
            organism: snapshot.organism,
            url: snapshot.url,
            notes: snapshot.notes,
            tags: snapshot.tags,
            status: snapshot.status,
            project_id: snapshot.project_id,
            entry_type: (DATABASES[snapshot.database as DbKey] ?? DATABASES.OTHER).category,
          });
          if (rErr) toast.error("Couldn't undo: " + rErr.message);
          else { onChanged(); toast.success("Restored"); }
        },
      },
      duration: 6000,
    });
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("entries").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied " + text);
  }

  // -------- bulk actions --------
  const selectedEntries = entries.filter((e) => cleanSelected.has(e.id));

  async function bulkDelete() {
    const snapshots = selectedEntries;
    if (!snapshots.length) return;
    const ids = snapshots.map((e) => e.id);
    const { error } = await supabase.from("entries").delete().in("id", ids);
    if (error) return toast.error(error.message);
    setSelected(new Set());
    onChanged();
    toast.success(`Removed ${snapshots.length} entr${snapshots.length === 1 ? "y" : "ies"}`, {
      action: {
        label: "Undo",
        onClick: async () => {
          const rows = snapshots.map((s) => ({
            id: s.id,
            user_id: userId,
            database: s.database,
            accession_id: s.accession_id,
            title: s.title,
            organism: s.organism,
            url: s.url,
            notes: s.notes,
            tags: s.tags,
            status: s.status,
            project_id: s.project_id,
            entry_type: (DATABASES[s.database as DbKey] ?? DATABASES.OTHER).category,
          }));
          const { error: rErr } = await supabase.from("entries").insert(rows);
          if (rErr) toast.error("Couldn't undo: " + rErr.message);
          else { onChanged(); toast.success("Restored"); }
        },
      },
      duration: 8000,
    });
  }

  async function bulkStatus(status: string) {
    const ids = [...cleanSelected];
    const { error } = await supabase.from("entries").update({ status }).in("id", ids);
    if (error) return toast.error(error.message);
    onChanged();
    toast.success(`Marked ${ids.length} as ${STATUS_LABELS[status]}`);
  }

  async function bulkMoveProject(projectId: string | null) {
    const ids = [...cleanSelected];
    const { error } = await supabase.from("entries").update({ project_id: projectId }).in("id", ids);
    if (error) return toast.error(error.message);
    onChanged();
    const label = projectId ? projects.find((p) => p.id === projectId)?.name ?? "project" : "no project";
    toast.success(`Moved ${ids.length} to ${label}`);
  }

  async function bulkAddTag(tag: string) {
    const t = tag.trim();
    if (!t) return;
    // Merge per-row to avoid duplicates
    for (const e of selectedEntries) {
      const next = Array.from(new Set([...(e.tags ?? []), t]));
      await supabase.from("entries").update({ tags: next }).eq("id", e.id);
    }
    setTagInput("");
    onChanged();
    toast.success(`Tagged ${selectedEntries.length} with "${t}"`);
  }

  if (entries.length === 0) {
    // Parent handles empty state now
    return null;
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Bulk action bar */}
      {cleanSelected.size > 0 && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-sky-100/80 to-emerald-100/60 border-b border-white/70 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{cleanSelected.size} selected</span>
          <Button size="sm" variant="ghost" onClick={clearSelection} className="h-7 px-2">
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
          <div className="mx-1 h-4 w-px bg-white/80" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 bg-white/70 border-white/80">
                Status <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Set status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <DropdownMenuItem key={k} onClick={() => bulkStatus(k)}>{v}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 bg-white/70 border-white/80">
                <FolderInput className="w-3.5 h-3.5 mr-1" /> Project <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Move to project</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => bulkMoveProject(null)}>— None —</DropdownMenuItem>
              {projects.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => bulkMoveProject(p.id)}>
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ background: p.color }} />
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <form
            onSubmit={(e) => { e.preventDefault(); bulkAddTag(tagInput); }}
            className="flex items-center gap-1"
          >
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="add tag…"
              className="h-7 w-32 bg-white/70 border-white/80 text-xs"
            />
            <Button type="submit" size="sm" variant="ghost" className="h-7 px-2" disabled={!tagInput.trim()}>Add</Button>
          </form>

          <div className="ml-auto">
            <Button size="sm" variant="destructive" onClick={bulkDelete} className="h-7">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/60 bg-white/40 backdrop-blur">
              <th className="px-3 py-3 w-8">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <SortableTh label="Database" k="database" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Accession" k="accession_id" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Title / Symbol" k="title" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortableTh label="Organism" k="organism" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Tags</th>
              <SortableTh label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => {
              const db = DATABASES[e.database as DbKey] ?? DATABASES.OTHER;
              const project = projects.find((p) => p.id === e.project_id);
              const isChecked = cleanSelected.has(e.id);
              const dupKey = `${e.database}:${e.accession_id.toLowerCase()}`;
              const dups = (dupIndex.get(dupKey) ?? []).filter((d) => d.id !== e.id);
              const otherProjects = Array.from(
                new Set(
                  dups
                    .map((d) => projects.find((p) => p.id === d.project_id)?.name)
                    .filter((n): n is string => Boolean(n) && n !== project?.name),
                ),
              );
              return (
                <tr
                  key={e.id}
                  className={`border-b border-white/40 transition-colors ${isChecked ? "bg-sky-50/60" : "hover:bg-white/40"}`}
                >
                  <td className="px-3 py-3">
                    <Checkbox checked={isChecked} onCheckedChange={() => toggle(e.id)} aria-label="Select row" />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                      style={{ background: db.color }}
                    >
                      {db.short}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div className="flex items-center gap-2">
                      <button onClick={() => copy(e.accession_id)} className="hover:underline group inline-flex items-center gap-1">
                        {e.accession_id}
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60" />
                      </button>
                      {dups.length > 0 && (
                        <span
                          title={otherProjects.length ? `Also in: ${otherProjects.join(", ")}` : `${dups.length} duplicate(s) in your deck`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200/80 text-amber-900 border border-amber-300/60"
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {otherProjects.length ? `also in ${otherProjects[0]}${otherProjects.length > 1 ? ` +${otherProjects.length - 1}` : ""}` : `×${dups.length + 1}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{e.title || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3 italic text-muted-foreground">{e.organism || "—"}</td>
                  <td className="px-4 py-3">
                    {project ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ background: project.color }} />
                        {project.name}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {e.tags.map((t) => (
                        <Badge key={t} variant="outline" className="bg-white/60 border-white/70 text-xs">{t}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={e.status}
                      onChange={(ev) => updateStatus(e.id, ev.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_STYLES[e.status] ?? "bg-muted"}`}
                    >
                      <option value="collected">Collected</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="analyzing">Analyzing</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {e.url && (
                        <Button size="icon" variant="ghost" asChild className="h-8 w-8 hover:bg-white/70">
                          <a href={e.url} target="_blank" rel="noreferrer" title="Open source">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => remove(e)} className="h-8 w-8 hover:bg-red-100" title="Remove (with undo)">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableTh<K extends string>({
  label, k, sortKey, sortDir, onClick,
}: {
  label: string;
  k: K;
  sortKey: string;
  sortDir: "asc" | "desc";
  onClick: (k: K) => void;
}) {
  const active = sortKey === k;
  return (
    <th className="px-4 py-3 font-semibold">
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 hover:text-sky-700 transition-colors ${active ? "text-sky-700" : ""}`}
      >
        {label}
        {active && (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
      </button>
    </th>
  );
}
