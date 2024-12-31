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
    shop: shopData.data.shop,
  });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const title = formData.get("promoTitle");
  const shopName = formData.get("shopName");
  const targetProduct = formData.get("targetProduct");
  const giftProduct = formData.get("giftProduct");

  if (!title || !targetProduct || !giftProduct) {
    return { error: "All fields are required." };
  }

  try {
    // Parse JSON inputs
    const targetProductData = JSON.parse(targetProduct);
    const giftProductData = JSON.parse(giftProduct);

    await db.promo.create({
      data: {
        title,
        shop: shopName,
        targetProduct: JSON.stringify(targetProductData),
        giftProduct: JSON.stringify(giftProductData),
        isActive: true,
      },
    });
    return redirect("/app/promos");
  } catch (error) {
    console.error("Error creating promo:", error);
    return { error: `Failed to create the promo. ${error.message}` };
  }
};

export default function NewPromo() {
  const { shop } = useLoaderData();
  const actionData = useActionData();

  const [promoTitle, setPromoTitle] = useState("");
  const [targetProduct, setTargetProduct] = useState(null);
  const [giftProduct, setGiftProduct] = useState(null);

  const app = useAppBridge();

  async function openPickerTargetProduct() {
    try {
      const response = await app.resourcePicker({ type: "product", multiple: false });
      if (response?.[0]) {
        setTargetProduct(response[0]); // Save selected product directly
      }
    } catch (error) {
      console.error("Error selecting target product:", error);
    }
  }

  async function openPickerGiftProduct() {
    try {
      const response = await app.resourcePicker({ type: "product", multiple: false });
      if (response?.[0]) {
        setGiftProduct(response[0]); // Save selected product directly
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

              {/* Hidden Inputs to Submit Product Data */}
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
              <input type="hidden" name="shopName" value={shop.name} />

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
