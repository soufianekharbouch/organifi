import {
  Text,
  Page,
  Layout,
  Button,
  BlockStack,
  TextField,
  Checkbox,
  PageActions,
  Select,
} from "@shopify/polaris";

import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useActionData, useLoaderData, useSubmit,redirect } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export const loader = async ({ request, params }) => {
  await authenticate.admin(request);
  const { id } = params;

  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
    query discountAutomaticApp($id: ID!) {
      shop {
        name
        primaryDomain {
          url
          host
        }
      }
      automaticDiscountNode(id: $id) {
        id
        metafields(first: 100) {
          nodes {
            key
            value
          }
        }
        automaticDiscount {
          ... on DiscountAutomaticApp {
            title
            combinesWith {
              orderDiscounts
              productDiscounts
              shippingDiscounts
            }
            appDiscountType {
              functionId
            }
          }
        }
      }
    }
    `,
    {
      variables: {
        id: "gid://shopify/DiscountAutomaticNode/" + id,
      },
    }
  );

  const currentDiscount = await response.json();

  return json({
    currentDiscount,
    discountsURL: currentDiscount.data.shop.primaryDomain.url + "/admin/discounts",
  });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const Title = formData.get("Title");
  const functionId = formData.get("functionId");
  const id = "gid://shopify/DiscountAutomaticNode/" + formData.get("id");
  const productHandles = formData.get("productHandles");
  const qtyTargets = formData.get("qtyTargets");
  const gift = formData.get("gift");
  const onlySub = formData.get("onlySub");
  const giftQuantity = formData.get("giftQuantity");
  const discountType = formData.get("discountType");
  const thresholdAmount = formData.get("thresholdAmount");
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
    mutation discountAutomaticAppUpdate($automaticAppDiscount: DiscountAutomaticAppInput!, $id: ID!, $metafields: [MetafieldsSetInput!]!) {
      discountAutomaticAppUpdate(automaticAppDiscount: $automaticAppDiscount, id: $id) {
        automaticAppDiscount {
          discountId
        }
        userErrors {
          field
          message
        }
      }
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          ownerType
          value
        }
        userErrors {
          field
          message
        }
      }
    }
    `,
    {
      variables: {
        id: id,
        automaticAppDiscount: {
          combinesWith: {
            orderDiscounts: true,
            productDiscounts: true,
            shippingDiscounts: true,
          },
          functionId: functionId,
          title: Title,
        },
        metafields: [
          {
            ownerId: id,
            key: "function-configuration",
            namespace: "$app:gwp",
            type: "json",
            value: JSON.stringify({
              product: productHandles,
              qtyTargets: qtyTargets,
              gift: gift,
              giftQuantity: giftQuantity,
              discountType: discountType,
              thresholdAmount: discountType === "threshold" ? thresholdAmount : null,
              is_sub: onlySub.toString(),
            }),
          },
        ],
      },
    }
  );

  const responseJson = await response.json();
  return json({
    resp: responseJson,
  });
};

export default function Index() {
  const { id } = useParams();
  const actionData = useActionData(); 
  const { currentDiscount } = useLoaderData();
  const [Title, setTitleValue] = useState("");
  const [onlySub, setSub] = useState(false);
  const [productsSelected, setProductsSelected] = useState([]);
  const [qtyTargets, setQtyTargets] = useState(1);
  const [productGift, setProductGift] = useState("");
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [discountType, setDiscountType] = useState("products");
  const [thresholdAmount, setThresholdAmount] = useState(100);
  const app = useAppBridge();
  useEffect(() => {
    if (actionData) {
      shopify.toast.show(JSON.stringify(actionData));
      if (actionData.resp.data.discountAutomaticAppUpdate.userErrors.length > 0) {
        let error = actionData.resp.data.discountAutomaticAppUpdate.userErrors[0];
        shopify.toast.show("Error: " + error.field[1] + " " + error.message, {
          autoClose: 2000,
          hideProgressBar: true,
          isError: true,
        });
      } else {
        shopify.toast.show("Discount Created!");
      }
    }
    if (currentDiscount) {
      const data = JSON.parse(currentDiscount.data.automaticDiscountNode.metafields.nodes[0].value);
      setTitleValue(currentDiscount.data.automaticDiscountNode.automaticDiscount.title);
      setSub(data.is_sub === "true");
      setProductsSelected(data.product.split(","));
      setQtyTargets(data.qtyTargets || 1);
      setProductGift(data.gift);
      setGiftQuantity(data.giftQuantity || 1);
      setDiscountType(data.discountType);
      setThresholdAmount(data.thresholdAmount || 100);
    }
  }, [actionData,currentDiscount]);

  const openPickerTargetProducts = async () => {
    try {
      const picker = app.resourcePicker({
        type: "product",
        multiple: true,
      });

      const response = await picker;
      if (response && response.length > 0) {
        const selectedProducts = response.map((product) => product.handle);
        setProductsSelected(selectedProducts);
      }
    } catch (error) {
      console.error("Error selecting target products:", error);
    }
  };

  const openPickerGiftProducts = async () => {
    try {
      const picker = app.resourcePicker({
        type: "product",
        multiple: false,
      });

      const response = await picker;
      if (response && response.length > 0) {
        const selectedGift = response[0].handle;
        setProductGift(selectedGift);
      }
    } catch (error) {
      console.error("Error selecting gift product:", error);
    }
  };

  const formData = new FormData();
  formData.append("Title", Title);
  formData.append("functionId", currentDiscount?.data?.automaticDiscountNode?.automaticDiscount?.appDiscountType?.functionId);
  formData.append("id", id);
  formData.append("productHandles", productsSelected.join(","));
  formData.append("qtyTargets", qtyTargets);
  formData.append("gift", productGift);
  formData.append("onlySub", onlySub);
  formData.append("giftQuantity", giftQuantity);
  formData.append("discountType", discountType);
  if (discountType === "threshold") {
    formData.append("thresholdAmount", thresholdAmount);
  }

  const submit = useSubmit();
  const handleSave = async () => {
    await submit(formData, { replace: true, method: "POST" });
  };

  return (
    <Page title="Update GWP Discount" breadcrumbs={[{ content: "GWP Discount" }]}>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <form>
              <TextField label="Title" value={Title} onChange={(value) => setTitleValue(value)} />
              <br/><br/>
              <Select
                label="Discount Type"
                options={[
                  { label: "Products", value: "products" },
                  { label: "Threshold", value: "threshold" },
                ]}
                value={discountType}
                onChange={(value) => setDiscountType(value)}
              />
               <br/><br/>
              {discountType === "products" ? (
                <>
                  <Button onClick={openPickerTargetProducts}>Select Target Products</Button>
                  <ul>
                    {productsSelected.map((product, index) => (
                      <li key={index}>{product}</li>
                    ))}
                  </ul>
                  <br/><br/>
                  <TextField
                    label="Quantity of Target Products"
                    type="number"
                    value={qtyTargets}
                    onChange={(value) => setQtyTargets(value)}
                    min={1}
                  /> <br/><br/>
                </>
              ) : (
                
                <TextField
                  label="Threshold Amount"
                  type="number"
                  value={thresholdAmount}
                  onChange={(value) => setThresholdAmount(value)}
                  min={1}
                />
              )}
        
              <Checkbox
                label="Only Subscription Product"
                checked={onlySub}
                onChange={(value) => setSub(value)}
              />
               <br/><br/>
              <Button onClick={openPickerGiftProducts}>Select Gift Product</Button>
              {productGift && <p>Selected Gift: {productGift}</p>}
              <br/><br/>
              <TextField
                label="Gift Product Quantity"
                type="number"
                value={giftQuantity}
                onChange={(value) => setGiftQuantity(value)}
                min={1}
              />
            </form>
          </Layout.Section>
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: "Save",
                onAction: handleSave,
                disabled: false,
              }}
              secondaryActions={[{ content: "Discard" }]}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
