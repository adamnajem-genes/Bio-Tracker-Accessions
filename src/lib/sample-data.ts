import { supabase } from "@/integrations/supabase/client";
import { DATABASES, type DbKey } from "@/lib/databases";

interface Seed {
  database: DbKey;
  accession_id: string;
  title: string;
  organism: string | null;
  tags: string[];
  notes: string;
  status: string;
}

const SAMPLE: Seed[] = [
  {
    database: "UNIPROT",
    accession_id: "P04637",
    title: "Cellular tumor antigen p53",
    organism: "Homo sapiens",
    tags: ["tumor-suppressor", "demo"],
    notes: "Canonical reference sequence — the most-studied tumor suppressor.",
    status: "done",
  },
  {
    database: "NCBI_NUCLEOTIDE",
    accession_id: "NM_001301717",
    title: "TP53 transcript variant 9",
    organism: "Homo sapiens",
    tags: ["mRNA", "demo"],
    notes: "Pair with UniProt P04637 for protein-level annotation.",
    status: "analyzing",
  },
  {
    database: "NCBI_GENE",
    accession_id: "7157",
    title: "TP53 (Entrez Gene)",
    organism: "Homo sapiens",
    tags: ["gene", "demo"],
    notes: "Cross-references most downstream resources via the Gene ID.",
    status: "collected",
  },
  {
    database: "ENSEMBL",
    accession_id: "ENSG00000141510",
    title: "TP53 — Ensembl gene",
    organism: "Homo sapiens",
    tags: ["ensembl", "demo"],
    notes: "Use biomaRt or pyensembl for joins with transcript-level IDs.",
    status: "collected",
  },
  {
    database: "PDB",
    accession_id: "1TUP",
    title: "Tumor suppressor p53 complexed with DNA",
    organism: "Homo sapiens",
    tags: ["structure", "x-ray", "demo"],
    notes: "Classic p53-DNA cocrystal structure (Cho et al., 1994).",
    status: "reviewing",
  },
  {
    database: "NCBI_PUBMED",
    accession_id: "8023157",
    title: "Crystal structure of a p53 tumor suppressor-DNA complex",
    organism: null,
    tags: ["citation", "demo"],
    notes: "The paper behind PDB 1TUP. Cite when discussing the DNA-binding domain.",
    status: "done",
  },
  {
    database: "GEO",
    accession_id: "GSE10072",
    title: "Gene expression in lung adenocarcinoma",
    organism: "Homo sapiens",
    tags: ["microarray", "demo"],
    notes: "Public expression dataset frequently used as a p53-pathway benchmark.",
    status: "collected",
  },
  {
    database: "NCBI_SRA",
    accession_id: "SRR1553606",
    title: "RNA-seq · K562 control",
    organism: "Homo sapiens",
    tags: ["rna-seq", "demo"],
    notes: "Example SRA run — pull with prefetch + fasterq-dump.",
    status: "collected",
  },
];

/**
 * Seeds a starter project with worked-example entries.
 * Idempotent: only runs when the user has no projects AND no entries.
 */
export async function seedSampleProject(userId: string): Promise<boolean> {
  const [{ count: projectCount }, { count: entryCount }] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("entries").select("id", { count: "exact", head: true }),
  ]);
  if ((projectCount ?? 0) > 0 || (entryCount ?? 0) > 0) return false;

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: "Demo · TP53 dossier",
      description: "Worked example showing how to track one gene across NCBI, UniProt, Ensembl, PDB, PubMed, GEO, and SRA. Safe to delete.",
      color: "#5cbdb9",
    })
    .select("id")
    .single();
  if (pErr || !project) return false;

  const rows = SAMPLE.map((s) => ({
    user_id: userId,
    project_id: project.id,
    database: s.database,
    entry_type: DATABASES[s.database].category,
    accession_id: s.accession_id,
    title: s.title,
    organism: s.organism,
    url: DATABASES[s.database].url(s.accession_id),
    notes: s.notes,
    tags: s.tags,
    status: s.status,
  }));
  await supabase.from("entries").insert(rows);
  return true;
}
