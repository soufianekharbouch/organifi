import { json } from "@remix-run/node"; 
import prisma from "../db.server"; 



export const loader = async ({params}) => {
  const { shop } = params;
  try {

    const promos = await prisma.promo.findMany({
      where: {
        shop:shop,
      },
    });


    return json(promos);
  } catch (error) {
    console.error("Error :", error);

    return json({ error: "Error" }, { status: 500 });
  }
};