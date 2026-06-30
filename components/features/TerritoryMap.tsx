"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type * as LType from "leaflet";
import { Icon } from "@/components/primitives/kit";
import { SourceChip, useProvenance } from "@/components/primitives/provenance";
import type { MapLayer, MapMarker } from "@/lib/model/types";

type Vista = "satellite" | "stradale";

type ActiveLayers = Record<string, boolean>;

const DEFAULT_ACTIVE: ActiveLayers = {
  quartieri: true,
  frazioni: true,
  opere: true,
  scuole: false,
  biblioteche: false,
  balneazione: false,
};

export function TerritoryMap({
  layers,
  markers,
}: {
  layers: MapLayer[];
  markers: MapMarker[];
}) {
  const router = useRouter();
  const { open } = useProvenance();

  const [vista, setVista] = useState<Vista>("satellite");
  const [activeLayers, setActiveLayers] = useState<ActiveLayers>(DEFAULT_ACTIVE);
  const [selected, setSelected] = useState<string | null>(null);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const tilesRef = useRef<{
    satellite: LType.TileLayer;
    labels: LType.TileLayer;
    stradale: LType.TileLayer;
  } | null>(null);
  const groupsRef = useRef<Record<string, LType.LayerGroup>>({});
  const vistaAppliedRef = useRef<Vista | null>(null);

  // colorHex lookup per layer id (for marker dots).
  const colorFor = (layerId: string) =>
    layers.find((l) => l.id === layerId)?.colorHex ?? "#888";

  // --- Init map (once) ---------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = mapEl.current;
    if (!el || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || mapRef.current || !mapEl.current) return;

      const map = L.map(el, {
        center: [36.862, 14.655],
        zoom: 11,
        zoomControl: false,
        attributionControl: true,
      });
      L.control.zoom({ position: "topright" }).addTo(map);

      tilesRef.current = {
        satellite: L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, attribution: "Imagery © Esri, Maxar" },
        ),
        labels: L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19 },
        ),
        stradale: L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            maxZoom: 19,
            subdomains: "abcd",
            attribution: "© OpenStreetMap · © CARTO",
          },
        ),
      };

      const groups: Record<string, LType.LayerGroup> = {};
      markers.forEach((m) => {
        if (m.lat == null) return;
        const color = colorFor(m.layer);
        const icon = L.divIcon({
          className: "ib-pin",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          html:
            '<div style="display:flex;align-items:center;gap:5px;white-space:nowrap;"><span style="width:13px;height:13px;border-radius:50%;background:' +
            color +
            ';border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.7);flex:none;"></span><span style="font:600 10.5px Hanken Grotesk,sans-serif;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.98),0 0 2px rgba(0,0,0,0.9);">' +
            m.label +
            "</span></div>",
        });
        const mk = L.marker([m.lat, m.lon], { icon });
        mk.on("click", () => setSelected(m.id));
        if (!groups[m.layer]) groups[m.layer] = L.layerGroup();
        groups[m.layer].addLayer(mk);
      });
      groupsRef.current = groups;

      mapRef.current = map;
      // force tile/layer sync on next render via state-driven effects
      vistaAppliedRef.current = null;
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 90);

      // trigger the sync effects now that the map exists
      syncTiles(vista);
      syncLayers(activeLayers);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tilesRef.current = null;
      groupsRef.current = {};
      vistaAppliedRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Sync helpers ------------------------------------------------------
  function syncTiles(v: Vista) {
    const map = mapRef.current;
    const tiles = tilesRef.current;
    if (!map || !tiles) return;
    if (vistaAppliedRef.current === v) return;
    [tiles.satellite, tiles.labels, tiles.stradale].forEach((t) => {
      if (map.hasLayer(t)) map.removeLayer(t);
    });
    if (v === "stradale") {
      tiles.stradale.addTo(map);
    } else {
      tiles.satellite.addTo(map);
      tiles.labels.addTo(map);
    }
    vistaAppliedRef.current = v;
  }

  function syncLayers(active: ActiveLayers) {
    const map = mapRef.current;
    const groups = groupsRef.current;
    if (!map || !groups) return;
    Object.keys(groups).forEach((lid) => {
      const g = groups[lid];
      if (active[lid]) {
        if (!map.hasLayer(g)) g.addTo(map);
      } else if (map.hasLayer(g)) {
        map.removeLayer(g);
      }
    });
  }

  // Re-sync tiles when vista changes.
  useEffect(() => {
    syncTiles(vista);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

  // Re-sync layer groups when activeLayers changes.
  useEffect(() => {
    syncLayers(activeLayers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayers]);

  // invalidateSize shortly after mount + on resize.
  useEffect(() => {
    const onResize = () => {
      if (mapRef.current) mapRef.current.invalidateSize();
    };
    const t = setTimeout(onResize, 120);
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const toggleLayer = (id: string) =>
    setActiveLayers((prev) => ({ ...prev, [id]: !prev[id] }));

  const selMarker = selected
    ? markers.find((m) => m.id === selected) ?? null
    : null;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#EEE4D0]">
      {/* ---------- Header ---------- */}
      <header className="flex items-end gap-[14px] px-7 pt-[18px] pb-[15px] border-b border-line bg-[rgba(244,239,230,0.55)]">
        <div className="flex-1">
          <div className="flex items-center gap-[9px]">
            <h1 className="font-spectral text-[24px] font-medium leading-none text-ink m-0">
              Mappa del territorio
            </h1>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3 bg-sand rounded-[5px] px-[7px] py-[3px]">
              444,67 km²
            </span>
          </div>
          <p className="font-hanken text-[12.5px] font-normal text-ink-2 mt-[5px] mb-0">
            Vista satellitare · quartieri, frazioni, opere e servizi georeferenziati
          </p>
        </div>

        <div className="flex items-center gap-[9px]">
          {/* Vista toggle */}
          <div className="inline-flex bg-sand rounded-[9px] p-[2px] gap-[2px]">
            <button
              type="button"
              data-vista="satellite"
              onClick={() => setVista("satellite")}
              className={`border-none rounded-[7px] px-3 py-[6px] font-hanken text-[11px] font-semibold cursor-pointer ${
                vista === "satellite"
                  ? "bg-card text-ink"
                  : "bg-transparent text-ink-3"
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              data-vista="stradale"
              onClick={() => setVista("stradale")}
              className={`border-none rounded-[7px] px-3 py-[6px] font-hanken text-[11px] font-semibold cursor-pointer ${
                vista === "stradale"
                  ? "bg-card text-ink"
                  : "bg-transparent text-ink-3"
              }`}
            >
              Mappa
            </button>
          </div>

          {/* ISTAT source chip */}
          <SourceChip
            sourceId="istat"
            what="Confini e territorio comunale · Comune di Ragusa"
            tag="ISTAT · confini"
          />
        </div>
      </header>

      {/* ---------- Map container ---------- */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={mapEl} className="absolute inset-0" />

        {/* LAYER PANEL */}
        <div className="absolute top-[18px] left-[18px] z-[1200] bg-card-2 border border-line rounded-[13px] p-[13px] shadow-[0_6px_22px_rgba(28,26,23,0.1)] w-[208px]">
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink-3 mb-[11px]">
            Layer
          </div>
          {layers.map((l) => {
            const active = !!activeLayers[l.id];
            return (
              <button
                key={l.id}
                type="button"
                data-layer={l.id}
                onClick={() => toggleLayer(l.id)}
                className="flex items-center gap-[9px] w-full px-[7px] py-[6px] rounded-[8px] border border-transparent bg-transparent cursor-pointer text-left mb-px hover:bg-[rgba(28,26,23,0.04)]"
              >
                <span
                  className="w-4 h-4 rounded-[5px] flex items-center justify-center flex-none"
                  style={{
                    border: `1.5px solid ${l.colorHex}`,
                    background: active ? l.colorHex : "transparent",
                  }}
                >
                  {active && (
                    <Icon
                      name="ph-check"
                      weight="bold"
                      className="text-[10px] text-white"
                    />
                  )}
                </span>
                <span className="font-hanken text-[12px] font-medium text-ink flex-1">
                  {l.label}
                </span>
                <span className="font-mono text-[9.5px] font-medium text-ink-3">
                  {l.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SELECTED MARKER INFO */}
        {selMarker && (
          <div className="absolute bottom-5 left-[18px] z-[1200] bg-card-2 border border-line-2 rounded-[13px] px-4 py-[15px] shadow-[0_10px_30px_rgba(28,26,23,0.16)] w-[262px]">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute top-[11px] right-[11px] w-6 h-6 rounded-[7px] border border-line bg-transparent cursor-pointer flex items-center justify-center text-ink-3 hover:bg-sand"
            >
              <Icon name="ph-x" className="text-[13px]" />
            </button>
            <div className="flex items-center gap-[7px] mb-[9px]">
              <span
                className="w-[10px] h-[10px] rounded-[3px]"
                style={{ background: colorFor(selMarker.layer) }}
              />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                {selMarker.type}
              </span>
            </div>
            <div className="font-spectral text-[17px] font-medium text-ink mb-[13px]">
              {selMarker.label}
            </div>
            {selMarker.entityId ? (
              <button
                type="button"
                data-id={selMarker.entityId}
                onClick={() => router.push("/entita/" + selMarker.entityId)}
                className="flex items-center gap-2 w-full justify-center bg-ink text-[#F4EFE6] border-none rounded-[9px] p-[9px] font-hanken text-[12px] font-semibold cursor-pointer hover:bg-[#2A2620]"
              >
                <Icon name="ph-cards" className="text-[14px]" /> Apri la scheda entità
              </button>
            ) : selMarker.sourceId ? (
              <button
                type="button"
                data-src={selMarker.sourceId}
                data-val={selMarker.label}
                onClick={() => open(selMarker.sourceId!, selMarker.label)}
                className="flex items-center gap-2 w-full justify-center bg-card text-ink border border-line-2 rounded-[9px] p-[9px] font-hanken text-[12px] font-semibold cursor-pointer hover:border-amber hover:bg-amber-tint"
              >
                <Icon name="ph-seal-check" className="text-[14px] text-amber-d" /> Vedi la fonte
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
