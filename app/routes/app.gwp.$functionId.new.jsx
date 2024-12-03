import {
  Text,
  Box,
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
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {  useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
    query discountAutomaticApp{
      shop {
        name
        primaryDomain {
          url
          host
        }
      }
    }`
  );

  const currentDiscount = await response.json();
  
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: process.env.SHOPIFY_APP_URL || "",
    currentDiscount: currentDiscount,
    discountsURL: currentDiscount.data.shop.primaryDomain.url + "/admin/discounts"
  });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const Title = formData.get("Title");
  const functionId = formData.get("functionId");
  const productHandles = formData.get("productHandles");
  const qtyTargets = formData.get("qtyTargets"); // Capture qtyTargets
  const gift = formData.get("gift");
  const onlySub = formData.get("onlySub");
  const giftQuantity = formData.get("giftQuantity");
  const discountType = formData.get("discountType");
  const thresholdAmount = formData.get("thresholdAmount");

  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
    mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
        automaticAppDiscount {
          discountId
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        automaticAppDiscount: {
          combinesWith: {
            orderDiscounts: true,
            productDiscounts: true,
            shippingDiscounts: true
          },
          functionId: functionId,
          metafields: [
            {
              key: "function-configuration",
              namespace: "$app:gwp",
              type: "json",
              value: JSON.stringify({
                product: "" + productHandles,
                qtyTargets: qtyTargets, // Add qtyTargets to metafields
                gift: "" + gift,
                giftQuantity: giftQuantity,
                discountType: discountType,
                thresholdAmount: discountType === "threshold" ? thresholdAmount : null,
                is_sub: onlySub,
              })
            }
          ],
          startsAt: "2023-11-11",
          title: Title
        }
      },
    }
  );
  
  const responseJson = await response.json();
  
  return json({
    resp: responseJson,
  });
};

export default function Index() {
  const { functionId } = useParams();
  const nav = useNavigation();
  const actionData = useActionData(); 
  const { discountsURL } = useLoaderData();
  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";
  const resp = actionData;
  useEffect(() => {
    if (resp) {
      if (resp.resp.data.discountAutomaticAppCreate.userErrors.length > 0) {
        let error = resp.resp.data.discountAutomaticAppCreate.userErrors[0];
        shopify.toast.show("Error: " + error.field[1] + " " + error.message, {
          autoClose: 2000,
          hideProgressBar: true,
          isError: true,
        });
      } else {
        shopify.toast.show("Discount Created!");
      }
    }
  }, [resp,  discountsURL]);

  const [Title, setTitleValue] = useState('Title GWP');
  const [onlySub, setSub] = useState(false);
  const [productsSelected, setProductsSelected] = useState([]);
  const [productGift, setProductGift] = useState([]);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [discountType, setDiscountType] = useState('products');
  const [thresholdAmount, setThresholdAmount] = useState(100);
  const [qtyTargets, setQtyTargets] = useState(1); // State for qtyTargets
  const app = useAppBridge();
  async function openPickerTargetProducts() {
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
      console.error("Error selecting target product:", error);
    }
  }
  async function openPickerGiftProducts() {
    try {
      const picker = app.resourcePicker({
        type: "product",
        multiple: true,
      });

      const response = await picker;
      if (response && response.length > 0) {
        const selectedProducts = response.map((product) => product.handle);
        setProductGift(selectedProducts);
      }
    } catch (error) {
      console.error("Error selecting target product:", error);
    }
  }


  const onluSubChanged = useCallback(
    (newValue) => setSub(newValue),
    [],
  );

  const formData = new FormData();
  formData.append("Title", Title);
  formData.append("functionId", functionId);
  formData.append("productHandles", productsSelected.join(','));
  formData.append("qtyTargets", qtyTargets); // Append qtyTargets to formData
  formData.append("gift", productGift.join(','));
  formData.append("onlySub", onlySub);
  formData.append("giftQuantity", giftQuantity);
  formData.append("discountType", discountType);
  if (discountType === 'threshold') {
    formData.append("thresholdAmount", thresholdAmount);
  }

  const submit = useSubmit(formData);

  const generateProduct = () => submit(formData, { replace: true, method: "POST" });

  return (
    <Page title="Create GWP discount V5" breadcrumbs={[{ content: "GWP Discount" }]}>
      <ui-title-bar title="Create GWP discount"></ui-title-bar>
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <form onSubmit={submit}>
                <TextField label="Title" value={Title} onChange={(value) => setTitleValue(value)} />
                <br/>

                {/* Dropdown for selecting "Products" or "Threshold" */}
                <Select
                  label="Discount Type"
                  options={[
                    { label: 'Products', value: 'products' },
                    { label: 'Threshold', value: 'threshold' }
                  ]}
                  onChange={(value) => setDiscountType(value)}
                  value={discountType}
                />
                <br/>

                {/* Conditionally display fields based on discount type */}
                {discountType === 'products' ? (
                  <>
                    <Button onClick={openPickerTargetProducts}>Select Target Products</Button>
                    <br/>
                    {/* Display selected target products */}
                    <Box>
                      {productsSelected.length > 0 && (
                        <ul>
                          {productsSelected.map((product) => (
                            <li key={product}>{product}</li>
                          ))}
                        </ul>
                      )}
                    </Box>
                    {/* Add qtyTargets field */}
                    <TextField
                      label="Quantity of Target Products"
                      type="number"
                      value={qtyTargets}
                      onChange={(value) => setQtyTargets(value)}
                      min={1}
                      max={100}
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Threshold Amount"
                      type="number"
                      value={thresholdAmount}
                      onChange={(value) => setThresholdAmount(value)}
                      min={1}
                      max={1000}
                    />
                  </>
                )}

                <br/>
                <Checkbox
                  label="Only Subscription Product"
                  checked={onlySub}
                  onChange={onluSubChanged}
                />
                <br/>
                <Button onClick={openPickerGiftProducts}>Select Gift Product</Button>
                <Box>
                  {productGift.length > 0 && (
                    <ul>
                      {productGift.map((gift) => (
                        <li key={gift}>{gift}</li>
                      ))}
                    </ul>
                  )}
                </Box>
                <TextField
                  label="Gift Product Quantity"
                  type="number"
                  value={giftQuantity}
                  onChange={(value) => setGiftQuantity(value)}
                  min={1}
                  max={50}
                />
              </form>
            </Layout.Section>
            <Layout.Section>
                <PageActions
                  primaryAction={{
                    content: "Save",
                    onAction: generateProduct,
                    disabled: false,
                  }}
                  secondaryActions={[{ content: "Discard" }]}
                />
            </Layout.Section>
          </Layout>
        </BlockStack>
      <BlockStack>
        {isLoading && (<Text><center>Loading ...</center></Text>)}
      </BlockStack>
    </Page>
  );
}
