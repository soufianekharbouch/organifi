import { useState, useEffect, useCallback } from 'react';
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { Text, Page, Layout, BlockStack, TextField, PageActions, Select } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import {  useParams } from 'react-router-dom';
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    #graphql
    query discountAutomaticApp {
      shop {
        name
        primaryDomain {
          url
          host
        }
      }
    }
  `);

  const currentDiscount = await response.json();

  return json({
    discountsURL: currentDiscount.data.shop.primaryDomain.url + "/admin/discounts"
  });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const Title = formData.get("Title");
  const functionId = formData.get("functionId");
  const Amount = formData.get("Amount");
  const discountTypeValue = formData.get("DiscountTypeValue");
  const Percent = formData.get("Percent");

  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    #graphql
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
    }
  `, {
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
            namespace: "$app:utm",
            type: "json",
            value: JSON.stringify({
              amount: Amount,
              discounttype: discountTypeValue,
              percent: Percent,
            })
          }
        ],
        startsAt: "2023-11-11",
        title: Title
      }
    },
  });

  const responseJson = await response.json();

  return json({
    resp: responseJson,
  });
};

export default function Index() {
 const { functionId } = useParams();
  const actionData = useActionData();
  const resp = actionData;
  const isLoading = actionData?.resp?.isLoading || false;

  useEffect(() => {
    if (resp) {
      const errors = resp?.resp?.data?.discountAutomaticAppCreate?.userErrors;
      if (errors?.length > 0) {
        const error = errors[0];
        console.error(`Error: ${error.field[1]} ${error.message}`);
      } else {
        shopify.toast.show("Discount Created!");
      }
    }
  }, [resp]);

  const [Title, setTitleValue] = useState('Title UTM');
  const [DiscountTypeValue, setDiscountTypeValue] = useState('amount');
  const [Percent, setPercent] = useState('50');
  const [Amount, setAmount] = useState('64.26');

  const handleDiscountTypeChange = useCallback((newValue) => {
    setDiscountTypeValue(newValue);
    if (newValue === 'amount') {
      setAmount('64.26');
    } else {
      setPercent('50');
    }
  }, []);

  const handlePercentChange = useCallback((newValue) => {
    setPercent(Math.min(Math.max(Number(newValue), 0), 100).toString());
  }, []);

  const handleAmountChange = useCallback((newValue) => {
    setAmount(newValue);
  }, []);

  const formData = new FormData();
  formData.append("Title", Title);
  formData.append("functionId", functionId);
  formData.append("Amount", Amount);
  formData.append("Percent", Percent);
  formData.append("DiscountTypeValue", DiscountTypeValue);

  const submit = useSubmit(formData);

  const handleSave = () => submit(formData, { replace: true, method: "POST" });

  return (
    <Page title="Create UTM Discount">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <form>
              <TextField label="Title" value={Title} onChange={(value) => setTitleValue(value)} />
              <Select
                label="Discount Type"
                options={[
                  { label: 'Amount Off', value: 'amount' },
                  { label: 'Percent', value: 'percent' },
                ]}
                value={DiscountTypeValue}
                onChange={handleDiscountTypeChange}
              />
              {DiscountTypeValue === "amount" ? (
                <TextField
                  label="Amount"
                  type="number"
                  value={Amount}
                  onChange={handleAmountChange}
                />
              ) : (
                <TextField
                  label="Percent"
                  type="number"
                  value={Percent}
                  onChange={handlePercentChange}
                  min={0}
                  max={100}
                />
              )}
            </form>
          </Layout.Section>
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: "Save",
                onAction: handleSave,
                disabled: isLoading,
              }}
              secondaryActions={[
                {
                  content: "Discard",
                },
              ]}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
      {isLoading && <Text><center>Loading...</center></Text>}
    </Page>
  );
}
