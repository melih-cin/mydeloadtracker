import Link from "next/link";
import { ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getExercises, getProfile } from "@/lib/data";
import { LogForm } from "@/components/log-form";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const supabase = createClient();
  const [exercises, profile] = await Promise.all([getExercises(supabase), getProfile(supabase)]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Log a workout</h1>
        {/* Scan lives inside Log */}
        <Link href="/scan" className="btn-ghost sm:px-5">
          <ScanLine className="h-4 w-4" />
          Scan
        </Link>
      </div>

      <LogForm exercises={exercises} units={profile?.units ?? "kg"} />
    </div>
  );
}
