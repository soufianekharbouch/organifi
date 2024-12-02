import { useLoaderData, Form, redirect } from "@remix-run/react";
import { Page, Layout, Card, TextField, Button } from "@shopify/polaris";
import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

import db from "../db.server";

// Loader to fetch the promo
export const loader = async ({ params }) => {
  const { id } = params;
  const promo = await db.promo.findUnique({
    where: { id: parseInt(id) },
  });

  if (!promo) {
    throw new Response("Promo not found", { status: 404 });
  }

  return { promo };
};

// Action to handle promo updates
export const action = async ({ request, params }) => {
  const { id } = params;
  const formData = await request.formData();
  const title = formData.get("promoTitle");
  const targetProductId = formData.get("targetProductId");
  const giftProductId = formData.get("giftProductId");

  if (!title || !targetProductId || !giftProductId) {
    return { error: "All fields are required." };
  }

  try {
    await db.promo.update({
      where: { id: parseInt(id) },
      data: {
        title,
        targetProductId,
        giftProductId,
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
  const { promo } = useLoaderData();
  const [promoTitle, setPromoTitle] = useState(promo.title);
  const [targetProduct, setTargetProduct] = useState({
    id: promo.targetProductId,
    title: "Target Product",
  });
  const [giftProduct, setGiftProduct] = useState({
    id: promo.giftProductId,
    title: "Gift Product",
  });
  const app = useAppBridge();

  // Open the picker for target product
  async function openPickerTargetProduct() {
    try {
      const picker = app.resourcePicker({
        type: "product",
        multiple: false,
        initialSelectionIds: [{ id: targetProduct.id }], // Pre-select current target product
      });

      const response = await picker;
      if (response && response.length > 0) {
        const selectedProduct = response[0];
        setTargetProduct({ id: selectedProduct.id, title: selectedProduct.title });
      }
    } catch (error) {
      console.error("Error selecting target product:", error);
    }
  }

  // Open the picker for gift product
  async function openPickerGiftProduct() {
    try {
      const picker = app.resourcePicker({
        type: "product",
        multiple: false,
        initialSelectionIds: [{ id: giftProduct.id }], // Pre-select current gift product
      });

      const response = await picker;
      if (response && response.length > 0) {
        const selectedProduct = response[0];
        setGiftProduct({ id: selectedProduct.id, title: selectedProduct.title });
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
              {/* Promo Title */}
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

              <br />
              {/* Target Product Picker */}
              <Button onClick={openPickerTargetProduct} primary>
                Select Target Product: {targetProduct?.title || "None"}
              </Button>

              <br />
              <br />
              {/* Gift Product Picker */}
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
