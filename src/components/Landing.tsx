import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FlaskConical, Database, Zap, Download, Command, Shield, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-landing.jpg";

export function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="aqua-pill w-10 h-10 rounded-2xl flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
          <span className="font-display text-xl font-bold">AccessionDeck</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm text-foreground/80 hover:text-foreground px-3 py-2">
            Sign in
          </Link>
          <Button asChild className="aqua-pill border-0 hover:opacity-90">
            <Link to="/login">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-16 pb-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 glass px-3 py-1 text-xs font-semibold text-sky-900">
            <Zap className="w-3.5 h-3.5" /> Auto-enriches from NCBI, UniProt, Ensembl, PDB
          </span>
          <h1 className="font-display font-extrabold text-5xl lg:text-6xl leading-[1.05] mt-5 tracking-tight">
            The lab notebook for your <span className="text-sky-600">accessions</span>.
          </h1>
          <p className="mt-5 text-lg text-foreground/80 max-w-xl">
            Paste an ID from NCBI, BLAST, MGI, UniProt — anywhere — and AccessionDeck pulls the metadata, organizes it by project, and hands it off clean to R, Python, or a spreadsheet.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="aqua-pill border-0 hover:opacity-90 text-base">
              <Link to="/login">
                Start your deck <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/70 border-white/70 backdrop-blur text-base">
              <a href="#features">See how it works</a>
            </Button>
          </div>
          <div className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Your data stays private. Row-level encrypted storage per user.
          </div>
        </div>

        <div className="relative">
          <div className="glass-card p-3 rotate-1 hover:rotate-0 transition-transform duration-500">
            <img
              src={heroImg}
              alt="Frutiger Aero illustration of test tubes and a glass DNA helix floating in a bright sky"
              width={1280}
              height={960}
              className="w-full rounded-2xl"
            />
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 lg:px-8 pb-20">
        <h2 className="font-display text-3xl font-bold text-center mb-2">Built for people who actually use the databases</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          AccessionDeck knows the difference between an SRR, a PDB code, and an MGI marker — and treats each one the way the source treats it.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          <Feature
            icon={<Database className="w-5 h-5" />}
            title="24+ databases, one deck"
            body="NCBI Nucleotide, Protein, Gene, SRA, GEO, PubMed, BLAST, MGI, Ensembl, UniProt, PDB, KEGG, GO, Reactome, FlyBase, WormBase, ZFIN, TAIR — and a catch-all."
          />
          <Feature
            icon={<Zap className="w-5 h-5" />}
            title="Auto-fills your metadata"
            body="Paste an accession. We hit E-utilities / UniProt REST / Ensembl REST / RCSB and fill in title, organism, length, description while you keep typing."
          />
          <Feature
            icon={<Command className="w-5 h-5" />}
            title="Keyboard-first"
            body="⌘K opens a palette over everything. / focuses search. n adds. i imports. Undo on every destructive action."
          />
          <Feature
            icon={<Download className="w-5 h-5" />}
            title="Hand-off to your pipeline"
            body="Export to CSV, TSV, or a ready-to-run R / Python snippet. Your scripting stays in your language; the bookkeeping lives here."
          />
          <Feature
            icon={<FlaskConical className="w-5 h-5" />}
            title="Bulk import"
            body="Paste 200 accessions at once, mixed databases, and we'll detect each one and enrich them in the background."
          />
          <Feature
            icon={<Shield className="w-5 h-5" />}
            title="Private by default"
            body="Auth-gated, RLS-enforced. Built for sensitive research data — only you can see your deck."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 lg:px-8 pb-24">
        <div className="glass-card p-10 text-center">
          <h3 className="font-display text-3xl font-bold mb-2">Stop losing accessions in spreadsheets.</h3>
          <p className="text-muted-foreground mb-6">Free to start. Two clicks to your first tracked entry.</p>
          <Button asChild size="lg" className="aqua-pill border-0 hover:opacity-90 text-base">
            <Link to="/login">
              Open AccessionDeck <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-4 lg:px-8 pb-10 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} AccessionDeck · A bioinformatics workbench</span>
        <span>Built with public APIs from NCBI, UniProt, Ensembl, RCSB PDB.</span>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="glass-card p-5 transition-transform hover:-translate-y-1">
      <div className="aqua-pill w-10 h-10 rounded-xl flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-display font-bold text-lg mb-1">{title}</h3>
      <p className="text-sm text-foreground/75">{body}</p>
    </div>
  );
}
