import { useActionData, Form, useLoaderData, redirect } from "@remix-run/react";
import db from "../db.server";
import { Page, Layout, Card, TextField, Button } from "@shopify/polaris";
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
  const targetCollectionJson = formData.get("targetCollection");
  const giftProductJson = formData.get("giftProduct");
  const targetQuantity = formData.get("targetQuantity");
  const giftQuantity = formData.get("giftQuantity");

  if (!title || !targetCollectionJson || !giftProductJson || !targetQuantity || !giftQuantity) {
    return { error: "All fields are required." };
  }

  try {
    await db.promo.update({
      where: { id: Number(id) },
      data: {
        title,
        collectionTarget: targetCollectionJson,
        giftProduct: giftProductJson,
        targetQuantity: Number(targetQuantity),
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
  const [targetCollection, setTargetCollection] = useState(parseJSON(promo.collectionTarget));
  const [giftProduct, setGiftProduct] = useState(parseJSON(promo.giftProduct));
  const [targetQuantity, setTargetQuantity] = useState(promo.targetQuantity);
  const [giftQuantity, setGiftQuantity] = useState(promo.giftQuantity);
  const app = useAppBridge();

  async function openPickerTargetCollection() {
    try {
      const response = await app.resourcePicker({ type: "collection", multiple: false });
      if (response && response[0]) {
        setTargetCollection(response[0]);
      }
    } catch (error) {
      console.error("Error selecting target collection:", error);
    }
  }

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

              <input
                type="hidden"
                name="targetCollection"
                value={JSON.stringify(targetCollection) || ""}
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
              <Button onClick={openPickerTargetCollection} primary>
                Select Target Collection: {targetCollection?.title || "None"}
              </Button>

              <br />
              <TextField
                label="Target Quantity"
                value={targetQuantity.toString()}
                onChange={(value) => setTargetQuantity(Number(value))}
                name="targetQuantity"
                type="number"
                min={1}
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
                Update Promo
              </Button>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
