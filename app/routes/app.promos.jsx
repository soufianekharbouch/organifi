import { useLoaderData, Form } from "@remix-run/react";
import { Page, Layout, Card, DataTable, Button, Link } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import db from "../db.server";

// Loader to fetch promos
export const loader = async () => {
  const promos = await db.promo.findMany({
    select: {
      id: true,
      title: true,
      targetProductId: true,
      giftProductId: true,
      isActive: true,
    },
  });

  return { promos };
};

// Action to handle deletion
export const action = async ({ request }) => {
  const formData = await request.formData();
  const promoId = formData.get("promoId");

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

  // Prepare rows for DataTable
  const rows = promos.map((promo) => [
    promo.title,
    promo.targetProductId,
    promo.giftProductId,
    promo.isActive ? "Active" : "Inactive",
    <div style={{ display: "flex", gap: "10px" }}>
      {/* Edit Button */}
      <Button url={`/app/promo/${promo.id}`} plain>
          Edit
      </Button>


      {/* Delete Button as a Form */}
      <Form method="post" style={{ margin: 0 }}>
        <input type="hidden" name="promoId" value={promo.id} />
        <Button plain destructive submit>
          Delete
        </Button>
      </Form>
    </div>,
  ]);



  return (
    <Page title="Promos">
      <TitleBar title="Available Promos">
        <Link url="/app/promos-new" variant="primary">
          Add New Promo
        </Link>
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
    </Page>
  );
}
