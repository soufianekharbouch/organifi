import { json } from "@remix-run/node"; 
import prisma from "../db.server"; 
import { cors } from 'remix-utils/cors';


export const loader = async ({request,params}) => {
  const { shop } = params;
  try {

    const promos = await prisma.promo.findMany({
      where: {
        shop:shop,
      },
    });

    return await cors(request, promos);
  } catch (error) {
    console.error("Error :", error);

    return json({ error: "Error" }, { status: 500 });
  }
};