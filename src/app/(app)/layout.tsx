import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileNav, NavBar } from "@/components/nav-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <NavBar email={user.email ?? null} />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
