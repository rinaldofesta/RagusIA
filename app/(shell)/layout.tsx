import { Suspense } from "react";
import { Sidebar } from "@/components/primitives/Sidebar";
import { ProvenanceDrawer } from "@/components/primitives/ProvenanceDrawer";

// Every surface reads from Postgres at request time — no static prerender,
// no build-time DB access.
export const dynamic = "force-dynamic";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-paper text-ink relative">
      <Suspense fallback={<aside className="w-[250px] flex-none border-r border-line bg-[linear-gradient(176deg,#F8F3EA,#F0E9DC)]" />}>
        <Sidebar />
      </Suspense>
      <main
        className="flex-1 h-screen overflow-y-auto relative"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg,rgba(28,26,23,0.014) 0 1px,transparent 1px 8px)",
        }}
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <ProvenanceDrawer />
      </Suspense>
    </div>
  );
}
