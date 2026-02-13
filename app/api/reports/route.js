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

function getSaleEggs(s) {
  let total = 0;
  if (s.cratesSold != null && s.eggsPerCrate != null) {
    total += s.cratesSold * s.eggsPerCrate;
  } else if (s.eggsSold != null) {
    total += s.eggsSold;
  }
  if (s.individualEggs != null) {
    total += s.individualEggs;
  }
  return total;
}

function getSaleRevenue(s) {
  let total = 0;
  if (s.crateSalePrice != null && s.cratesSold != null) {
    total += s.crateSalePrice * s.cratesSold;
  } else if (s.salePrice != null && s.eggsSold != null) {
    total += s.salePrice * s.eggsSold;
  }
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

    const totalCratesPurchased = purchases.reduce((sum, p) => sum + (p.cratesGot || 0), 0);
    const totalEggsPurchased = purchases.reduce((sum, p) => sum + getPurchaseEggs(p), 0);
    const totalPurchaseCost = purchases.reduce((sum, p) => sum + getPurchaseCost(p), 0);

    const totalCratesSold = sales.reduce((sum, s) => sum + (s.cratesSold || 0), 0);
    const totalEggsSold = sales.reduce((sum, s) => sum + getSaleEggs(s), 0);
    const totalSalesRevenue = sales.reduce((sum, s) => sum + getSaleRevenue(s), 0);

    const profit = totalSalesRevenue - totalPurchaseCost;
    const avgPurchasePricePerEgg = totalEggsPurchased > 0 ? totalPurchaseCost / totalEggsPurchased : 0;
    const avgSalePricePerEgg = totalEggsSold > 0 ? totalSalesRevenue / totalEggsSold : 0;

    // Overall stock for this user
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
