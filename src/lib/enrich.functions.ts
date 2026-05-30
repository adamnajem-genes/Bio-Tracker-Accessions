import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Fetches public metadata from the source database for a given accession.
 * Best-effort: returns null fields if the upstream returns nothing useful.
 * All endpoints used are public, no API keys required.
 */

export interface EnrichResult {
  title: string | null;
  organism: string | null;
  description: string | null;
  length: number | null;
  source: string;
}

const EMPTY: EnrichResult = { title: null, organism: null, description: null, length: null, source: "" };

async function safeFetch(url: string, accept = "application/json"): Promise<unknown | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: accept, "User-Agent": "AccessionDeck/1.0 (research tool)" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    if (accept.includes("json")) return await res.json();
    return await res.text();
  } catch {
    return null;
  }
}

async function enrichUniProt(acc: string): Promise<EnrichResult> {
  const data = (await safeFetch(`https://rest.uniprot.org/uniprotkb/${encodeURIComponent(acc)}.json`)) as
    | { proteinDescription?: { recommendedName?: { fullName?: { value?: string } } }; organism?: { scientificName?: string }; sequence?: { length?: number }; comments?: Array<{ commentType?: string; texts?: Array<{ value?: string }> }> }
    | null;
  if (!data) return EMPTY;
  const fn = data.proteinDescription?.recommendedName?.fullName?.value ?? null;
  const fnComment = data.comments?.find((c) => c.commentType === "FUNCTION")?.texts?.[0]?.value ?? null;
  return {
    title: fn,
    organism: data.organism?.scientificName ?? null,
    description: fnComment ? fnComment.slice(0, 400) : null,
    length: data.sequence?.length ?? null,
    source: "UniProt",
  };
}

async function enrichEnsembl(acc: string): Promise<EnrichResult> {
  const data = (await safeFetch(`https://rest.ensembl.org/lookup/id/${encodeURIComponent(acc)}?expand=0`)) as
    | { display_name?: string; species?: string; description?: string; biotype?: string; start?: number; end?: number }
    | null;
  if (!data) return EMPTY;
  const len = data.start && data.end ? data.end - data.start + 1 : null;
  const species = data.species ? data.species.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : null;
  return {
    title: data.display_name ?? null,
    organism: species,
    description: data.description ?? (data.biotype ? `Biotype: ${data.biotype}` : null),
    length: len,
    source: "Ensembl",
  };
}

async function enrichPDB(acc: string): Promise<EnrichResult> {
  const data = (await safeFetch(`https://data.rcsb.org/rest/v1/core/entry/${encodeURIComponent(acc.toUpperCase())}`)) as
    | {
        struct?: { title?: string };
        rcsb_entry_info?: { deposited_polymer_monomer_count?: number };
        rcsb_primary_citation?: { title?: string };
        rcsb_entry_container_identifiers?: { entry_id?: string };
        struct_keywords?: { pdbx_keywords?: string };
      }
    | null;
  if (!data) return EMPTY;
  return {
    title: data.struct?.title ?? null,
    organism: null,
    description: data.struct_keywords?.pdbx_keywords ?? data.rcsb_primary_citation?.title ?? null,
    length: data.rcsb_entry_info?.deposited_polymer_monomer_count ?? null,
    source: "RCSB PDB",
  };
}

/** Run esearch → esummary against NCBI E-utilities for an accession or UID. */
async function enrichNCBI(ncbiDb: string, acc: string, isUid: boolean): Promise<EnrichResult> {
  let uid = acc;
  if (!isUid) {
    const search = (await safeFetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=${ncbiDb}&term=${encodeURIComponent(acc)}&retmode=json`,
    )) as { esearchresult?: { idlist?: string[] } } | null;
    const id = search?.esearchresult?.idlist?.[0];
    if (!id) return EMPTY;
    uid = id;
  }
  const sum = (await safeFetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=${ncbiDb}&id=${encodeURIComponent(uid)}&retmode=json`,
  )) as { result?: Record<string, unknown> } | null;
  const rec = sum?.result?.[uid] as
    | { title?: string; organism?: string; description?: string; slen?: number | string; length?: number | string; summary?: string; name?: string; fulljournalname?: string; authors?: Array<{ name?: string }>; pubdate?: string; nlmuniqueid?: string; sortpubdate?: string; gdsType?: string }
    | undefined;
  if (!rec) return EMPTY;
  let title = rec.title ?? rec.name ?? null;
  let description = rec.summary ?? rec.description ?? null;
  // PubMed-specific shape
  if (ncbiDb === "pubmed" && rec.authors) {
    const authors = rec.authors.slice(0, 3).map((a) => a.name).filter(Boolean).join(", ");
    description = [authors, rec.fulljournalname, rec.pubdate].filter(Boolean).join(" · ");
  }
  // GEO-specific
  if (ncbiDb === "gds" && rec.gdsType) {
    description = `${rec.gdsType}${description ? " · " + description : ""}`;
  }
  const len = typeof rec.slen === "number" ? rec.slen : typeof rec.slen === "string" ? Number(rec.slen) : null;
  return {
    title: title,
    organism: rec.organism ?? null,
    description: description ? String(description).slice(0, 400) : null,
    length: len && !Number.isNaN(len) ? len : null,
    source: ncbiDb === "pubmed" ? "PubMed" : ncbiDb === "gds" ? "NCBI GEO" : `NCBI ${ncbiDb}`,
  };
}

async function enrichOne(database: string, accession: string): Promise<EnrichResult> {
  const acc = accession.trim();
  if (!acc) return EMPTY;
  try {
    switch (database) {
      case "UNIPROT":
        return await enrichUniProt(acc);
      case "ENSEMBL":
        return await enrichEnsembl(acc);
      case "PDB":
        return await enrichPDB(acc);
      case "NCBI_NUCLEOTIDE":
        return await enrichNCBI("nuccore", acc, false);
      case "NCBI_PROTEIN":
        return await enrichNCBI("protein", acc, false);
      case "NCBI_GENE":
        return await enrichNCBI("gene", acc, /^\d+$/.test(acc));
      case "NCBI_SRA":
        return await enrichNCBI("sra", acc, false);
      case "NCBI_PUBMED":
        return await enrichNCBI("pubmed", acc, /^\d+$/.test(acc));
      case "GEO":
        return await enrichNCBI("gds", acc, false);
      default:
        return EMPTY;
    }
  } catch {
    return EMPTY;
  }
}

export const enrichAccession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        database: z.string().min(1).max(40),
        accession: z.string().min(1).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    return enrichOne(data.database, data.accession);
  });

export const enrichBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        items: z
          .array(z.object({ id: z.string(), database: z.string().min(1).max(40), accession: z.string().min(1).max(120) }))
          .min(1)
          .max(50),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    // Sequential to be polite to upstream APIs. 50 items max.
    const out: Array<{ id: string; result: EnrichResult }> = [];
    for (const item of data.items) {
      const r = await enrichOne(item.database, item.accession);
      out.push({ id: item.id, result: r });
    }
    return { results: out };
  });
