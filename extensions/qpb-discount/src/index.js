// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").Input} RunInput
 * @typedef {import("../generated/api").FunctionResult} FunctionResult
 */

/**
 * @type {FunctionResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 */
export function run(input) {
  // Retrieve configuration from metafields
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );

  // Debug: Log the configuration
  console.log("Configuration:", JSON.stringify(configuration, null, 2));

  // Ensure the tags array exists
  if (!configuration.tags || !Array.isArray(configuration.tags)) {
    console.error("Tags array is missing or invalid in configuration.");
    return EMPTY_DISCOUNT;
  }

  // Extract tags and selectedTags from the configuration
  const { tags, selectedTags } = configuration;

  // Initialize targets and discounts
  const targets = [];
  const discounts = [];

  // Loop through cart lines
  for (const line of input.cart.lines) {
    if (line.merchandise.__typename === "ProductVariant") {
      // Check if the product has any of the specified tags
      const productTags = line.merchandise.product.hasAnyTag
        ? selectedTags
        : [];

      // Find the matching tag configuration
      const matchingTag = tags.find((tagConfig) =>
        productTags.includes(tagConfig.tag)
      );

      if (matchingTag) {
        // Check if the quantity meets the threshold
        if (line.quantity >= matchingTag.quantity) {
          // Determine the discount percentage based on subscription status
          const isSubscription = line.sellingPlanAllocation !== null;
          const discountPercent = isSubscription
            ? matchingTag.subscriptionPercent
            : matchingTag.regularPercent;

          // Calculate the discount amount
          const discountAmount =
            (line.cost.amountPerQuantity.amount * discountPercent) / 100;

          // Add the target and discount
          targets.push({
            productVariant: {
              id: line.merchandise.id,
            },
          });

          discounts.push({
            targets,
            value: {
              percentage: {
                value: discountPercent.toString(),
              },
            },
            message: `Discount applied for ${matchingTag.tag}`,
          });
        }
      }
    }
  }
 
  // If no discounts are applicable, return an empty result
  if (!targets.length) {
    console.error("No cart lines qualify for the discount.");
    return EMPTY_DISCOUNT;
  }

  // Return applicable discounts
  return {
    discounts,
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}