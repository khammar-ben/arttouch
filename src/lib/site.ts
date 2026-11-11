export const SITE_NAME = "Arttouch";

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "212600000000";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const ROOMS: Record<string, string> = {
  salon: "Salon",
  chambre: "Chambre",
  entree: "Entrée",
  bureau: "Bureau",
};

export const CITIES = [
  "Casablanca",
  "Rabat",
  "Salé",
  "Témara",
  "Kénitra",
  "Mohammedia",
  "Marrakech",
  "Fès",
  "Meknès",
  "Tanger",
  "Tétouan",
  "Agadir",
  "Oujda",
  "El Jadida",
  "Safi",
  "Béni Mellal",
  "Nador",
  "Khouribga",
  "Settat",
  "Laâyoune",
  "Autre ville",
];
