import { useLoaderData, Form } from "@remix-run/react";
import { Page, Layout, Card, DataTable, Button, Modal, TextContainer } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import { json, redirect } from "@remix-run/node";
import { useState } from "react";

// Loader to fetch promos
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

  const promos = await db.promo.findMany({
    select: {
      id: true,
      title: true,
      targetProduct: true,
      giftProduct: true,
      isActive: true,
      shop: true,
    },
    where: {
      shop: shopData.data.shop.name,
    },
  });

  return { promos };
};

// Action to delete a promo
export const action = async ({ request }) => {
  const formData = await request.formData();
  const promoId = parseInt(formData.get("promoId"), 10);

  if (promoId) {
    try {
      await db.promo.delete({ where: { id: promoId } });
      return redirect("/app/promos");
    } catch (error) {
      console.error("Error deleting promo:", error);
      return { error: "Failed to delete the promo. Please try again." };
    }
  }

  return null;
};

export default function PromoList() {
  const { promos } = useLoaderData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState(null);

  const handleDelete = (promoId) => {
    setSelectedPromoId(promoId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPromoId(null);
  };

  // Helper function to safely parse JSON
  const safeParseJSON = (jsonString) => {
    try {
      return JSON.parse(jsonString) || {};
    } catch (error) {
      console.error("Invalid JSON:", error);
      return {}; // Return an empty object if JSON is invalid
    }
  };

  // Prepare rows for DataTable
  const rows = promos.map((promo) => {
    const targetProduct = safeParseJSON(promo.targetProduct);
    const giftProduct = safeParseJSON(promo.giftProduct);

    return [
      promo.title,
      targetProduct.title || "N/A",
      giftProduct.title || "N/A",
      promo.isActive ? "Active" : "Inactive",
      <div style={{ display: "flex", gap: "10px" }}>
        {/* Edit Button */}
        <Button url={`/app/promo/${promo.id}`} plain>
          Edit
        </Button>

        {/* Delete Button */}
        <Button plain destructive onClick={() => handleDelete(promo.id)}>
          Delete
        </Button>
      </div>,
    ];
  });

  return (
    <Page title="Promos">
      <TitleBar title="Available Promos">
        <Button primary url="/app/promos-new">
          Add New Promo
        </Button>
      </TitleBar>
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "action"]}
              headings={["Promo Title", "Target Product", "Gift Product", "Status", "Actions"]}
              rows={rows}
            />
          </Card>
        </Layout.Section>
      </Layout>

      {/* Modal for Delete Confirmation */}
      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onClose={closeModal}
          title="Delete Promo"
          primaryAction={{
            content: "Delete",
            destructive: true,
            onAction: () => document.getElementById(`delete-form-${selectedPromoId}`).submit(),
          }}
          secondaryAction={{
            content: "Cancel",
            onAction: closeModal,
          }}
        >
          <Modal.Section>
            <TextContainer>
              <p>Are you sure you want to delete this promo? This action cannot be undone.</p>
            </TextContainer>
          </Modal.Section>
        </Modal>
      )}

      {/* Hidden Forms for Deletion */}
      {promos.map((promo) => (
        <Form method="post" key={promo.id} id={`delete-form-${promo.id}`} style={{ display: "none" }}>
          <input type="hidden" name="promoId" value={promo.id} />
        </Form>
      ))}
    </Page>
  );
}
