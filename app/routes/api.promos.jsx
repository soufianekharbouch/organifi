import { json } from "@remix-run/node"; 
import prisma from "../db.server"; 


export const loader = async () => {
  try {

    const promos = await prisma.promo.findMany();


    return json(promos);
  } catch (error) {
    console.error("Erreur lors de la récupération des promos :", error);

    return json({ error: "Erreur lors de la récupération des promos." }, { status: 500 });
  }
};
