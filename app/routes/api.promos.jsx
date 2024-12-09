import { json } from "@remix-run/node"; 
import prisma from "../db.server"; 


export const loader = async () => {
  try {

    const promos = await prisma.promo.findMany();


    return json(promos);
  } catch (error) {
    console.error("Error :", error);

    return json({ error: "Error" }, { status: 500 });
  }
};
