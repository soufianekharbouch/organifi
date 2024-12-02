// Fonction pour récupérer les promos depuis l'API
async function fetchPromos() {
    try {
      // URL mise à jour pour l'API
      const response = await fetch("https://ir-clothing-so-respond.trycloudflare.com/api/promos");
  
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des promos.");
      }
  
      // Convertir la réponse en JSON
      const promos = await response.json();
  
      // Parcourir les promos et afficher les IDs dans des alertes
      promos.forEach((promo) => {
        alert(`Promo: ${promo.title}
  Target Product ID: ${promo.targetProductId}
  Gift Product ID: ${promo.giftProductId}`);
      });
    } catch (error) {
      console.error("Erreur :", error);
      alert("Une erreur est survenue lors de la récupération des promos.");
    }
  }
  
  // Appeler fetchPromos lorsque la page est chargée
  document.addEventListener("DOMContentLoaded", fetchPromos);
  