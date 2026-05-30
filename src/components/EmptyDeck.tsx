import { Sparkles, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSeed: () => void;
  onAdd: () => void;
  onImport: () => void;
  seeding?: boolean;
}

export function EmptyDeck({ onSeed, onAdd, onImport, seeding }: Props) {
  return (
    <div className="glass-card p-10 text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(60% 80% at 20% 0%, color-mix(in oklab, var(--aqua) 40%, transparent), transparent 70%), radial-gradient(50% 70% at 100% 100%, color-mix(in oklab, var(--leaf) 35%, transparent), transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="text-6xl mb-3" aria-hidden>🧬</div>
        <h3 className="font-display text-2xl font-bold mb-2">Your deck is empty</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Track accessions across NCBI, UniProt, Ensembl, PDB, MGI and more. The deck auto-detects the
          source database and pulls metadata so you don't have to.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onSeed} disabled={seeding} className="aqua-pill border-0">
            <Sparkles className="w-4 h-4 mr-1" />
            {seeding ? "Building demo…" : "Load TP53 demo deck"}
          </Button>
          <Button onClick={onAdd} variant="outline" className="bg-white/60 border-white/70">
            <Plus className="w-4 h-4 mr-1" /> Track an accession
          </Button>
          <Button onClick={onImport} variant="outline" className="bg-white/60 border-white/70">
            <Upload className="w-4 h-4 mr-1" /> Mass import
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-5">
          Tip: press <kbd className="px-1.5 py-0.5 rounded bg-white/70 border border-white/80 text-[10px] font-mono">⌘K</kbd> anywhere to jump around.
        </p>
      </div>
    </div>
  );
}
