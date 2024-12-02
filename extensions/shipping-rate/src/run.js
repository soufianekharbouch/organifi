/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  var is_free_shipping=false;
  for(var line of input.cart.lines){
    if(line.merchandise.__typename == "ProductVariant" ){  
      if (line.isFree_Shipping){
        is_free_shipping=true;
          
      }
    }
  }

  if (is_free_shipping) {
    return {
      discounts: [
        {
          type: "free_shipping",
          message: "Free shipping!!",
          value: {
            percentage: 100,
          },
        },
      ],
    };
  }

  return EMPTY_DISCOUNT;
}
