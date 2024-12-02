import { json } from "@remix-run/node"; // Pour renvoyer les données au format JSON
import prisma from "../db.server"; // Assurez-vous que ce chemin correspond à votre configuration Prisma

// Loader pour gérer les requêtes GET
export const loader = async () => {
  try {
    // Récupérer toutes les promos dans la table Promo via Prisma
    const promos = await prisma.promo.findMany();

    // Retourner les promos au format JSON
    return json(promos);
  } catch (error) {
    console.error("Erreur lors de la récupération des promos :", error);

    // En cas d'erreur, retourner un message d'erreur avec un code HTTP 500
    return json({ error: "Erreur lors de la récupération des promos." }, { status: 500 });
  }
};
