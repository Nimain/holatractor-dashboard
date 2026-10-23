"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function OwnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Owner Dashboard Error caught:", error);
  }, [error]);

  return (
    <div className="p-8 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm text-center my-6">
      <h2 className="text-xl font-bold text-[#800000] mb-2">
        Error en el Panel de Control / Dashboard Error
      </h2>
      <p className="text-slate-500 max-w-md mb-6 text-xs">
        No se pudo cargar la vista del panel de control. <br />
        Failed to load dashboard view.
      </p>
      <Button
        onClick={() => reset()}
        className="bg-[#800000] hover:bg-[#570000] text-white font-bold text-xs px-5 py-2 rounded-xl"
      >
        Reintentar / Retry
      </Button>
    </div>
  );
}
