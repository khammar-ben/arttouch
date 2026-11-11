export const ORDER_STATUSES = [
  { id: "TO_CONFIRM", label: "À confirmer", next: "CONFIRMED", action: "Confirmer" },
  { id: "CONFIRMED", label: "Confirmée", next: "IN_PRODUCTION", action: "Démarrer la peinture" },
  { id: "IN_PRODUCTION", label: "En production", next: "READY", action: "Marquer prête" },
  { id: "READY", label: "Prête", next: "SHIPPED", action: "Expédier" },
  { id: "SHIPPED", label: "Expédiée", next: "DELIVERED", action: "Marquer livrée" },
  { id: "DELIVERED", label: "Livrée", next: null, action: null },
] as const;

export const CANCELLABLE = new Set(["TO_CONFIRM", "CONFIRMED"]);

export const STATUS_IDS = new Set<string>([...ORDER_STATUSES.map((s) => s.id), "CANCELLED"]);

export function statusLabel(id: string) {
  return id === "CANCELLED" ? "Annulée" : (ORDER_STATUSES.find((s) => s.id === id)?.label ?? id);
}
