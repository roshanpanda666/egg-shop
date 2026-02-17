import connectDB from "@/app/lib/db";
import Egg from "@/app/models/Egg";
import Sale from "@/app/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

function getPurchaseEggs(p) {
  let total = 0;
  if (p.boxesGot != null && p.cratesPerBox != null && p.eggsPerCrate != null) {
    total += p.boxesGot * p.cratesPerBox * p.eggsPerCrate;
  }
  if (p.cratesGot != null && p.eggsPerCrate != null) {
    total += p.cratesGot * p.eggsPerCrate;
  }
  return total || p.eggsGot || 0;
}

function getPurchaseCost(p) {
  let total = 0;
  if (p.boxesGot != null && p.boxPrice != null) {
    total += p.boxesGot * p.boxPrice;
  }
  if (p.cratePrice != null && p.cratesGot != null) {
    total += p.cratePrice * p.cratesGot;
  }
  return total || (p.eggPrice || 0) * (p.eggsGot || 0);
}

function getSaleEggs(s) {
  let total = 0;
  // Box eggs
  if (s.boxesSold != null && s.cratesPerBox != null && s.eggsPerCrate != null) {
    total += s.boxesSold * s.cratesPerBox * s.eggsPerCrate;
  }
  // Crate eggs
  if (s.cratesSold != null && s.eggsPerCrate != null) {
    total += s.cratesSold * s.eggsPerCrate;
  } else if (s.eggsSold != null) {
    total += s.eggsSold;
  }
  // Loose eggs
  if (s.individualEggs != null) {
    total += s.individualEggs;
  }
  return total;
}

function getSaleRevenue(s) {
  let total = 0;
  // Box revenue
  if (s.boxesSold != null && s.boxSalePrice != null) {
    total += s.boxesSold * s.boxSalePrice;
  }
  // Crate revenue
  if (s.crateSalePrice != null && s.cratesSold != null) {
    total += s.crateSalePrice * s.cratesSold;
  } else if (s.salePrice != null && s.eggsSold != null) {
    total += s.salePrice * s.eggsSold;
  }
  // Loose egg revenue
  if (s.individualEggs != null && s.eggSalePrice != null) {
    total += s.individualEggs * s.eggSalePrice;
  }
  return total;
}

export async function GET(request) {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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
        { success: false, error: "Invalid report type" },
        { status: 400 }
      );
    }

    const dateFilter = { date: { $gte: startDate, $lt: endDate }, userId };

    const purchases = await Egg.find(dateFilter).lean().sort({ date: -1 });
    const sales = await Sale.find(dateFilter).lean().sort({ date: -1 });

    const totalBoxesPurchased = purchases.reduce((sum, p) => sum + (p.boxesGot || 0), 0);
    const totalCratesPurchased = purchases.reduce((sum, p) => sum + (p.cratesGot || 0), 0);
    const totalEggsPurchased = purchases.reduce((sum, p) => sum + getPurchaseEggs(p), 0);
    const totalPurchaseCost = purchases.reduce((sum, p) => sum + getPurchaseCost(p), 0);

    const totalBoxesSold = sales.reduce((sum, s) => sum + (s.boxesSold || 0), 0);
    const totalCratesSold = sales.reduce((sum, s) => sum + (s.cratesSold || 0), 0);
    const totalEggsSold = sales.reduce((sum, s) => sum + getSaleEggs(s), 0);
    const totalSalesRevenue = sales.reduce((sum, s) => sum + getSaleRevenue(s), 0);

    // Calculate Lifetime Average Cost Per Egg (CPE) context
    // We need ALL historical purchases to get a true "Cost Basis"
    const allPurchasesForCost = await Egg.find({ userId }).lean();
    const globalTotalEggsPurchased = allPurchasesForCost.reduce((sum, p) => sum + getPurchaseEggs(p), 0);
    const globalTotalPurchaseCost = allPurchasesForCost.reduce((sum, p) => sum + getPurchaseCost(p), 0);
    
    // Weighted Average Cost Per Egg (Global)
    // If no purchases ever made, default to 0 to avoid Infinity
    const globalCPE = globalTotalEggsPurchased > 0 ? globalTotalPurchaseCost / globalTotalEggsPurchased : 0;

    // --- Detailed Profit Calculation for Selected Period ---
    let totalBoxProfit = 0;
    let totalCrateProfit = 0;
    let totalLooseProfit = 0;

    // We iterate over the SALES of the selected period
    sales.forEach((s) => {
      // 1. Box Sales
      if (s.boxesSold > 0) {
        const boxes = s.boxesSold;
        const salePrice = s.boxSalePrice || 0;
        // Cost = User's avg cost per egg * eggs in that box
        const eggsInBox = (s.cratesPerBox || 7) * (s.eggsPerCrate || 30); 
        const costBasis = eggsInBox * globalCPE;
        const profitPerBox = salePrice - costBasis;
        totalBoxProfit += profitPerBox * boxes;
      }

      // 2. Crate Sales
      if (s.cratesSold > 0) {
        const crates = s.cratesSold;
        const salePrice = s.crateSalePrice || 0;
        const eggsInCrate = s.eggsPerCrate || 30;
        const costBasis = eggsInCrate * globalCPE;
        const profitPerCrate = salePrice - costBasis;
        totalCrateProfit += profitPerCrate * crates;
      }

      // 3. Loose Egg Sales
      if (s.individualEggs > 0) {
        const looseSales = s.individualEggs;
        const salePrice = s.eggSalePrice || 0;
        // Cost Basis per egg is just globalCPE
        const profitPerEgg = salePrice - globalCPE;
        totalLooseProfit += profitPerEgg * looseSales;
      }
    });

    // Total Profit from all sources
    const totalProfitDetailed = totalBoxProfit + totalCrateProfit + totalLooseProfit;

    // Calculate averages for response
    const avgPurchasePricePerEgg = totalEggsPurchased > 0 ? totalPurchaseCost / totalEggsPurchased : 0;
    const avgSalePricePerEgg = totalEggsSold > 0 ? totalSalesRevenue / totalEggsSold : 0;

    // Note: The previous logic calculated profit as (Revenue - PeriodPurchaseCost).
    // This is "Cash Flow" profit, often used in simple cash accounting.
    // The NEW logic is (Revenue - CostOfGoodsSold), which is "Accrual" profit.
    // We will return the NEW detailed profit as the primary 'profit' metric, 
    // but we can keep the old one as 'cashFlow' if needed, or just replace it.
    // Let's replace 'profit' with the more accurate CoGS-based profit.

    const allPurchases = await Egg.find({ userId }).lean();
    const allSales = await Sale.find({ userId }).lean();
    const allEggsPurchased = allPurchases.reduce((sum, p) => sum + getPurchaseEggs(p), 0);
    const allEggsSold = allSales.reduce((sum, s) => sum + getSaleEggs(s), 0);
    const currentStockEggs = allEggsPurchased - allEggsSold;

    return NextResponse.json({
      success: true,
      data: {
        type,
        period: type === "daily" ? date : month,
        totalBoxesPurchased,
        totalCratesPurchased,
        totalEggsPurchased,
        totalPurchaseCost,
        avgPurchasePricePerEgg,
        totalBoxesSold,
        totalCratesSold,
        totalEggsSold,
        totalSalesRevenue,
        avgSalePricePerEgg,
        profit: totalProfitDetailed, // Updated to use CoGS logic
        profitBreakdown: {
            box: totalBoxProfit,
            crate: totalCrateProfit,
            loose: totalLooseProfit
        },
        globalCPE, // sending this might be useful for debugging/UI
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
