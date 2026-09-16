export async function register() {
  // Ne se lance que côté serveur Node.js (pas en edge runtime, pas côté navigateur)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { detecterRetardsJournaux } = await import("@/lib/alertes");
    const { detecterFinsDeStage } = await import("@/lib/fin-stage");

    // Tous les jours à 6h00 du matin
    cron.schedule("0 6 * * *", async () => {
      console.log("[Cron] Lancement de la vérification quotidienne...");
      await detecterRetardsJournaux();
      await detecterFinsDeStage();
    });

    console.log("[Cron] Tâches planifiées : alertes journaux + fins de stage (tous les jours à 6h).");
  }
}