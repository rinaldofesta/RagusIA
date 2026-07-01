// DAIT — Dipartimento Affari Interni e Territoriali (Ministero dell'Interno).
// Anagrafe degli Amministratori Locali, per-provincia CSV export. Verified
// live in design/phase2-research/dait.md: 56 KB, no-auth, `;`-delimited,
// 2-line title preamble before the real header, ASCII names with apostrophes
// standing in for accented vowels (e.g. `CASSI'` for "Cassì").
//
// Gives us the CURRENT sindaco/assessori/consiglieri roster (names + two
// structural flags: Vicesindaco, Presidente del consiglio) but NO delega
// (portfolio) text — those stay curated (seed/manual), see apply() below.

import { eq } from "drizzle-orm";
import * as t from "@/lib/db/schema";
import { db } from "@/lib/db/client";
import type { Assessore } from "@/lib/model/types";
import { fetchText, parseCsv, type LiveAdapter, type FetchOutcome } from "../../ingest/framework";

const CSV_URL = "https://dait.interno.gov.it/documenti/provincia_di_ragusa.csv";

export interface DaitAssessore {
  nome: string;
  ruolo: "Assessore";
  vice: boolean;
}

export interface DaitRoster {
  sindacoNome: string;
  assessori: DaitAssessore[];
  presidente: string;
  nConsiglieri: number;
}

/**
 * Title-cases a raw "COGNOME NOME" (or "NOME") DAIT token and restores the
 * accented vowel that DAIT encodes as a trailing ASCII apostrophe (e.g.
 * `CASSI'` → `Cassì`). Also fixes the apostrophe placement/casing for names
 * that carry an internal apostrophe (e.g. `D'ASTA` → `D'Asta`).
 */
function prettyWord(word: string): string {
  if (!word) return word;
  // Trailing apostrophe = accented final vowel transliteration (CASSI' -> Cassì).
  const trailingApostropheMatch = /^([A-ZÀ-Ý]+)'$/.exec(word);
  if (trailingApostropheMatch) {
    const base = trailingApostropheMatch[1];
    const lastVowelMatch = /^(.*)([AEIOU])$/.exec(base);
    if (lastVowelMatch) {
      const [, head, vowel] = lastVowelMatch;
      const accented: Record<string, string> = {
        A: "à",
        E: "è",
        I: "ì",
        O: "ò",
        U: "ù",
      };
      const titleHead = head.charAt(0) + head.slice(1).toLowerCase();
      return titleHead + accented[vowel];
    }
  }
  // Internal apostrophe (surname compounds like D'ASTA, D'ITALIA).
  if (word.includes("'")) {
    return word
      .split("'")
      .map((part, i, arr) => {
        const lower = part.toLowerCase();
        const titled = lower.charAt(0).toUpperCase() + lower.slice(1);
        return i < arr.length - 1 ? titled : titled;
      })
      .join("'");
  }
  const lower = word.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Formats a raw DAIT "cognome"/"nome" (or full) string to display Title Case. */
export function prettyName(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map(prettyWord)
    .join(" ");
}

interface DaitRow {
  denominazione_comune: string;
  sigla_provincia: string;
  cognome: string;
  nome: string;
  descrizione_carica: string;
  incarico: string;
}

export const daitAdapter: LiveAdapter<DaitRoster> = {
  id: "dait",
  label: "DAIT — Ministero dell'Interno",
  feeds: "organigramma",

  async fetch(): Promise<FetchOutcome<DaitRoster>> {
    let text: string;
    try {
      text = await fetchText(CSV_URL);
    } catch {
      return { ok: false, rows: 0, observed: "", note: "DAIT non raggiungibile" };
    }

    // Skip the 2-line title/metadata preamble before the real CSV header.
    const withoutPreamble = text.split("\n").slice(2).join("\n");
    const rows = parseCsv(withoutPreamble, ";") as unknown as DaitRow[];

    const ragusa = rows.filter(
      (r) => r.denominazione_comune === "RAGUSA" && r.sigla_provincia === "RG",
    );

    const sindacoRow = ragusa.find((r) => r.descrizione_carica === "Sindaco");
    const assessoriRows = ragusa.filter((r) => r.descrizione_carica === "Assessore");
    const presidenteRow = ragusa.find((r) => (r.incarico ?? "").includes("Presidente del consiglio"));
    const nConsiglieri = ragusa.filter((r) => r.descrizione_carica.includes("Consigliere")).length;

    if (!sindacoRow) {
      return { ok: false, rows: 0, observed: "", note: "DAIT: riga Sindaco non trovata" };
    }

    const data: DaitRoster = {
      sindacoNome: prettyName(`${sindacoRow.nome} ${sindacoRow.cognome}`),
      assessori: assessoriRows.map((r) => ({
        nome: prettyName(`${r.nome} ${r.cognome}`),
        ruolo: "Assessore",
        vice: (r.incarico ?? "").includes("Vicesindaco"),
      })),
      presidente: presidenteRow ? prettyName(`${presidenteRow.nome} ${presidenteRow.cognome}`) : "",
      nConsiglieri,
    };

    return { ok: true, rows: ragusa.length, observed: "2023–2028", data };
  },

  async apply(data: DaitRoster): Promise<void> {
    const [current] = await db
      .select()
      .from(t.organigramma)
      .where(eq(t.organigramma.id, "default"));

    const normalizeSurname = (nome: string): string =>
      nome
        .trim()
        .split(/\s+/)
        .pop()!
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // strip diacritics for matching
        .replace(/['’]/g, "")
        .toLowerCase();

    const existingBySurname = new Map<string, Assessore>(
      (current?.assessori ?? []).map((a) => [normalizeSurname(a.nome), a]),
    );

    const assessori: Assessore[] = data.assessori.map((live) => {
      const match = existingBySurname.get(normalizeSurname(live.nome));
      return {
        nome: live.nome,
        ruolo: live.ruolo,
        deleghe: match?.deleghe ?? "",
        vice: live.vice,
      };
    });

    await db
      .update(t.organigramma)
      .set({ assessori, presidente: data.presidente })
      .where(eq(t.organigramma.id, "default"));
  },
};
