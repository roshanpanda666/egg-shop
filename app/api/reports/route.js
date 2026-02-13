import connectDB from "@/app/lib/db";
import Egg from "@/app/models/Egg";
import Sale from "@/app/models/Sale";
import { NextResponse } from "next/server";

// Helper: get total eggs from a purchase entry (handles old + new schema)
function getPurchaseEggs(p) {
  if (p.cratesGot != null && p.eggsPerCrate != null) {
    return p.cratesGot * p.eggsPerCrate;
  }
  return p.eggsGot || 0;
}

function getPurchaseCost(p) {
  if (p.cratePrice != null && p.cratesGot != null) {
    return p.cratePrice * p.cratesGot;
  }
  return (p.eggPrice || 0) * (p.eggsGot || 0);
}

// Helper: get total eggs from a sale entry (handles old + new schema + individual eggs)
function getSaleEggs(s) {
  let total = 0;
  // Crate eggs
  if (s.cratesSold != null && s.eggsPerCrate != null) {
    total += s.cratesSold * s.eggsPerCrate;
  } else if (s.eggsSold != null) {
    // Old schema fallback (assuming eggsSold meant total eggs from crates in old version, 
    // or just eggs. Context suggests cratesSold replaced eggsSold logic, but let's be safe)
    total += s.eggsSold;
  }
  
  // Individual eggs
  if (s.individualEggs != null) {
    total += s.individualEggs;
  }
  
  return total;
}

function getSaleRevenue(s) {
  let total = 0;
  // Crate revenue
  if (s.crateSalePrice != null && s.cratesSold != null) {
    total += s.crateSalePrice * s.cratesSold;
  } else if (s.salePrice != null && s.eggsSold != null) {
    // Old schema fallback
    total += s.salePrice * s.eggsSold;
  }
  
  // Individual egg revenue
  if (s.individualEggs != null && s.eggSalePrice != null) {
    total += s.individualEggs * s.eggSalePrice;
  }
  
  return total;
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const date = searchParams.get("date");
    const month = searchParams.get("month");

    let startDate, endDate;

    if (type === "daily" && date) {
      startDate = new Date(date);
      endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
    } else if (type === "monthly" && month) {
      const [year, mon] = month.split("-").map(Number);
      startDate = new Date(year, mon - 1, 1);
      endDate = new Date(year, mon, 1);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid report type. Use type=daily&date=YYYY-MM-DD or type=monthly&month=YYYY-MM" },
        { status: 400 }
      );
    }

    const dateFilter = { date: { $gte: startDate, $lt: endDate } };

    const purchases = await Egg.find(dateFilter).lean().sort({ date: -1 });
    const sales = await Sale.find(dateFilter).lean().sort({ date: -1 });

    // Crate-level aggregates (only full crates)
    const totalCratesPurchased = purchases.reduce((sum, p) => sum + (p.cratesGot || 0), 0);
    const totalEggsPurchased = purchases.reduce((sum, p) => sum + getPurchaseEggs(p), 0);
    const totalPurchaseCost = purchases.reduce((sum, p) => sum + getPurchaseCost(p), 0);

    const totalCratesSold = sales.reduce((sum, s) => sum + (s.cratesSold || 0), 0);
    const totalEggsSold = sales.reduce((sum, s) => sum + getSaleEggs(s), 0);
    const totalSalesRevenue = sales.reduce((sum, s) => sum + getSaleRevenue(s), 0);

    const profit = totalSalesRevenue - totalPurchaseCost;

    // Per-egg calculations
    const avgPurchasePricePerEgg = totalEggsPurchased > 0 ? totalPurchaseCost / totalEggsPurchased : 0;
    const avgSalePricePerEgg = totalEggsSold > 0 ? totalSalesRevenue / totalEggsSold : 0;

    // Current overall stock
    const allPurchases = await Egg.find({}).lean();
    const allSales = await Sale.find({}).lean();
    const allEggsPurchased = allPurchases.reduce((sum, p) => sum + getPurchaseEggs(p), 0);
    const allEggsSold = allSales.reduce((sum, s) => sum + getSaleEggs(s), 0);
    const currentStockEggs = allEggsPurchased - allEggsSold;

    return NextResponse.json({
      success: true,
      data: {
        type,
        period: type === "daily" ? date : month,
        totalCratesPurchased,
        totalEggsPurchased,
        totalPurchaseCost,
        avgPurchasePricePerEgg,
        totalCratesSold,
        totalEggsSold,
        totalSalesRevenue,
        avgSalePricePerEgg,
        profit,
        currentStockEggs,
        purchases,
        sales,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
