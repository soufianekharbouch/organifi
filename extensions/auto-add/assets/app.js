
async function fetchPromos() {
    try {

      const response = await fetch("https://organifi-1a031727f073.herokuapp.com/api/promos");
  
      if (!response.ok) {
        throw new Error("Error");
      }

      const promos = await response.json();

      promos.forEach((promo) => {
        alert(`Promo: ${promo.title}
  Target Product ID: ${promo.targetProductId}
  Gift Product ID: ${promo.giftProductId}`);
      });
    } catch (error) {
      console.error("ERROR :", error);
      alert("ERROR."+JSON.stringify(error));
    }
  }
  
  document.addEventListener("DOMContentLoaded", fetchPromos);
  