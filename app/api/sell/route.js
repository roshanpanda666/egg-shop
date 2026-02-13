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

// Helper: get total eggs from a sale entry (handles old + new schema + individual eggs)
function getSaleEggs(s) {
  let total = 0;
  if (s.cratesSold != null && s.eggsPerCrate != null) {
    total += s.cratesSold * s.eggsPerCrate;
  } else if (s.eggsSold != null) {
    total += s.eggsSold;
  }
  total += s.individualEggs || 0;
  return total;
}

// Helper: get total revenue from a sale
function getSaleRevenue(s) {
  let total = 0;
  if (s.crateSalePrice != null && s.cratesSold != null) {
    total += s.crateSalePrice * s.cratesSold;
  } else if (s.salePrice != null && s.eggsSold != null) {
    total += s.salePrice * s.eggsSold;
  }
  total += (s.individualEggs || 0) * (s.eggSalePrice || 0);
  return total;
}

export async function GET() {
  try {
    await connectDB();
    const sales = await Sale.find({}).lean().sort({ date: -1 });

    // Calculate current stock in total eggs
    const purchases = await Egg.find({}).lean();
    const totalEggsPurchased = purchases.reduce(
      (sum, p) => sum + getPurchaseEggs(p),
      0
    );

    const allSales = await Sale.find({}).lean();
    const totalEggsSold = allSales.reduce(
      (sum, s) => sum + getSaleEggs(s),
      0
    );

    const currentStockEggs = totalEggsPurchased - totalEggsSold;

    return NextResponse.json({
      success: true,
      data: sales,
      currentStockEggs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { cratesSold, crateSalePrice, individualEggs, eggSalePrice, eggsPerCrate, date } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date is required" },
        { status: 400 }
      );
    }

    const numCrates = Number(cratesSold) || 0;
    const numIndividual = Number(individualEggs) || 0;
    const numEPC = Number(eggsPerCrate) || 30;
    const numCratePrice = Number(crateSalePrice) || 0;
    const numEggPrice = Number(eggSalePrice) || 0;

    if (numCrates === 0 && numIndividual === 0) {
      return NextResponse.json(
        { success: false, error: "Enter crates or individual eggs to sell" },
        { status: 400 }
      );
    }

    // Validate that prices are provided for what's being sold
    if (numCrates > 0 && numCratePrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Crate sale price is required when selling crates" },
        { status: 400 }
      );
    }

    if (numIndividual > 0 && numEggPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Egg sale price is required when selling individual eggs" },
        { status: 400 }
      );
    }

    // Calculate current stock in total eggs
    const purchases = await Egg.find({}).lean();
    const totalEggsPurchased = purchases.reduce(
      (sum, p) => sum + getPurchaseEggs(p),
      0
    );

    const allSales = await Sale.find({}).lean();
    const totalEggsSold = allSales.reduce(
      (sum, s) => sum + getSaleEggs(s),
      0
    );

    const currentStockEggs = totalEggsPurchased - totalEggsSold;
    const totalEggsToSell = numCrates * numEPC + numIndividual;

    if (totalEggsToSell > currentStockEggs) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient stock. Only ${currentStockEggs} eggs available, trying to sell ${totalEggsToSell}.`,
        },
        { status: 400 }
      );
    }

    const sale = await Sale.create({
      cratesSold: numCrates,
      crateSalePrice: numCratePrice,
      individualEggs: numIndividual,
      eggSalePrice: numEggPrice,
      eggsPerCrate: numEPC,
      date: new Date(date),
    });

    return NextResponse.json(
      {
        success: true,
        data: sale,
        currentStockEggs: currentStockEggs - totalEggsToSell,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
