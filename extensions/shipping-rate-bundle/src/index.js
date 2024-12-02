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
    console.log(JSON.stringify(input));
    const configuration = JSON.parse(
      input?.discountNode?.metafield?.value ?? "{}"
    );
    let count=Number(configuration.itemsCount)
    var qty=0;
    var selectedDeleveryHandle=input.cart.deliveryGroups[0].selectedDeliveryOption.handle
    var collection_exist=false;
    for(var line of input.cart.lines){
        var mul=line.merchandise.product.metafield?Number(line.merchandise.product.metafield.value):1
        qty=Number(qty+(line.quantity*mul));
        if (line.merchandise.product.inCollections.some(collection => collection.isMember)) {
          collection_exist = true;
        }
    }
    if(qty>=count && collection_exist)
      return {
        discounts: [
          {
            message: "Free shipping by items count2",
            value: {
              percentage: {
                value:"100"
              }
            },
            targets: [
                {
                  deliveryOption: {
                    handle: selectedDeleveryHandle
                  }
                },
              ],
          },
        ],
        discountApplicationStrategy: DiscountApplicationStrategy.First,
      };
    
  
    return EMPTY_DISCOUNT;
  }
  