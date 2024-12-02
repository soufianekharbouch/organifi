// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const errors = [];

  
  input.cart.lines.forEach((line) => {
    const productHandle = line.merchandise?.product?.handle;

    if (productHandle === "shilajit-gummies" && line.quantity > 6) {
      errors.push({
        localizedMessage: "To buy 4 or more, please call 1-760-487-8587.",
        target: "cart",
      });
    }
    if (productHandle === "happy-drops" && line.quantity > 6) {
      errors.push({
        localizedMessage: "To buy 4 or more, please call 1-760-487-8587.",
        target: "cart",
      });
    }

    if (line.quantity > 12) {
      errors.push({
        localizedMessage: "Supplies are limited to 12 units per household",
        target: "cart",
      });
    }
  });

  return {
    errors
  };
}
