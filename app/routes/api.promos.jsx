import { json } from "@remix-run/node"; 
import prisma from "../db.server"; 
import { authenticate } from "../shopify.server";

export const loader = async ({request}) => {
  try {
    await authenticate.admin(request);
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(
      `#graphql
      query shop {
        shop {
          name
          primaryDomain {
            url
            host
          }
        }
      }`
    );
  
    const shopData = await response.json();
  
    const promos = await db.promo.findMany({
      select: {
        id: true,
        title: true,
        targetProductId: true,
        giftProductId: true,
        isActive: true,
        shop: true,
      },
      where: {
        shop:shopData.data.shop.name,
      },
    });
    return json(promos);
  } catch (error) {
    console.error("Error :", error);

    return json({ error: "Error." }, { status: 500 });
  }
};
