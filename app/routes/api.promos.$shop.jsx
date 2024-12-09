import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ params }) => {
  const { shop } = params;

  try {
    const promos = await prisma.promo.findMany({
      where: {
        shop: shop,
      },
    });

    return json(promos, {
      headers: {
        "Access-Control-Allow-Origin": "*", // Autorise toutes les origines
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Méthodes autorisées
        "Access-Control-Allow-Headers": "Content-Type, Authorization", // En-têtes autorisés
      },
    });
  } catch (error) {
    console.error("Error :", error);

    return json(
      { error: "Error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*", // Autorise toutes les origines
        },
      }
    );
  }
};

// OPTIONS handler for preflight requests
export const action = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};
