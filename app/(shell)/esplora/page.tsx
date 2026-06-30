import { getGraph } from "@/lib/data/repository";
import { ObjectGraph } from "@/components/features/ObjectGraph";

export default async function EsploraPage() {
  const g = await getGraph();

  return (
    <ObjectGraph
      nodes={g.nodes}
      links={g.links}
      types={g.types}
      W={g.W}
      H={g.H}
    />
  );
}
