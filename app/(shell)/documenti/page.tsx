import { getDocuments, getDocSections, getSources } from "@/lib/data/repository";
import { DocSearch } from "@/components/features/DocSearch";

export default async function DocumentiPage() {
  const [docs, { trasparente, albo }, sources] = await Promise.all([
    getDocuments(),
    getDocSections(),
    getSources(),
  ]);

  const sourcesById: Record<string, { short: string; license: string; url: string }> = {};
  for (const s of sources) {
    sourcesById[s.id] = { short: s.short, license: s.license, url: s.url };
  }

  return (
    <div className="max-w-[1100px] mx-auto px-9 pt-[30px] pb-[70px]">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-d mb-[10px]">
        Documenti · 3.910
      </div>
      <h1 className="font-spectral text-[31px] leading-[1.1] font-medium text-ink m-0 mb-2 tracking-[-0.01em]">
        Dove vive ogni documento
      </h1>
      <p className="font-hanken text-[14px] leading-[1.55] text-ink-2 m-0 mb-[22px] max-w-[600px]">
        Amministrazione Trasparente e Albo Pretorio. Cerca in linguaggio naturale: ogni risultato
        porta al suo atto-fonte, con sezione, ufficio emittente e hash.
      </p>

      <DocSearch docs={docs} trasparente={trasparente} albo={albo} sourcesById={sourcesById} />
    </div>
  );
}
