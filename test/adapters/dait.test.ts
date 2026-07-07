// DAIT adapter parse tests. The tricky parts: the 2-line preamble before the real
// header, and DAIT's ASCII transliteration of accented final vowels (CASSI' → Cassì)
// and internal apostrophes (D'ASTA → D'Asta). Format per design/phase2-research/dait.md.
import { expect, test } from "vitest";
import { prettyName, parseDaitRoster } from "@/lib/data/adapters/sources/dait";

test("prettyName restores accented vowels and title-cases names", () => {
  expect(prettyName("CASSI'")).toBe("Cassì");
  expect(prettyName("D'ASTA")).toBe("D'Asta");
  expect(prettyName("MARIO ROSSI")).toBe("Mario Rossi");
  expect(prettyName("GRECO")).toBe("Greco");
});

// Two preamble lines, then header, then rows (Ragusa giunta + one other comune).
const CSV = `Anagrafe degli Amministratori Locali
Provincia di Ragusa — estrazione
denominazione_comune;sigla_provincia;cognome;nome;descrizione_carica;incarico
RAGUSA;RG;CASSI';Peppe;Sindaco;
RAGUSA;RG;ROSSI;Maria;Assessore;Vicesindaco
RAGUSA;RG;D'ASTA;Luca;Assessore;
RAGUSA;RG;VERDI;Anna;Presidente del Consiglio;Presidente del consiglio
RAGUSA;RG;BIANCHI;Marco;Consigliere;
RAGUSA;RG;NERI;Sara;Consigliere;
VITTORIA;RG;GIALLI;Ugo;Sindaco;`;

test("parseDaitRoster builds the Ragusa roster and skips the preamble + other comuni", () => {
  const parsed = parseDaitRoster(CSV);
  expect(parsed).not.toBeNull();
  const { roster, rows } = parsed!;
  expect(roster.sindacoNome).toBe("Peppe Cassì");
  expect(roster.assessori).toEqual([
    { nome: "Maria Rossi", ruolo: "Assessore", vice: true },
    { nome: "Luca D'Asta", ruolo: "Assessore", vice: false },
  ]);
  expect(roster.presidente).toBe("Anna Verdi");
  expect(roster.nConsiglieri).toBe(2);
  expect(rows).toBe(6); // all Ragusa admin rows, excluding VITTORIA
});

test("parseDaitRoster returns null when the Sindaco row is missing", () => {
  const noSindaco = `t\nt\ndenominazione_comune;sigla_provincia;cognome;nome;descrizione_carica;incarico
RAGUSA;RG;BIANCHI;Marco;Consigliere;`;
  expect(parseDaitRoster(noSindaco)).toBeNull();
});
