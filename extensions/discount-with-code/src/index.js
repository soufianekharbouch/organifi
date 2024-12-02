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
export async function run(input) {
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  let targets1 = [];
  let price = 0.0;

  for (var line of input.cart.lines) {
    if (line.merchandise.__typename == "ProductVariant") {
      if (line.merchandise.product.handle == configuration.product) {
        price = Number(line.cost.totalAmount.amount);
        targets1.push({
          productVariant: {
            id: line.merchandise.id,
          },
        });
        console.log("new customer use a discount");
      }
    }
  }

  if (!targets1.length) {
    console.error("No cart lines qualify for volume discount.");
    return EMPTY_DISCOUNT;
  }

  return {
    discounts: [
      {
        targets: targets1,
        message: "Test Discount",
        value: {
          fixedAmount: {
            amount: price,
            appliesToEachItem: true,
          },
        },
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}
