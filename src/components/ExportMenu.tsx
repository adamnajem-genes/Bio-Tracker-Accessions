import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DATABASES, type DbKey } from "@/lib/databases";
import type { Entry } from "./EntriesTable";

function download(name: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function ExportMenu({ entries }: { entries: Entry[] }) {
  function asCSV() {
    const headers = ["database", "accession_id", "title", "organism", "tags", "status", "url", "notes", "created_at"];
    const rows = entries.map((e) => headers.map((h) => {
      const v = (e as unknown as Record<string, unknown>)[h];
      const s = Array.isArray(v) ? v.join(";") : v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    }).join(","));
    download("accessions.csv", [headers.join(","), ...rows].join("\n"), "text/csv");
  }
  function asJSON() {
    download("accessions.json", JSON.stringify(entries, null, 2), "application/json");
  }
  function asR() {
    const lines = [
      "# Auto-generated from AccessionDeck",
      "library(tibble)",
      "accessions <- tribble(",
      "  ~database, ~accession, ~organism, ~url,",
      ...entries.map((e) => `  "${e.database}", "${e.accession_id}", "${e.organism ?? ""}", "${e.url ?? ""}",`),
      ")",
      "",
      "# Example: fetch NCBI nucleotide records",
      "# library(rentrez); entrez_fetch(db='nuccore', id=accessions$accession[accessions$database=='NCBI_NUCLEOTIDE'], rettype='fasta')",
    ];
    download("accessions.R", lines.join("\n"), "text/plain");
  }
  function asPy() {
    const grouped: Record<string, string[]> = {};
    entries.forEach((e) => {
      (grouped[e.database] ??= []).push(e.accession_id);
    });
    const lines = [
      "# Auto-generated from AccessionDeck",
      "# pip install biopython requests",
      "from Bio import Entrez",
      "Entrez.email = 'you@example.com'",
      "",
      "accessions = {",
      ...Object.entries(grouped).map(([db, ids]) => `    ${JSON.stringify(db)}: ${JSON.stringify(ids)},`),
      "}",
      "",
      "# Example: efetch FASTA for NCBI nucleotide records",
      "if 'NCBI_NUCLEOTIDE' in accessions:",
      "    handle = Entrez.efetch(db='nuccore', id=','.join(accessions['NCBI_NUCLEOTIDE']), rettype='fasta')",
      "    print(handle.read())",
    ];
    download("accessions.py", lines.join("\n"), "text/x-python");
  }
  function asFasta() {
    const seqIds = entries.filter((e) => {
      const cat = DATABASES[e.database as DbKey]?.category;
      return cat === "sequence";
    });
    const lines = seqIds.map((e) => `>${e.accession_id} ${e.title ?? ""} [${e.organism ?? ""}]\n# fetch sequence from: ${e.url}`);
    download("accessions.fasta.txt", lines.join("\n\n"), "text/plain");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-white/60 border-white/60 hover:bg-white/90">
          <Download className="w-4 h-4 mr-1" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="glass-card border-0">
        <DropdownMenuItem onClick={asCSV}>CSV (spreadsheet)</DropdownMenuItem>
        <DropdownMenuItem onClick={asJSON}>JSON</DropdownMenuItem>
        <DropdownMenuItem onClick={asR}>R script (rentrez ready)</DropdownMenuItem>
        <DropdownMenuItem onClick={asPy}>Python script (Biopython)</DropdownMenuItem>
        <DropdownMenuItem onClick={asFasta}>FASTA stub (sequence entries)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
