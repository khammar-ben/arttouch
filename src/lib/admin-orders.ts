import type { Prisma } from "@prisma/client";
import { STATUS_IDS } from "./order-status";

export type OrderFilters = { q?: string; statut?: string };

/** Filtre commun à la liste des commandes et à l'export CSV. */
export function orderWhere({ q, statut }: OrderFilters): Prisma.OrderWhereInput {
  const search = q?.trim();
  return {
    ...(statut && STATUS_IDS.has(statut) && { status: statut }),
    ...(search && {
      OR: [
        { number: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search.replace(/[\s.-]/g, "") } },
        { city: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };
}
