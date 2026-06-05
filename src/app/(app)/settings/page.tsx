import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getProfile(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">
          Signed in as {user?.email}. Manage your profile and preferences.
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
