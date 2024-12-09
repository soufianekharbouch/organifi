import {
  Text,
  Page,
  Layout,
  BlockStack,
  TextField,
  PageActions,
  Select,
} from "@shopify/polaris";

import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useActionData, useLoaderData, useSubmit} from "@remix-run/react";
import { useParams } from "react-router-dom";
import { useState, useEffect,useCallback } from "react";


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
            metafields(first:100){
                nodes{
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
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: process.env.SHOPIFY_APP_URL || "",
    currentDiscount: currentDiscount,
    discountsURL:currentDiscount.data.shop.primaryDomain.url+"/admin/discounts"
  });
};


export const action = async ({ request }) => {

  const formData = await request.formData();
  const Title = formData.get("Title");
  const functionId=formData.get("functionId");
  let id=formData.get("id");
  id="gid://shopify/DiscountAutomaticNode/"+id
  const Amount =  formData.get("Amount");
  const discountTypeValue =  formData.get("DiscountTypeValue");
  const Percent = formData.get("Percent");
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
    mutation discountAutomaticAppUpdate2($automaticAppDiscount: DiscountAutomaticAppInput!, $id: ID!,$metafields: [MetafieldsSetInput!]!) 
  
    {
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
        id:id,
        automaticAppDiscount: {
          combinesWith: {
            orderDiscounts: true,
            productDiscounts: true,
            shippingDiscounts: true
          },
          functionId: functionId,
          title: Title
        },
        metafields: {
          ownerId:id,
          key: "function-configuration",
          namespace: "$app:utm",
          type: "json",
          value: JSON.stringify({
            amount: Amount,
            discounttype: discountTypeValue,
            percent: Percent,
          })
        }
      },
    }
  );
  
  const responseJson = await response.json();
 
  
  return json({
    resp:responseJson,
  });
};

export default function Index() {
  const { functionId,id } = useParams(); 
  const actionData = useActionData(); 
  const resp = actionData
  const { currentDiscount} = useLoaderData();

  const [Title, setTitleValue] = useState('');
  const [DiscountTypeV, setDiscountTypeV] = useState('amount');
  const [DiscountType, setDiscountType] = useState('amount');
  const [Percent, setPercent] = useState('50');
  const [Amount, setAmount] = useState('64.26');

  useEffect(() => { 
    if (currentDiscount) {
      setTitleValue(currentDiscount.data.automaticDiscountNode.automaticDiscount.title);
      setAmountHandle(JSON.parse(currentDiscount.data.automaticDiscountNode.metafields.nodes[0].value).amount);
      SetDiscountTypeHandle(JSON.parse(currentDiscount.data.automaticDiscountNode.metafields.nodes[0].value).discounttype)
      setPercentHandle(JSON.parse(currentDiscount.data.automaticDiscountNode.metafields.nodes[0].value).percent)
    }
  }, []);
  


  useEffect(() => { 
    if (resp) {
      if(resp.resp.data.discountAutomaticAppUpdate.userErrors.length > 0){
        let error=resp.resp.data.discountAutomaticAppUpdate.userErrors[0]
        shopify.toast.show("Error: "+error.field[1]+" "+error.message, {
          autoClose: 2000,
          hideProgressBar: true, 
         isError:true,
        });
      }else{
      shopify.toast.show("Discount Updated!");
      }

    }


  }, [resp,currentDiscount]);

  const setTitle = useCallback(
    (newValue) => setTitleValue(newValue),
    [],
  );
  const setAmountHandle = useCallback(
    (newValue) => setAmount(newValue),
    [],
  );
const SetDiscountTypeHandle = useCallback(
    (newValue) => {
      setDiscountTypeV(newValue);
      setDiscountType(newValue);
    },
    [],
);
const setPercentHandle = useCallback(
    (newValue) => {
        if(Number(newValue)>100){
          setPercent("100")
        }else{
          setPercent(newValue)   
        }
        
    },
    [],
  );


  const formData = new FormData();
  formData.append("Title", Title);
  formData.append("functionId", functionId);
  formData.append("id", id);
  formData.append("Amount", Amount);
  formData.append("Percent", Percent);
  formData.append("DiscountTypeValue", DiscountTypeV);
  const generateProduct = () => submit(formData, { replace: true, method: "POST"});
  const submit = useSubmit(formData);
  const options = [
    {label: 'Amount Off', value: 'amount'},
    {label: 'Percent', value: 'percent'},
  ];
  return (
    <Page
    title="Update UTM discount."
    breadcrumbs={[
        {
            content: "UTM Discount.",
            
        },
    ]}
    >
      <ui-title-bar title="Update UTM discount">
      </ui-title-bar>
        <BlockStack gap="500">
          <Layout>
          <Layout.Section>
                      <form onSubmit={submit}>
                          <TextField
                              label="Title"
                              value={Title}
                              onChange={setTitle}
                                                
                          />
                      
                      <Select
                                label="Discount type"
                                options={options}
                                value={DiscountTypeV}
                                onChange={SetDiscountTypeHandle}
                            />

                        {DiscountType=="amount"?(<TextField
                            label="Amount"
                            type="number"
                            value={Amount}
                            onChange={setAmountHandle}                 
                        />) : (<TextField
                            label="Percent"
                            type="number"
                            value={Percent}
                            InputProps={{ inputProps: { min: 0, max: 100 } }}
                            onChange={setPercentHandle}                 
                        />)}
              
                      </form>
                  </Layout.Section> 
                  <Layout.Section>
                      <PageActions
                              primaryAction={{
                                  content: "Save ",
                                  onAction: generateProduct,
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
