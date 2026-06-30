import { getMap } from "@/lib/data/repository";
import { TerritoryMap } from "@/components/features/TerritoryMap";

export default async function MappaPage() {
  const { layers, markers } = await getMap();

  return <TerritoryMap layers={layers} markers={markers} />;
}
