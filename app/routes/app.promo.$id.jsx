import { useActionData, Form, useLoaderData, redirect } from "@remix-run/react";
import db from "../db.server";
import { Page, Layout, Card, TextField, Button } from "@shopify/polaris";
import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ params, request }) => {
  await authenticate.admin(request);

  const promo = await db.promo.findUnique({
    where: { id: 5 }, // Replace 2 with a dynamic ID if needed
  });

  if (!promo) {
    throw new Response("Promo not found", { status: 404 });
  }

  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
    query shop {
      shop {
        name
      }
    }`
  );

  const shopData = await response.json();

  return json({
    promo,
    shop: shopData.data.shop,
  });
};

export const action = async ({ request, params }) => {
  const formData = await request.formData();
  const title = formData.get("promoTitle");
  const targetProductJson = formData.get("targetProduct");
  const giftProductJson = formData.get("giftProduct");

  if (!title || !targetProductJson || !giftProductJson) {
    return { error: "All fields are required." };
  }

  try {
    await db.promo.update({
      where: { id: 5 }, // Replace 2 with a dynamic ID if needed
      data: {
        title,
        targetProduct: targetProductJson,
        giftProduct: giftProductJson,
        isActive: true,
      },
    });

    return redirect("/app/promos");
  } catch (error) {
    console.error("Error updating promo:", error);
    return { error: "Failed to update the promo. Please try again." };
  }
};

export default function EditPromo() {
  const { promo, shop } = useLoaderData();
  const actionData = useActionData();

  // Parse JSON safely
  const parseJSON = (jsonString) => {
    try {
      return JSON.parse(jsonString) || {};
    } catch (error) {
      console.error("Invalid JSON:", error);
      return {};
    }
  };

  const [promoTitle, setPromoTitle] = useState(promo.title);
  const [targetProduct, setTargetProduct] = useState(parseJSON(promo.targetProduct));
  const [giftProduct, setGiftProduct] = useState(parseJSON(promo.giftProduct));
  const app = useAppBridge();

  async function openPickerTargetProduct() {
    try {
      const response = await app.resourcePicker({ type: "product", multiple: false });
      if (response && response[0]) {
        const selectedProduct = response[0];
        setTargetProduct(selectedProduct); // Directly save the product object
      }
    } catch (error) {
      console.error("Error selecting target product:", error);
    }
  }

  async function openPickerGiftProduct() {
    try {
      const response = await app.resourcePicker({ type: "product", multiple: false });
      if (response && response[0]) {
        const selectedProduct = response[0];
        setGiftProduct(selectedProduct); // Directly save the product object
      }
    } catch (error) {
      console.error("Error selecting gift product:", error);
    }
  }

  return (
    <Page title="Edit Promo">
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

              {/* Hidden Fields for Product JSON */}
              <input
                type="hidden"
                name="targetProduct"
                value={JSON.stringify(targetProduct) || ""}
              />
              <input
                type="hidden"
                name="giftProduct"
                value={JSON.stringify(giftProduct) || ""}
              />

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
                Update Promo
              </Button>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
