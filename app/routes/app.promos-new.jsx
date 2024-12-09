import { useActionData, Form, useLoaderData, redirect } from "@remix-run/react";
import db from "../db.server";
import { Page, Layout, Card, TextField, Button } from "@shopify/polaris";
import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
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

  return json({
    shop: shopData.data.shop
  });
};


export const action = async ({ request }) => {
  const formData = await request.formData();
  const title = formData.get("promoTitle");
  const shopName = formData.get("shopName");
  const targetProductId = formData.get("targetProductId");
  const giftProductId = formData.get("giftProductId");

  if (!title || !targetProductId || !giftProductId) {
    return { error: "All fields are required." };
  }

  try {
    await db.promo.create({
      data: {
        title,
        shop: shopName, 
        targetProductId,
        giftProductId,
        isActive: true,
      },
    });
    return redirect("/app/promos");
  } catch (error) {
    console.error("Error creating promo:", error);
    return { error: "Failed to create the promo. Please try again." + error };
  }
};

export default function NewPromo() {
  const { shop} = useLoaderData();
  const actionData = useActionData();
  const [shopName, setShopName] = useState(shop.name);
  const [promoTitle, setPromoTitle] = useState("");
  const [targetProduct, setTargetProduct] = useState(null);
  const [giftProduct, setGiftProduct] = useState(null);
  const app = useAppBridge();

  async function openPickerTargetProduct() {
    try {
      const response = await app.resourcePicker({ type: "product", multiple: false });
      if (response) {
        const selectedProduct = response[0];
        setTargetProduct({ id: selectedProduct.id, title: selectedProduct.title });
      }
    } catch (error) {
      console.error("Error selecting target product:", error);
    }
  }

  async function openPickerGiftProduct() {
    try {
      const response = await app.resourcePicker({ type: "product", multiple: false });
      if (response) {
        const selectedProduct = response[0];
        setGiftProduct({ id: selectedProduct.id, title: selectedProduct.title });
      }
    } catch (error) {
      console.error("Error selecting gift product:", error);
    }
  }

  return (
    <Page title="Create a New Promo">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Form method="post">
              <TextField
                label="Promo Title"
                value={promoTitle}
                onChange={(value) => setPromoTitle(value)}
                name="promoTitle"
                type="text"
                autoComplete="off"
                required
              />

              {/* Hidden Fields for Product IDs */}
              <input type="hidden" name="targetProductId" value={targetProduct?.id || ""} />
              <input type="hidden" name="giftProductId" value={giftProduct?.id || ""} />
              <input type="hidden" name="shopName" value={shopName} />
              {actionData?.error && (
                <p style={{ color: "red", marginTop: "10px" }}>{actionData.error}</p>
              )}

              <br />
              <Button onClick={openPickerTargetProduct} primary>
                Select Target Product: {targetProduct?.title || "None"}
              </Button>

              <br />
              <br />
              <Button onClick={openPickerGiftProduct} primary>
                Select Gift Product: {giftProduct?.title || "None"}
              </Button>

              <br />
              <br />

              <Button submit primary>
                Create Promo
              </Button>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
