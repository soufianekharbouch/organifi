import {
  Text,
  Page,
  Layout,
  BlockStack,
  TextField,
  PageActions,
  Button,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useParams } from "react-router-dom";
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

  // Récupérer les metafields
  const metafields = currentDiscount.data.automaticDiscountNode.metafields.nodes;
  const configMetafield = metafields.find((field) => field.key === "function-configuration");
  const tags = configMetafield ? JSON.parse(configMetafield.value).tags : [];

  return json({
    currentDiscount: currentDiscount,
    discountsURL: currentDiscount.data.shop.primaryDomain.url + "/admin/discounts",
    tags: tags,
  });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const Title = formData.get("Title");
  const functionId = formData.get("functionId");
  const id = formData.get("id");
  const tags = JSON.parse(formData.get("tags"));

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
        id: "gid://shopify/DiscountAutomaticNode/" + id,
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
            ownerId: "gid://shopify/DiscountAutomaticNode/" + id,
            key: "function-configuration",
            namespace: "$app:qpb",
            type: "json",
            value: JSON.stringify({
              tags,
              selectedTags: tags.map(tag => tag.tag),
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
  const { functionId, id } = useParams();
  const actionData = useActionData();
  const resp = actionData;
  const { currentDiscount, tags } = useLoaderData();

  const [Title, setTitleValue] = useState(currentDiscount?.data.automaticDiscountNode.automaticDiscount.title || "");
  const [tagsState, setTagsState] = useState(tags);

  useEffect(() => {
    if (resp) {
      const errors = resp?.resp?.data?.discountAutomaticAppUpdate?.userErrors;
      if (errors?.length > 0) {
        const error = errors[0];
        console.error(`Error: ${error.field[1]} ${error.message}`);
        shopify.toast.show(`Error: ${error.field[1]} ${error.message}`, {
          isError: true,
        });
      } else {
        shopify.toast.show("Discount Updated!");
      }
    }
  }, [resp]);

  const handleAddTag = () => {
    setTagsState([...tagsState, { tag: "", quantity: 0, regularPercent: 0, subscriptionPercent: 0 }]);
  };

  const handleTagChange = (index, field, value) => {
    const newTags = [...tagsState];
    newTags[index][field] = value;
    setTagsState(newTags);
  };

  const handleRemoveTag = (index) => {
    const newTags = tagsState.filter((_, i) => i !== index);
    setTagsState(newTags);
  };

  const formData = new FormData();
  formData.append("Title", Title);
  formData.append("functionId", functionId);
  formData.append("id", id);
  formData.append("tags", JSON.stringify(tagsState));

  const submit = useSubmit(formData);

  const handleSave = () => submit(formData, { replace: true, method: "POST" });

  return (
    <Page title="Update QPB Discount">
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
                  {tagsState.map((tag, index) => (
                    <tr key={index}>
                      <td>
                        <TextField
                          value={tag.tag}
                          onChange={(value) => handleTagChange(index, "tag", value)}
                        />
                      </td>
                      <td>
                        <TextField
                          type="number"
                          value={tag.quantity}
                          onChange={(value) => handleTagChange(index, "quantity", value)}
                        />
                      </td>
                      <td>
                        <TextField
                          type="number"
                          value={tag.regularPercent}
                          onChange={(value) => handleTagChange(index, "regularPercent", value)}
                        />
                      </td>
                      <td>
                        <TextField
                          type="number"
                          value={tag.subscriptionPercent}
                          onChange={(value) => handleTagChange(index, "subscriptionPercent", value)}
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
                disabled: false,
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
    </Page>
  );
}