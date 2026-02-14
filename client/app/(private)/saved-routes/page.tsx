import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import SavedRoutesView from "@/components/saved-routes/SavedRoutesView";
import type { ISavedRoute } from "@/components/saved-routes/types";

async function getSavedRoutes(): Promise<ISavedRoute[]> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  if (!refreshToken) return [];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/saved-routes/`,
      {
        method: "GET",
        headers: {
          Cookie: `refreshToken=${refreshToken.value}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.routes ?? [];
  } catch {
    return [];
  }
}

export default async function SavedRoutesPage() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  if (!refreshToken) {
    redirect("/login");
  }

  const routes = await getSavedRoutes();

  return <SavedRoutesView routes={routes} />;
}
