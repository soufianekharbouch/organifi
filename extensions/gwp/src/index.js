// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").Input} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 */
export function run(input) {
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  console.log("config: " + JSON.stringify(configuration));
  // Use an array for product handles in the configuration
  var productHandles =String(configuration.product) || ''; // Ensure it's always an array
  const giftProductHandle = configuration.gift; // The handle of the gift product
  const giftQuantity = Number(configuration.giftQuantity) || 1; // Number of free gifts to provide
  const targetsQuantity = Number(configuration.qtyTargets) || 1; // Number of free gifts to provide
  const thresholdAmount = Number(configuration.thresholdAmount) || null; // Threshold amount if applicable
  let isProductEligible = false;
  let giftFound = false;
  let targets = [];
  let totalCartAmount = Number(input.cart.cost.subtotalAmount.amount); // Total cart amount
  for (let line of input.cart.lines) {
    if (line.merchandise.__typename === "ProductVariant") {
      if (line.merchandise.product.handle === giftProductHandle) {
        totalCartAmount=Number(totalCartAmount-line.cost.totalAmount.amount)
      }
    }
  }
  console.log(input);
  console.log("Only Subscription: " + configuration.is_sub);
  console.log("Threshold Amount: " + thresholdAmount);

  // Check if the discount type is "Threshold"
  const isThresholdDiscount = configuration.discountType === "threshold";

  // Determine if the cart meets the threshold amount, if applicable
  if (isThresholdDiscount && totalCartAmount >= thresholdAmount) {
    console.log("Cart meets threshold amount.");
    isProductEligible = true;
  }
  var productHandlesArray=productHandles.split(",");
  // Check if any of the selected product handles exist in the cart
  if (!isThresholdDiscount) {
    var qty=0;
    for (let line of input.cart.lines) {
      if (line.merchandise.__typename === "ProductVariant") {
        productHandlesArray.forEach(targetHandle => {
          console.log(targetHandle);
          if(line.merchandise.product.handle === targetHandle){
            qty=Number(qty+line.quantity);
          }

        });
      }
    } 

    console.log(qty+"   "+targetsQuantity);
    if (qty>=targetsQuantity) {
      if (configuration.is_sub === "true") {
        for (let line of input.cart.lines) {
          if (line.merchandise.__typename === "ProductVariant") {
                  if (line.sellingPlanAllocation != null) {
                    console.log("Subscription product found");
                    isProductEligible = true;
                  }
          }
        }
      }else{
        isProductEligible = true;
      }
   }
}

  // If the product is eligible (either due to product match or threshold), check for the gift product
  var amount=0;
  if (isProductEligible) {
    for (let line of input.cart.lines) {
      if (line.merchandise.__typename === "ProductVariant") {
        // Check if the gift product is already in the cart
        if (line.merchandise.product.handle === giftProductHandle) {
            targets.push({
              productVariant: {
                id: line.merchandise.id,
              },
            });
            console.log(Number(line.cost.amountPerQuantity.amount*giftQuantity))
            amount=Number(line.cost.amountPerQuantity.amount*giftQuantity)
            giftFound=true;
        }
      }
    }
  }

  // If no eligible gift product is found, return an empty discount
  if (!giftFound) {
    console.error("No eligible gift found in the cart.");
    return EMPTY_DISCOUNT;
  }
  // If the gift is found, apply the free gift discount (100% off)
  return {
    discounts: [
      {
        targets: targets,
        message: `Free Gift with Purchase (${giftQuantity} gift${giftQuantity > 1 ? 's' : ''})`,
        value: {
          fixedAmount: {
            amount: amount, 
            appliesToEachItem: false,
          },
        },
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.Maximum,
  };

}
