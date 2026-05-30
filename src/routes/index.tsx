import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { AddEntryDialog } from "@/components/AddEntryDialog";
import { ImportEntriesDialog } from "@/components/ImportEntriesDialog";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { EntriesTable, type Entry } from "@/components/EntriesTable";
import { ExportMenu } from "@/components/ExportMenu";
import { EmptyDeck } from "@/components/EmptyDeck";
import { DeckSkeleton } from "@/components/DeckSkeleton";
import { CommandPalette } from "@/components/CommandPalette";
import { Landing } from "@/components/Landing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Database, FolderKanban, TrendingUp, Filter, X, Command, Pencil, Trash2, Check, CornerDownLeft } from "lucide-react";
import { DATABASES, DB_LIST, type DbKey } from "@/lib/databases";
import { seedSampleProject } from "@/lib/sample-data";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { deleteProject, renameProject } from "@/lib/projects.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AccessionDeck — bioinformatics tracking dashboard" },
      { name: "description", content: "Track NCBI, BLAST, MGI, UniProt, Ensembl and other open bio databases in one interactive deck. Auto-enriches metadata. Export to R, Python, CSV." },
      { property: "og:title", content: "AccessionDeck — your bioinformatics deck" },
      { property: "og:description", content: "Interactive workbench for collecting and organizing bioinformatics accessions across NCBI, BLAST, MGI, and more." },
      { property: "og:image", content: "/og-image.jpg" },
      { name: "twitter:image", content: "/og-image.jpg" },
    ],
  }),
  component: DashboardPage,
});

interface Project { id: string; name: string; color: string; description: string | null; }

function DashboardPage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeProject, setActiveProject] = useState<string | "all">("all");
  const [activeDb, setActiveDb] = useState<DbKey | "all">("all");
  const [query, setQuery] = useState("");
  const [firstLoad, setFirstLoad] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const addEntryRef = useRef<(() => void) | null>(null);
  const importRef = useRef<(() => void) | null>(null);
  const newProjectRef = useRef<(() => void) | null>(null);
  const exportFocusRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const doDeleteProject = useServerFn(deleteProject);
  const doRenameProject = useServerFn(renameProject);

  useEffect(() => {
    if (editingProjectId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProjectId]);

  async function handleDeleteProject(projectId: string) {
    const name = projects.find((p) => p.id === projectId)?.name;
    if (!confirm(`Delete "${name}"? Its entries will remain in your deck but become unassigned.`)) return;
    try {
      await doDeleteProject({ data: { projectId } });
      toast.success("Project deleted");
      if (activeProject === projectId) setActiveProject("all");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function handleRenameProject(projectId: string) {
    const trimmed = editName.trim();
    if (!trimmed) { setEditingProjectId(null); return; }
    try {
      await doRenameProject({ data: { projectId, name: trimmed } });
      toast.success("Project renamed");
      setEditingProjectId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rename failed");
    }
  }

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: ps }, { data: es }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("entries").select("*").order("created_at", { ascending: false }),
    ]);
    setProjects((ps ?? []) as Project[]);
    setEntries((es ?? []) as Entry[]);
    setFirstLoad(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Page-level shortcuts: '/' focus search, 'n' new entry, 'i' import
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === "n") { e.preventDefault(); addEntryRef.current?.(); }
      else if (e.key === "i") { e.preventDefault(); importRef.current?.(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (activeProject !== "all" && e.project_id !== activeProject) return false;
      if (activeDb !== "all" && e.database !== activeDb) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = [e.accession_id, e.title, e.organism, e.notes, ...(e.tags || [])].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, activeProject, activeDb, query]);

  const dbCounts = useMemo(() => {
    const m: Record<string, number> = {};
    entries.forEach((e) => { m[e.database] = (m[e.database] ?? 0) + 1; });
    return m;
  }, [entries]);

  const statusCounts = useMemo(() => {
    const m = { collected: 0, reviewing: 0, analyzing: 0, done: 0 } as Record<string, number>;
    entries.forEach((e) => { m[e.status] = (m[e.status] ?? 0) + 1; });
    return m;
  }, [entries]);

  // Per-project document title
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (activeProject === "all") {
      document.title = "AccessionDeck — bioinformatics tracking dashboard";
    } else {
      const p = projects.find((x) => x.id === activeProject);
      document.title = p ? `${p.name} · AccessionDeck` : "AccessionDeck";
    }
  }, [activeProject, projects]);

  async function handleSeed() {
    if (!user) return;
    setSeeding(true);
    try {
      const ok = await seedSampleProject(user.id);
      if (ok) {
        await load();
        toast.success("Demo deck loaded — explore TP53 across 7 databases.");
      } else {
        toast.info("You already have data — nothing to seed.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  if (loading) return <DeckSkeleton />;
  if (!user) return <Landing />;
  if (firstLoad) return <DeckSkeleton />;

  const isEmpty = entries.length === 0 && projects.length === 0;

  return (
    <div className="min-h-screen pb-16">
      <AppHeader user={user} />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        entries={entries}
        projects={projects}
        onSelectProject={setActiveProject}
        onSelectDb={setActiveDb}
        onAddEntry={() => addEntryRef.current?.()}
        onImport={() => importRef.current?.()}
        onNewProject={() => newProjectRef.current?.()}
        onExportFocus={() => exportFocusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-8 space-y-6">
        {isEmpty ? (
          <>
            <EmptyDeck
              onSeed={handleSeed}
              onAdd={() => addEntryRef.current?.()}
              onImport={() => importRef.current?.()}
              seeding={seeding}
            />
            {/* Hidden mounted triggers so refs are populated */}
            <div className="hidden">
              <AddEntryDialog userId={user.id} projects={projects} onCreated={load} triggerRef={addEntryRef} />
              <ImportEntriesDialog userId={user.id} projects={projects} onCreated={load} triggerRef={importRef} />
              <NewProjectDialog userId={user.id} onCreated={load} triggerRef={newProjectRef} />
            </div>
          </>
        ) : (
          <>
            {/* Hero stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total entries" value={entries.length} icon={<Database className="w-5 h-5" />} accent="aqua" />
              <StatCard label="Projects" value={projects.length} icon={<FolderKanban className="w-5 h-5" />} accent="leaf" />
              <StatCard label="Databases used" value={Object.keys(dbCounts).length} icon={<TrendingUp className="w-5 h-5" />} accent="aqua" />
              <StatCard label="Analyzing now" value={statusCounts.analyzing + statusCounts.reviewing} icon={<Filter className="w-5 h-5" />} accent="leaf" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
              {/* Sidebar */}
              <aside className="space-y-4">
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold">Projects</h3>
                  </div>
                  <div className="space-y-1">
                    <SidebarItem active={activeProject === "all"} onClick={() => setActiveProject("all")} label="All projects" count={entries.length} />
                    {projects.map((p) => (
                      <ProjectSidebarItem
                        key={p.id}
                        project={p}
                        active={activeProject === p.id}
                        onClick={() => setActiveProject(p.id)}
                        count={entries.filter((e) => e.project_id === p.id).length}
                        editing={editingProjectId === p.id}
                        editName={editName}
                        onEditNameChange={setEditName}
                        onStartEdit={(id, name) => { setEditingProjectId(id); setEditName(name); }}
                        onCancelEdit={() => setEditingProjectId(null)}
                        onConfirmEdit={handleRenameProject}
                        onDelete={handleDeleteProject}
                        editInputRef={editInputRef}
                      />
                    ))}
                    <NewProjectDialog userId={user.id} onCreated={load} triggerRef={newProjectRef} />
                  </div>
                </div>

                <div className="glass-card p-4">
                  <h3 className="font-display font-bold mb-3">Databases</h3>
                  <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                    <SidebarItem active={activeDb === "all"} onClick={() => setActiveDb("all")} label="All databases" count={entries.length} />
                    {DB_LIST.filter((d) => dbCounts[d.key]).map((d) => (
                      <SidebarItem
                        key={d.key}
                        active={activeDb === d.key}
                        onClick={() => setActiveDb(d.key)}
                        label={d.short}
                        color={d.color}
                        count={dbCounts[d.key] ?? 0}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setPaletteOpen(true)}
                  className="glass-card w-full p-3 text-left text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Command className="w-3.5 h-3.5" />
                  <span>Jump to anything</span>
                  <kbd className="ml-auto px-1.5 py-0.5 rounded bg-white/70 border border-white/80 text-[10px] font-mono">⌘K</kbd>
                </button>
              </aside>

              {/* Main content */}
              <section className="space-y-4">
                <div ref={exportFocusRef} className="glass-card p-4 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search accessions, titles, organisms, tags, notes… (press /)"
                      className="bubble-input pl-9"
                    />
                  </div>
                  {(activeProject !== "all" || activeDb !== "all") && (
                    <Button variant="ghost" size="sm" onClick={() => { setActiveProject("all"); setActiveDb("all"); }}>
                      <X className="w-4 h-4 mr-1" /> Clear filters
                    </Button>
                  )}
                  <ExportMenu entries={filtered} />
                  <ImportEntriesDialog userId={user.id} projects={projects} onCreated={load} triggerRef={importRef} />
                  <AddEntryDialog userId={user.id} projects={projects} onCreated={load} triggerRef={addEntryRef} />
                </div>

                {/* Active context banner */}
                {(activeProject !== "all" || activeDb !== "all") && (
                  <div className="glass px-4 py-2 text-sm text-muted-foreground">
                    Showing <strong className="text-foreground">{filtered.length}</strong> of {entries.length}
                    {activeProject !== "all" && <> · project <strong className="text-foreground">{projects.find((p) => p.id === activeProject)?.name}</strong></>}
                    {activeDb !== "all" && <> · database <strong className="text-foreground">{DATABASES[activeDb].label}</strong></>}
                  </div>
                )}

                {activeDb !== "all" && (
                  <div className="glass-card p-4 text-sm">
                    <div className="font-semibold mb-1">{DATABASES[activeDb].label}</div>
                    <p className="text-muted-foreground">{DATABASES[activeDb].note}</p>
                  </div>
                )}

                {filtered.length === 0 ? (
                  <div className="glass-card p-10 text-center">
                    <div className="text-4xl mb-2">🔍</div>
                    <h3 className="font-display text-lg font-bold mb-1">No matches</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Nothing in the deck matches the current filters.
                    </p>
                    <Button size="sm" variant="ghost" onClick={() => { setActiveProject("all"); setActiveDb("all"); setQuery(""); }}>
                      <X className="w-4 h-4 mr-1" /> Clear all filters
                    </Button>
                  </div>
                ) : (
                  <EntriesTable entries={filtered} allEntries={entries} projects={projects} userId={user.id} onChanged={load} />
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: "aqua" | "leaf" }) {
  return (
    <div className="glass-card p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-2">
        <div className={`${accent === "aqua" ? "aqua-pill" : "leaf-pill"} w-10 h-10 rounded-xl flex items-center justify-center`}>{icon}</div>
        <div className="text-3xl font-display font-bold tabular-nums">{value}</div>
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function SidebarItem({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count?: number; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-all text-sm ${
        active ? "aqua-pill" : "hover:bg-white/60 text-foreground/80"
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        {color && <span className="w-2.5 h-2.5 rounded-full shadow-inner shrink-0" style={{ background: color }} />}
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && (
        <span className={`text-xs tabular-nums ${active ? "text-white/90" : "text-muted-foreground"}`}>{count}</span>
      )}
    </button>
  );
}

function ProjectSidebarItem({
  project, active, onClick, count, editing, editName, onEditNameChange,
  onStartEdit, onCancelEdit, onConfirmEdit, onDelete, editInputRef,
}: {
  project: Project;
  active: boolean;
  onClick: () => void;
  count: number;
  editing: boolean;
  editName: string;
  onEditNameChange: (v: string) => void;
  onStartEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
  onConfirmEdit: (id: string) => void;
  onDelete: (id: string) => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (editing) {
    return (
      <div className="w-full px-3 py-2 rounded-xl flex items-center gap-2 text-sm aqua-pill">
        <span className="w-2.5 h-2.5 rounded-full shadow-inner shrink-0" style={{ background: project.color }} />
        <input
          ref={editInputRef}
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onConfirmEdit(project.id); }
            else if (e.key === "Escape") { e.preventDefault(); onCancelEdit(); }
          }}
          className="flex-1 min-w-0 bg-transparent text-white placeholder-white/70 outline-none"
        />
        <button onClick={() => onConfirmEdit(project.id)} className="shrink-0 p-1 rounded-md hover:bg-white/20" title="Save">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={onCancelEdit} className="shrink-0 p-1 rounded-md hover:bg-white/20" title="Cancel">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-all text-sm group ${
        active ? "aqua-pill" : "hover:bg-white/60 text-foreground/80"
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shadow-inner shrink-0" style={{ background: project.color }} />
        <span className="truncate">{project.name}</span>
      </span>
      <span className="flex items-center gap-1.5">
        {!active && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onStartEdit(project.id, project.name); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/40 transition-opacity"
              title="Rename"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/40 transition-opacity"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
        <span className={`text-xs tabular-nums ${active ? "text-white/90" : "text-muted-foreground"}`}>{count}</span>
      </span>
    </button>
  );
}
