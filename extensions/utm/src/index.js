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
  discounts: []
};
/**
 * @param {RunInput} input
 */
export function run(input) {

  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  console.log(JSON.stringify(configuration))
  let targets1=[];
  let price=0.00;
  let cart_empty=0;
  for(var line of input.cart.lines){
    if(line.merchandise.__typename == "ProductVariant" ){
      if (!line.isUtm){
        cart_empty=cart_empty+1;
      }
    }
  }
 for(var line of input.cart.lines){
  if(line.merchandise.__typename == "ProductVariant" ){
    var is_utm=false;
    if (line.isUtm){
        is_utm=true
        if (configuration.discounttype=="amount") {
          price=Number(configuration.amount);         
        }else{
          price=Number(line.cost.amountPerQuantity.amount*Number(configuration.percent)/100);
        }
        
    }
    if(is_utm && cart_empty>0){
    targets1.push({
      productVariant: {
        id: line.merchandise.id
      }
    })
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
        targets:targets1,
        message:"is_utm",
        value: {
          fixedAmount: {
              amount:price,
              appliesToEachItem:false
          }
        }
      }
    
     
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First
  };

};