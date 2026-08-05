"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error caught:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6 text-center">
        <h2 className="text-2xl font-bold text-[#800000] mb-2">
          Error de la aplicación / Application Error
        </h2>
        <p className="text-slate-500 max-w-md mb-6 text-sm">
          Ocurrió un error crítico. Por favor intente recargar la página. <br />
          A critical error occurred. Please try reloading the page.
        </p>
        <Button
          onClick={() => reset()}
          className="bg-[#800000] hover:bg-[#570000] text-white font-bold px-6 py-2.5 rounded-full shadow"
        >
          Recargar Página / Reload Page
        </Button>
      </body>
    </html>
  );
}
