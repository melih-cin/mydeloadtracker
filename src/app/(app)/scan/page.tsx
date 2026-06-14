import { createClient } from "@/lib/supabase/server";
import { getExercises, getProfile } from "@/lib/data";
import { BarScanner } from "@/components/bar-scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const supabase = createClient();
  const [exercises, profile] = await Promise.all([getExercises(supabase), getProfile(supabase)]);
  const units = profile?.units ?? "kg";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Scan the bar</h1>
        <p className="text-sm text-muted">
          Take a photo of your loaded barbell — the AI reads the plates, figures out the weight, and
          logs the set. Hands-light. (This is the phone version of the glasses experience.)
        </p>
      </div>
      <BarScanner exercises={exercises} units={units} />
    </div>
  );
}
