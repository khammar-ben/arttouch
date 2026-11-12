import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken } from "./admin-token";

/**
 * À appeler en tête de chaque action et page de l'atelier : le middleware protège les URL /admin,
 * mais une action serveur reste un point d'entrée public.
 */
export async function requireAdmin() {
  const token = await adminToken();
  const session = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || session !== token) redirect("/admin/login");
}
