// IndicePA adapter parse test. The one rule that matters: Mail1 is attested as PEC
// only when Tipo_Mail1 === "Pec" (a non-certified address must not be reported as
// certified). Shape per design/phase2-research/indicepa.md (CKAN datastore).
import { expect, test } from "vitest";
import {
  parseIndicePa,
  type CkanDatastoreResponse,
  type EnteRecord,
} from "@/lib/data/adapters/sources/indicepa";

const enteRes = (tipo: string | null): CkanDatastoreResponse<EnteRecord> => ({
  success: true,
  result: {
    total: 1,
    records: [
      {
        Codice_IPA: "c_h163",
        Denominazione_ente: "Comune di Ragusa",
        Mail1: "protocollo@pec.comune.ragusa.gov.it",
        Tipo_Mail1: tipo,
      },
    ],
  },
});
const uoRes: CkanDatastoreResponse<unknown> = { success: true, result: { total: 131, records: [] } };

test("parseIndicePa attests Mail1 as PEC only when certified", () => {
  expect(parseIndicePa(enteRes("Pec"), uoRes)).toEqual({
    denominazione: "Comune di Ragusa",
    pec: "protocollo@pec.comune.ragusa.gov.it",
    ouCount: 131,
  });
  expect(parseIndicePa(enteRes("Altro"), uoRes)?.pec).toBeNull();
});

test("parseIndicePa returns null when the ente record is missing or the call failed", () => {
  expect(parseIndicePa({ success: true, result: { total: 0, records: [] } }, uoRes)).toBeNull();
  expect(parseIndicePa({ success: false, result: { total: 0, records: [] } }, uoRes)).toBeNull();
});
