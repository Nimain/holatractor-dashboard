"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6 text-center">
      <h2 className="text-2xl font-bold text-[#800000] mb-2">
        Algo salió mal / Something went wrong
      </h2>
      <p className="text-slate-500 max-w-md mb-6 text-sm">
        Ocurrió un error inesperado al cargar esta página. <br />
        An unexpected error occurred while loading this page.
      </p>
      <Button
        onClick={() => reset()}
        className="bg-[#800000] hover:bg-[#570000] text-white font-bold px-6 py-2.5 rounded-full shadow"
      >
        Intentar de nuevo / Try Again
      </Button>
    </div>
  );
}
