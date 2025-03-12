import { useState, useEffect, useCallback } from 'react';
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { Text, Page, Layout, BlockStack, TextField, PageActions, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useParams } from 'react-router-dom';

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
  const tags = JSON.parse(formData.get("tags"));

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
    }
    `,
    {
      variables: {
        automaticAppDiscount: {
          combinesWith: {
            orderDiscounts: true,
            productDiscounts: true,
            shippingDiscounts: true,
          },
          functionId: functionId,
          metafields: [
            {
              key: "function-configuration",
              namespace: "$app:qpb",
              type: "json",
              value: JSON.stringify({
                tags,
                selectedTags:tags.map(tag => tag.tag)
              }),
            },
          ],
          startsAt: "2023-11-11",
          title: Title,
        },
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
  const actionData = useActionData();
  const resp = actionData;
  const isLoading = actionData?.resp?.isLoading || false;

  useEffect(() => {
    if (resp) {
      const errors = resp?.resp?.data?.discountAutomaticAppCreate?.userErrors;
      if (errors?.length > 0) {
        const error = errors[0];
        console.error(`Error: ${error.field} ${error.message}`);
        shopify.toast.show(`Error: ${error.field} ${error.message}`, {
          isError: true,
        });
      } else {
        shopify.toast.show("Discount Created!");
      }
    }
  }, [resp]);

  const [Title, setTitleValue] = useState('Title QPB Discount');
  const [tags, setTags] = useState([
    { tag: '', quantity: 0, regularPercent: 0, subscriptionPercent: 0 }
  ]);

  const handleAddTag = () => {
    setTags([...tags, { tag: '', quantity: 0, regularPercent: 0, subscriptionPercent: 0 }]);
  };

  const handleTagChange = (index, field, value) => {
    const newTags = [...tags];
    newTags[index][field] = value;
    setTags(newTags);
  };

  const handleRemoveTag = (index) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
  };

  const formData = new FormData();
  formData.append("Title", Title);
  formData.append("functionId", functionId);
  formData.append("tags", JSON.stringify(tags));

  const submit = useSubmit(formData);

  const handleSave = () => submit(formData, { replace: true, method: "POST" });

  return (
    <Page title="Create QPB Discount">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <form>
              <TextField label="Title" value={Title} onChange={(value) => setTitleValue(value)} />
              <table>
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Quantity</th>
                    <th>Regular Percent</th>
                    <th>Subscription Percent</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag, index) => (
                    <tr key={index}>
                      <td>
                        <TextField
                          value={tag.tag}
                          onChange={(value) => handleTagChange(index, 'tag', value)}
                        />
                      </td>
                      <td>
                        <TextField
                          type="number"
                          value={tag.quantity}
                          onChange={(value) => handleTagChange(index, 'quantity', value)}
                        />
                      </td>
                      <td>
                        <TextField
                          type="number"
                          value={tag.regularPercent}
                          onChange={(value) => handleTagChange(index, 'regularPercent', value)}
                        />
                      </td>
                      <td>
                        <TextField
                          type="number"
                          value={tag.subscriptionPercent}
                          onChange={(value) => handleTagChange(index, 'subscriptionPercent', value)}
                        />
                      </td>
                      <td>
                        <Button onClick={() => handleRemoveTag(index)}>Remove</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button onClick={handleAddTag}>Add Tag</Button>
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