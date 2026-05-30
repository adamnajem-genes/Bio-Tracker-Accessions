import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DATABASES, DB_LIST, type DbKey } from "@/lib/databases";
import { Plus, Upload, Download, FolderKanban, Database, ExternalLink, FlaskConical, UserCog } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { Entry } from "./EntriesTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: Entry[];
  projects: Array<{ id: string; name: string; color: string }>;
  onSelectProject: (id: string | "all") => void;
  onSelectDb: (db: DbKey | "all") => void;
  onAddEntry: () => void;
  onImport: () => void;
  onNewProject: () => void;
  onExportFocus: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  entries,
  projects,
  onSelectProject,
  onSelectDb,
  onAddEntry,
  onImport,
  onNewProject,
  onExportFocus,
}: Props) {
  const navigate = useNavigate();

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const usedDbs = Array.from(new Set(entries.map((e) => e.database))).slice(0, 12);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to anything · search accessions, projects, actions…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { onOpenChange(false); onAddEntry(); }}>
            <Plus className="mr-2 h-4 w-4" /> Track an accession
            <span className="ml-auto text-xs text-muted-foreground">N</span>
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); onImport(); }}>
            <Upload className="mr-2 h-4 w-4" /> Mass import…
            <span className="ml-auto text-xs text-muted-foreground">I</span>
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); onNewProject(); }}>
            <FolderKanban className="mr-2 h-4 w-4" /> New project
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); onExportFocus(); }}>
            <Download className="mr-2 h-4 w-4" /> Hand off to R / Python / CSV
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => { onOpenChange(false); navigate({ to: "/" }); }}>
            <FlaskConical className="mr-2 h-4 w-4" /> Deck
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate({ to: "/account" }); }}>
            <UserCog className="mr-2 h-4 w-4" /> Account & security
          </CommandItem>
        </CommandGroup>

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              <CommandItem onSelect={() => { onOpenChange(false); onSelectProject("all"); }}>
                <FolderKanban className="mr-2 h-4 w-4" /> All projects
              </CommandItem>
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`project ${p.name}`}
                  onSelect={() => { onOpenChange(false); onSelectProject(p.id); }}
                >
                  <span className="mr-2 inline-block w-3 h-3 rounded-full shadow-inner" style={{ background: p.color }} />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {usedDbs.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Filter by database">
              <CommandItem onSelect={() => { onOpenChange(false); onSelectDb("all"); }}>
                <Database className="mr-2 h-4 w-4" /> All databases
              </CommandItem>
              {usedDbs.map((dbKey) => {
                const db = DATABASES[dbKey as DbKey] ?? DATABASES.OTHER;
                return (
                  <CommandItem
                    key={dbKey}
                    value={`db ${db.label} ${db.short}`}
                    onSelect={() => { onOpenChange(false); onSelectDb(dbKey as DbKey); }}
                  >
                    <span className="mr-2 inline-block w-3 h-3 rounded-full shadow-inner" style={{ background: db.color }} />
                    {db.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {entries.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Entries (${entries.length})`}>
              {entries.slice(0, 50).map((e) => {
                const db = DATABASES[e.database as DbKey] ?? DATABASES.OTHER;
                return (
                  <CommandItem
                    key={e.id}
                    value={`${e.accession_id} ${e.title ?? ""} ${e.organism ?? ""} ${e.tags?.join(" ") ?? ""}`}
                    onSelect={() => {
                      onOpenChange(false);
                      if (e.url) window.open(e.url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <span className="mr-2 text-xs font-semibold px-1.5 py-0.5 rounded text-white" style={{ background: db.color }}>
                      {db.short}
                    </span>
                    <span className="font-mono text-xs">{e.accession_id}</span>
                    {e.title && <span className="ml-2 truncate text-muted-foreground">— {e.title}</span>}
                    <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="All databases">
          {DB_LIST.filter((d) => d.key !== "OTHER").map((d) => (
            <CommandItem
              key={`all-${d.key}`}
              value={`browse ${d.label} ${d.short} ${d.note}`}
              onSelect={() => { onOpenChange(false); onSelectDb(d.key); }}
            >
              <Database className="mr-2 h-4 w-4" />
              <span>{d.label}</span>
              <span className="ml-auto text-xs text-muted-foreground truncate max-w-[260px]">{d.example}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
