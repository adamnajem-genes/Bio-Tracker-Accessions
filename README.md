[README.md](https://github.com/user-attachments/files/28414726/README.md)
# Bio-Tracker-Accessions

A personal bioinformatics workbench for collecting and organizing accession numbers across 25 public databases — because scattered IDs across browser tabs, spreadsheets, and lab notebooks is a pain every researcher knows too well.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20TypeScript%20%2B%20Supabase-informational)

---

## What it does

- **Track accessions** from NCBI (Nucleotide, Protein, Gene, SRA, PubMed), UniProt, PDB, Ensembl, KEGG, GO, Reactome, GEO, ArrayExpress, ENA, DDBJ, Rfam, Pfam, InterPro, FlyBase, WormBase, ZFIN, TAIR, MGI, BLAST, and more
- **Auto-detects the database** from the accession format (e.g. `NM_001301717` → NCBI Nucleotide, `P04637` → UniProt)
- **Organize into projects** — group accessions by study, gene, or whatever makes sense for your workflow
- **Filter by database or project** with a sidebar and live search
- **Export** to CSV, JSON, or R/Python-ready formats
- **Bulk import** from a spreadsheet or paste
- **Command palette** (⌘K) and keyboard shortcuts (`/` search, `n` new entry, `i` import)
- **Demo project** with real TP53 accessions across 7 databases to get started instantly

---

## Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [TanStack Router](https://tanstack.com/router) + [TanStack Start](https://tanstack.com/start)
- [Supabase](https://supabase.com/) (auth + database)
- [shadcn/ui](https://ui.shadcn.com/) component library
- [Vite](https://vitejs.dev/) + [Bun](https://bun.sh/)
- Built with [Lovable](https://lovable.dev/)

---

## Running locally

### Prerequisites
- [Bun](https://bun.sh/) installed
- A [Supabase](https://supabase.com/) project (free tier works)

### Setup

```bash
# Clone the repo
git clone https://github.com/adamnajem-genes/Bio-Tracker-Accessions.git
cd Bio-Tracker-Accessions

# Install dependencies
bun install

# Copy the environment template and fill in your Supabase credentials
cp .env.example .env
```

Edit `.env` with your Supabase project URL and publishable key (found in your Supabase dashboard under Project Settings → API).

```bash
# Run the dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database migrations

The `supabase/migrations/` folder contains the schema. If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed:

```bash
supabase db push
```

Or run the migration SQL files manually in your Supabase SQL editor.

---

## Supported databases

| Database | Example accession | Category |
|---|---|---|
| NCBI Nucleotide | `NM_001301717` | Sequence |
| NCBI Protein | `NP_001288646` | Sequence |
| NCBI Gene | `7157` | Gene |
| NCBI SRA | `SRR12345678` | Expression |
| PubMed | `31626772` | Literature |
| UniProt | `P04637` | Sequence |
| Ensembl | `ENSG00000141510` | Gene |
| PDB | `1TUP` | Structure |
| KEGG | `hsa04110` | Pathway |
| Gene Ontology | `GO:0008150` | Pathway |
| Reactome | `R-HSA-69278` | Pathway |
| NCBI GEO | `GSE12345` | Expression |
| ArrayExpress | `E-MTAB-1234` | Expression |
| ENA | `PRJEB12345` | Sequence |
| DDBJ | `AB000263` | Sequence |
| Rfam | `RF00001` | Sequence |
| Pfam | `PF00001` | Sequence |
| InterPro | `IPR000001` | Sequence |
| MGI | `MGI:1342288` | Model organism |
| FlyBase | `FBgn0000490` | Model organism |
| WormBase | `WBGene00006789` | Model organism |
| ZFIN | `ZDB-GENE-040426-1716` | Model organism |
| TAIR | `AT1G01010` | Model organism |
| BLAST | `RID-ABC123XYZ` | Search |

---

## Environment variables

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

---

## License

MIT — see [LICENSE](./LICENSE).
