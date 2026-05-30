// Registry of common bioinformatics / open-source biotech databases
// with knowledge of how identifiers look and where data lives.

export type DbKey =
  | "NCBI_NUCLEOTIDE"
  | "NCBI_PROTEIN"
  | "NCBI_GENE"
  | "NCBI_SRA"
  | "NCBI_PUBMED"
  | "BLAST"
  | "MGI"
  | "ENSEMBL"
  | "UNIPROT"
  | "PDB"
  | "KEGG"
  | "GO"
  | "REACTOME"
  | "GEO"
  | "ARRAYEXPRESS"
  | "ENA"
  | "DDBJ"
  | "RFAM"
  | "PFAM"
  | "INTERPRO"
  | "FLYBASE"
  | "WORMBASE"
  | "ZFIN"
  | "TAIR"
  | "OTHER";

export interface DbInfo {
  key: DbKey;
  label: string;
  short: string;
  category: "sequence" | "gene" | "structure" | "literature" | "pathway" | "expression" | "model-organism" | "search" | "other";
  /** Example identifier */
  example: string;
  /** Regex hint to recognize accession format */
  pattern?: RegExp;
  /** Returns canonical URL for the accession */
  url: (acc: string) => string;
  /** Color token */
  color: string;
  /** Notes about how data is shared / what to expect */
  note: string;
}

export const DATABASES: Record<DbKey, DbInfo> = {
  NCBI_NUCLEOTIDE: {
    key: "NCBI_NUCLEOTIDE",
    label: "NCBI Nucleotide",
    short: "NCBI Nuc",
    category: "sequence",
    example: "NM_001301717",
    pattern: /^[A-Z]{1,2}_?\d{5,9}(\.\d+)?$/i,
    url: (a) => `https://www.ncbi.nlm.nih.gov/nuccore/${encodeURIComponent(a)}`,
    color: "var(--db-ncbi)",
    note: "RefSeq / GenBank nucleotide records. Fetch via Entrez E-utilities (efetch, rettype=fasta|gb).",
  },
  NCBI_PROTEIN: {
    key: "NCBI_PROTEIN",
    label: "NCBI Protein",
    short: "NCBI Prot",
    category: "sequence",
    example: "NP_001288646",
    pattern: /^[ANXYZ]P_\d{5,9}(\.\d+)?$/i,
    url: (a) => `https://www.ncbi.nlm.nih.gov/protein/${encodeURIComponent(a)}`,
    color: "var(--db-ncbi)",
    note: "Protein accessions (NP_/XP_/YP_). Pair with UniProt for richer annotation.",
  },
  NCBI_GENE: {
    key: "NCBI_GENE",
    label: "NCBI Gene",
    short: "Gene",
    category: "gene",
    example: "7157",
    pattern: /^\d+$/,
    url: (a) => `https://www.ncbi.nlm.nih.gov/gene/${encodeURIComponent(a)}`,
    color: "var(--db-ncbi)",
    note: "Entrez Gene IDs (integers). Cross-references most downstream resources.",
  },
  NCBI_SRA: {
    key: "NCBI_SRA",
    label: "NCBI SRA",
    short: "SRA",
    category: "expression",
    example: "SRR12345678",
    pattern: /^(SR[APRSXZ]|ER[APRSXZ]|DR[APRSXZ])\d{6,}$/i,
    url: (a) => `https://www.ncbi.nlm.nih.gov/sra/?term=${encodeURIComponent(a)}`,
    color: "var(--db-ncbi)",
    note: "Raw sequencing reads. Download with sratoolkit (prefetch + fasterq-dump).",
  },
  NCBI_PUBMED: {
    key: "NCBI_PUBMED",
    label: "PubMed",
    short: "PMID",
    category: "literature",
    example: "31626772",
    pattern: /^\d{6,9}$/,
    url: (a) => `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(a)}/`,
    color: "var(--db-ncbi)",
    note: "Literature references. Use PMID for citations in R/Python pipelines.",
  },
  BLAST: {
    key: "BLAST",
    label: "BLAST Result",
    short: "BLAST",
    category: "search",
    example: "RID-ABC123XYZ",
    url: (a) => `https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&RID=${encodeURIComponent(a)}`,
    color: "var(--db-blast)",
    note: "BLAST search IDs (RIDs) expire ~36h. Save the hit table or XML output for posterity.",
  },
  MGI: {
    key: "MGI",
    label: "Mouse Genome Informatics",
    short: "MGI",
    category: "model-organism",
    example: "MGI:1342288",
    pattern: /^MGI:\d+$/i,
    url: (a) => `https://www.informatics.jax.org/marker/${encodeURIComponent(a)}`,
    color: "var(--db-mgi)",
    note: "Mouse gene / allele / phenotype. Bulk reports as TSV at informatics.jax.org/downloads.",
  },
  ENSEMBL: {
    key: "ENSEMBL",
    label: "Ensembl",
    short: "ENS",
    category: "gene",
    example: "ENSG00000141510",
    pattern: /^ENS[A-Z]{0,3}[GTPE]\d{11}(\.\d+)?$/i,
    url: (a) => `https://www.ensembl.org/id/${encodeURIComponent(a)}`,
    color: "var(--db-ensembl)",
    note: "Gene/transcript/protein/exon IDs. biomaRt (R) or pyensembl handle bulk queries.",
  },
  UNIPROT: {
    key: "UNIPROT",
    label: "UniProt",
    short: "UniProt",
    category: "sequence",
    example: "P04637",
    pattern: /^[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$/,
    url: (a) => `https://www.uniprot.org/uniprotkb/${encodeURIComponent(a)}/entry`,
    color: "var(--db-uniprot)",
    note: "Curated protein knowledge. REST returns JSON/FASTA/TSV; great for annotation joins.",
  },
  PDB: {
    key: "PDB",
    label: "Protein Data Bank",
    short: "PDB",
    category: "structure",
    example: "1TUP",
    pattern: /^[0-9][A-Z0-9]{3}$/i,
    url: (a) => `https://www.rcsb.org/structure/${encodeURIComponent(a)}`,
    color: "var(--db-pdb)",
    note: "3D structures. mmCIF preferred over legacy PDB format for parsing.",
  },
  KEGG: {
    key: "KEGG",
    label: "KEGG",
    short: "KEGG",
    category: "pathway",
    example: "hsa04110",
    url: (a) => `https://www.kegg.jp/entry/${encodeURIComponent(a)}`,
    color: "var(--db-kegg)",
    note: "Pathways, orthologs, compounds. KEGG REST is rate-limited and licensed for academic use.",
  },
  GO: {
    key: "GO",
    label: "Gene Ontology",
    short: "GO",
    category: "pathway",
    example: "GO:0008150",
    pattern: /^GO:\d{7}$/,
    url: (a) => `https://amigo.geneontology.org/amigo/term/${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "Functional annotations. Used by topGO, clusterProfiler, goatools.",
  },
  REACTOME: {
    key: "REACTOME",
    label: "Reactome",
    short: "Reactome",
    category: "pathway",
    example: "R-HSA-69278",
    url: (a) => `https://reactome.org/content/detail/${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "Curated human pathways. ReactomePA in R is the easiest enrichment integration.",
  },
  GEO: {
    key: "GEO",
    label: "NCBI GEO",
    short: "GEO",
    category: "expression",
    example: "GSE12345",
    pattern: /^(GSE|GSM|GPL|GDS)\d+$/i,
    url: (a) => `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${encodeURIComponent(a)}`,
    color: "var(--db-ncbi)",
    note: "Functional genomics datasets. GEOquery (R) or GEOparse (Python) for programmatic access.",
  },
  ARRAYEXPRESS: {
    key: "ARRAYEXPRESS",
    label: "ArrayExpress / BioStudies",
    short: "AE",
    category: "expression",
    example: "E-MTAB-1234",
    pattern: /^E-[A-Z]{4}-\d+$/i,
    url: (a) => `https://www.ebi.ac.uk/biostudies/arrayexpress/studies/${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "Now hosted on BioStudies. MAGE-TAB metadata + raw files.",
  },
  ENA: {
    key: "ENA",
    label: "European Nucleotide Archive",
    short: "ENA",
    category: "sequence",
    example: "PRJEB12345",
    url: (a) => `https://www.ebi.ac.uk/ena/browser/view/${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "Mirror of INSDC sequence data. ENA portal API exposes filtered TSV downloads.",
  },
  DDBJ: {
    key: "DDBJ",
    label: "DDBJ",
    short: "DDBJ",
    category: "sequence",
    example: "AB000263",
    url: (a) => `https://getentry.ddbj.nig.ac.jp/getentry/na/${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "Japan's INSDC node. Useful when NCBI mirrors are slow.",
  },
  RFAM: {
    key: "RFAM",
    label: "Rfam",
    short: "Rfam",
    category: "sequence",
    example: "RF00001",
    pattern: /^RF\d{5}$/i,
    url: (a) => `https://rfam.org/family/${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "RNA families. Covariance models for cmsearch / Infernal.",
  },
  PFAM: {
    key: "PFAM",
    label: "Pfam (InterPro)",
    short: "Pfam",
    category: "sequence",
    example: "PF00001",
    pattern: /^PF\d{5}$/i,
    url: (a) => `https://www.ebi.ac.uk/interpro/entry/pfam/${encodeURIComponent(a)}/`,
    color: "var(--db-other)",
    note: "Protein families. Pfam now lives inside InterPro.",
  },
  INTERPRO: {
    key: "INTERPRO",
    label: "InterPro",
    short: "IPR",
    category: "sequence",
    example: "IPR000001",
    pattern: /^IPR\d{6}$/i,
    url: (a) => `https://www.ebi.ac.uk/interpro/entry/InterPro/${encodeURIComponent(a)}/`,
    color: "var(--db-other)",
    note: "Domain signatures aggregating Pfam, SMART, PROSITE, etc.",
  },
  FLYBASE: {
    key: "FLYBASE",
    label: "FlyBase",
    short: "FB",
    category: "model-organism",
    example: "FBgn0000490",
    pattern: /^FB[a-z]{2}\d{7}$/,
    url: (a) => `https://flybase.org/reports/${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "Drosophila genetics. Precomputed TSV dumps each release.",
  },
  WORMBASE: {
    key: "WORMBASE",
    label: "WormBase",
    short: "WB",
    category: "model-organism",
    example: "WBGene00006789",
    pattern: /^WB[A-Za-z]+\d+$/,
    url: (a) => `https://wormbase.org/species/c_elegans/gene/${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "C. elegans + nematodes. SimpleMine for bulk gene queries.",
  },
  ZFIN: {
    key: "ZFIN",
    label: "ZFIN",
    short: "ZFIN",
    category: "model-organism",
    example: "ZDB-GENE-040426-1716",
    url: (a) => `https://zfin.org/${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "Zebrafish genes, alleles, phenotypes.",
  },
  TAIR: {
    key: "TAIR",
    label: "TAIR (Arabidopsis)",
    short: "TAIR",
    category: "model-organism",
    example: "AT1G01010",
    pattern: /^AT[1-5MC]G\d{5}$/i,
    url: (a) => `https://www.arabidopsis.org/servlets/TairObject?type=locus&name=${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "Arabidopsis loci. Phytozome is a free alternative for bulk downloads.",
  },
  OTHER: {
    key: "OTHER",
    label: "Other",
    short: "Other",
    category: "other",
    example: "",
    url: (a) => a.startsWith("http") ? a : `https://www.google.com/search?q=${encodeURIComponent(a)}`,
    color: "var(--db-other)",
    note: "Catch-all for repositories not yet in the registry.",
  },
};

export const DB_LIST: DbInfo[] = Object.values(DATABASES);

/** Best-effort detection of the source DB from an accession string. */
export function detectDatabase(acc: string): DbKey {
  const t = acc.trim();
  if (!t) return "OTHER";
  for (const db of DB_LIST) {
    if (db.key === "OTHER") continue;
    if (db.pattern && db.pattern.test(t)) return db.key;
  }
  return "OTHER";
}
