import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { Page, List, Layout, Card, DataTable, Button, Modal, TextContainer, Banner, Link } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useState } from "react";
import "../routes/styles/style.css";
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
      type: true,
      collectionTarget: true,
      amount_to_spend: true,
    },
    where: {
      shop: shopData.data.shop.name,
    },
  });

  return { promos };
};

// Action to handle delete and toggle status
export const action = async ({ request }) => {
  const formData = await request.formData();
  const promoId = parseInt(formData.get("promoId"), 10);
  const actionType = formData.get("actionType");

  if (!promoId) {
    return json({ success: false, message: "Promo ID is missing." });
  }

  try {
    if (actionType === "delete") {
      // Handle delete action
      await db.promo.delete({ where: { id: promoId } });
      return json({ success: true, message: "Promo deleted successfully." });
    } else if (actionType === "toggleStatus") {
      // Handle toggle status action
      const promo = await db.promo.findUnique({ where: { id: promoId } });
      if (!promo) {
        return json({ success: false, message: "Promo not found." });
      }
      await db.promo.update({
        where: { id: promoId },
        data: { isActive: !promo.isActive },
      });
      return json({ success: true, message: "Promo status updated successfully." });
    }
  } catch (error) {
    console.error("Error:", error);
    return json({ success: false, message: "An error occurred. Please try again." });
  }
};

export default function PromoList() {
  const { promos } = useLoaderData();
  const actionData = useActionData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPromoDetails, setSelectedPromoDetails] = useState(null);

  const handleViewPromo = (promo) => {
    setSelectedPromoDetails(promo);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedPromoDetails(null);
  };

  const handleDelete = (promoId) => {
    setSelectedPromoId(promoId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPromoId(null);
  };

  const closePromoModal = () => {
    setIsPromoModalOpen(false);
  };

  const openPromoModal = () => {
    setIsPromoModalOpen(true);
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

  const rows = promos.map((promo) => {
    let editUrl = `/app/product-target/${promo.id}`; // Default fallback

    switch (promo.type) {
      case "product_target":
        editUrl = `/app/product-target/${promo.id}`;
        break;
      case "collection_target":
        editUrl = `/app/collection-target/${promo.id}`;
        break;
      case "threshold":
        editUrl = `/app/threshold/${promo.id}`;
        break;
    }

    return [
      promo.title,
      promo.type.replace('_', ' ').toUpperCase(),
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

        <Button url={editUrl} plain>Edit</Button>
        <Button variant="primary" tone="critical" plain onClick={() => handleDelete(promo.id)}>
          Delete
        </Button>
        <Button variant="plain" icon="view" onClick={() => handleViewPromo(promo)}>
          View
        </Button>
      </div>,
              <Form method="post" style={{ display: "inline" }}>
              <input type="hidden" name="promoId" value={promo.id} />
              <input type="hidden" name="actionType" value="toggleStatus" />
              <label className="switch">
                <input
                  type="checkbox"
                  checked={promo.isActive}
                  onChange={() => {
                    // Submit the form to toggle the status
                    const form = document.getElementById(`toggle-form-${promo.id}`);
                    if (form) form.submit();
                  }}
                />
                <span className="slider round"></span>
              </label>
            </Form>,
    ];
  });

  return (
    <Page title="Auto Add">
      <TitleBar title="Auto Add Promos">
        <Button primary url="/app/promos-new">
          Add New Auto Add
        </Button>
      </TitleBar>
      <Layout>
        <Layout.Section>
          {actionData?.message && (
            <Banner status={actionData.success ? "success" : "critical"}>{actionData.message}</Banner>
          )}
          <Card>
            <DataTable
              columnContentTypes={["text", "text", "action"]}
              headings={["Promo Title", "Type", "Actions","status"]}
              rows={rows}
            />
          </Card>
        </Layout.Section>
      </Layout>

      {/* Modal for Viewing Promo Details */}
      {isViewModalOpen && selectedPromoDetails && (
        <Modal
          open={isViewModalOpen}
          onClose={closeViewModal}
          title={`Promo Details - ${selectedPromoDetails.title}`}
          primaryAction={{
            content: "Close",
            onAction: closeViewModal,
          }}
        >
          <Modal.Section>
            <TextContainer>
              <p><strong>Type:</strong> {selectedPromoDetails.type.replace('_', ' ').toUpperCase()}</p>
              {selectedPromoDetails.type === "product_target" && (
                <>
                  <p><strong>Target Product:</strong> {safeParseJSON(selectedPromoDetails.targetProduct).title || "N/A"}</p>
                  <p><strong>Gift Product:</strong> {safeParseJSON(selectedPromoDetails.giftProduct).title || "N/A"}</p>
                </>
              )}
              {selectedPromoDetails.type === "collection_target" && (
                <>
                  <p><strong>Target Collection:</strong> {safeParseJSON(selectedPromoDetails.collectionTarget).title || "N/A"}</p>
                  <p><strong>Gift Product:</strong> {safeParseJSON(selectedPromoDetails.giftProduct).title || "N/A"}</p>
                </>
              )}
              {selectedPromoDetails.type === "threshold" && (
                <>
                  <p><strong>Amount to Spend:</strong> ${selectedPromoDetails.amount_to_spend.toFixed(2)}</p>
                  <p><strong>Gift Product:</strong> {safeParseJSON(selectedPromoDetails.giftProduct).title || "N/A"}</p>
                </>
              )}
              <p><strong>Status:</strong> {selectedPromoDetails.isActive ? "Active" : "Inactive"}</p>
            </TextContainer>
          </Modal.Section>
        </Modal>
      )}

      {/* Modal for Delete Confirmation */}
      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onClose={closeModal}
          title="Delete Auto Add"
          primaryAction={{
            content: "Delete",
            destructive: true,
            onAction: async () => {
              try {
                // Submit delete form
                const form = document.getElementById(`delete-form-${selectedPromoId}`);
                if (form) {
                  form.submit();
                }
                setIsModalOpen(false);
              } catch (error) {
                console.error("Error deleting promo:", error);
              }
            },
          }}
          secondaryAction={{
            content: "Cancel",
            onAction: closeModal,
          }}
        >
          <Modal.Section>
            <TextContainer>
              <p>Are you sure you want to delete this auto add promo? This action cannot be undone.</p>
            </TextContainer>
          </Modal.Section>
        </Modal>
      )}

      {/* Hidden Forms for Deletion */}
      {promos.map((promo) => (
        <Form method="post" key={promo.id} id={`delete-form-${promo.id}`} style={{ display: "none" }}>
          <input type="hidden" name="promoId" value={promo.id} />
          <input type="hidden" name="actionType" value="delete" />
        </Form>
      ))}

      {/* Hidden Forms for Status Toggle */}
      {promos.map((promo) => (
        <Form method="post" key={`toggle-form-${promo.id}`} id={`toggle-form-${promo.id}`} style={{ display: "none" }}>
          <input type="hidden" name="promoId" value={promo.id} />
          <input type="hidden" name="actionType" value="toggleStatus" />
        </Form>
      ))}

      <Layout.Section>
        <Button variant="primary" onClick={() => openPromoModal()}>
          Create New Auto Add
        </Button>
      </Layout.Section>

      {/* Modal for Promo Type Selection */}
      {isPromoModalOpen && (
        <Modal
          open={isPromoModalOpen}
          onClose={() => closePromoModal()}
          title="Select Promo Type"
        >
          <Modal.Section>
            <TextContainer>
              <p>Please choose the type of auto add you want to create:</p>
              <List>
                <List.Item>
                  <Link url="/app/new-product-target">Auto Add By Product Target</Link>
                </List.Item>
                <List.Item>
                  <Link url="/app/new-collection-target">Auto Add By Collection Target</Link>
                </List.Item>
                <List.Item>
                  <Link url="/app/new-threshold">Auto Add By Threshold</Link>
                </List.Item>
              </List>
            </TextContainer>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}