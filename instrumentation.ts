export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { detecterRetardsJournaux } = await import("@/lib/alertes");

    // Tous les jours à 6h00 du matin
    cron.schedule("0 6 * * *", async () => {
      console.log("[Cron] Lancement de la vérification des retards de journaux...");
      await detecterRetardsJournaux();
    });

    console.log("[Cron] Tâche d'alerte des journaux de bord planifiée (tous les jours à 6h).");
  }
}