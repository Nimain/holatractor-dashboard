"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6 text-center">
      <h1 className="text-6xl font-extrabold text-[#800000] mb-2">404</h1>
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-slate-500 max-w-md mb-6 text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/login">
        <Button className="bg-[#800000] hover:bg-[#570000] text-white font-bold px-6 py-2 rounded-full">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
