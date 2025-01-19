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
  const giftProductJson = formData.get("giftProduct");
  const amountToSpend = formData.get("amountToSpend");
  const giftQuantity = formData.get("giftQuantity");

  if (!title || !giftProductJson || !amountToSpend || !giftQuantity) {
    return { error: "All fields are required." };
  }

  try {
    await db.promo.create({
      data: {
        title,
        shop: shopName,
        giftProduct: giftProductJson,
        amount_to_spend: Number(amountToSpend),
        giftQuantity: Number(giftQuantity),
        isActive: true,
        type:"threshold",
      },
    });

    return redirect("/app/promos");
  } catch (error) {
    console.error("Error creating promo:", error);
    return { error: "Failed to create the promo. Please try again." +error};
  }
};

export default function NewPromo() {
  const { shop } = useLoaderData();
  const actionData = useActionData();

  const [promoTitle, setPromoTitle] = useState("");
  const [giftProduct, setGiftProduct] = useState(null);
  const [amountToSpend, setAmountToSpend] = useState(0.0);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const app = useAppBridge();

  async function openPickerGiftProduct() {
    try {
      const response = await app.resourcePicker({ type: "product", multiple: false });
      if (response && response[0]) {
        setGiftProduct(response[0]);
      }
    } catch (error) {
      console.error("Error selecting gift product:", error);
    }
  }

  return (
    <Page title="Create a New Threshold Promo">
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
              <input type="hidden" name="shopName" value={shop.name} />
              <input
                type="hidden"
                name="giftProduct"
                value={JSON.stringify(giftProduct) || ""}
              />

              {actionData?.error && (
                <p style={{ color: "red", marginTop: "10px" }}>{actionData.error}</p>
              )}

              <br />
              <TextField
                label="Amount to Spend"
                value={amountToSpend.toString()}
                onChange={(value) => setAmountToSpend(parseFloat(value))}
                name="amountToSpend"
                type="number"
                min={0.0}
                step={0.01}
                required
              />
              <br />
              <Button onClick={openPickerGiftProduct} primary>
                Select Gift Product: {giftProduct?.title || "None"}
              </Button>

              <br />
              <TextField
                label="Gift Quantity"
                value={giftQuantity.toString()}
                onChange={(value) => setGiftQuantity(Number(value))}
                name="giftQuantity"
                type="number"
                min={1}
                required
              />
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
