import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load the signed-in user's profile (name + role). A DB trigger creates
  // this row on signup; we fall back gracefully if it's not there yet.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile = profileRow ?? {
    id: user.id,
    full_name:
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "User",
    role: "user",
    created_at: new Date().toISOString(),
  };

  return <DashboardClient profile={profile} />;
}
