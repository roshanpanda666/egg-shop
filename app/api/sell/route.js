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

// Helper: get total eggs from a purchase entry
function getPurchaseEggs(p) {
  if (p.cratesGot != null && p.eggsPerCrate != null) {
    return p.cratesGot * p.eggsPerCrate;
  }
  return p.eggsGot || 0;
}

// Helper: get total eggs from a sale entry
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

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sales = await Sale.find({ userId }).lean().sort({ date: -1 });

    // Calculate current stock for this user
    const purchases = await Egg.find({ userId }).lean();
    const totalEggsPurchased = purchases.reduce(
      (sum, p) => sum + getPurchaseEggs(p), 0
    );

    const allSales = await Sale.find({ userId }).lean();
    const totalEggsSold = allSales.reduce(
      (sum, s) => sum + getSaleEggs(s), 0
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
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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

    // Calculate current stock for this user
    const purchases = await Egg.find({ userId }).lean();
    const totalEggsPurchased = purchases.reduce(
      (sum, p) => sum + getPurchaseEggs(p), 0
    );

    const allSales = await Sale.find({ userId }).lean();
    const totalEggsSold = allSales.reduce(
      (sum, s) => sum + getSaleEggs(s), 0
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
      userId,
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

export async function DELETE(request) {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Sale ID is required" }, { status: 400 });
    }

    const sale = await Sale.findOneAndDelete({ _id: id, userId });
    if (!sale) {
      return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Sale deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
