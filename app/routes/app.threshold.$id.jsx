import { useActionData, Form, useLoaderData, redirect } from "@remix-run/react";
import db from "../db.server";
import { Page, Layout,ButtonGroup, Card, TextField, Button } from "@shopify/polaris";
import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ params, request }) => {
  const { id } = params;
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
  const promo = await db.promo.findUnique({
    where: { id: Number(id), shop: shopData.data.shop.name },
  });

  if (!promo) {
    throw new Response("Promo not found", { status: 404 });
  }

  return json({
    promo,
    shop: shopData.data.shop,
  });
};

export const action = async ({ request, params }) => {
  const { id } = params;
  const formData = await request.formData();
  const title = formData.get("promoTitle");
  const giftProductJson = formData.get("giftProduct");
  const amountToSpend = formData.get("amountToSpend");
  const giftQuantity = formData.get("giftQuantity");

  if (!title || !giftProductJson || !amountToSpend || !giftQuantity) {
    return { error: "All fields are required." };
  }

  try {
    await db.promo.update({
      where: { id: Number(id) },
      data: {
        title,
        giftProduct: giftProductJson,
        amount_to_spend: Number(amountToSpend),
        giftQuantity: Number(giftQuantity),
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

  const parseJSON = (jsonString) => {
    try {
      return JSON.parse(jsonString) || {};
    } catch (error) {
      console.error("Invalid JSON:", error);
      return {};
    }
  };

  const [promoTitle, setPromoTitle] = useState(promo.title);
  const [giftProduct, setGiftProduct] = useState(parseJSON(promo.giftProduct));
  const [amountToSpend, setAmountToSpend] = useState(promo.amount_to_spend);
  const [giftQuantity, setGiftQuantity] = useState(promo.giftQuantity);
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
    <Page title="Edit Threshold Promo">
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

              <input
                type="hidden"
                name="giftProduct"
                value={JSON.stringify(giftProduct) || ""}
              />

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

              {actionData?.error && (
                <p style={{ color: "red", marginTop: "10px" }}>{actionData.error}</p>
              )}
              <ButtonGroup>
                <Button submit variant="primary">
                Update Promo
                </Button>
                <Button url="/app/promos" destructive>
                  Cancel
                </Button>
              </ButtonGroup>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
