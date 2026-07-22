import cron from "node-cron";
import Product from "../models/Product";

cron.schedule("5 0 * * *", async () => {
  try {
    const now = new Date();

    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const result = await Product.updateMany(
      {
        refresh_date: {
          $lte: threeMonthsAgo
        },
        isDeleted: false
      },
      {
        $set: {
          refresh_date: now
        }
      }
    );

    console.log(`[Product Refresh Cron] Updated ${result.modifiedCount} products.`);
  } catch (err) {
    console.error("[Product Refresh Cron]", err);
  }
});