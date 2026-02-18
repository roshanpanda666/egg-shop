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

// Helper: get total eggs from a purchase entry (includes boxes + crates)
function getPurchaseEggs(p) {
  let total = 0;
  // Box eggs
  if (p.boxesGot != null && p.cratesPerBox != null && p.eggsPerCrate != null) {
    total += p.boxesGot * p.cratesPerBox * p.eggsPerCrate;
  }
  // Crate eggs
  if (p.cratesGot != null && p.eggsPerCrate != null) {
    total += p.cratesGot * p.eggsPerCrate;
  }
  return total || p.eggsGot || 0;
}

// Helper: get total eggs from a sale entry (includes boxes + crates + loose)
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
  total += s.individualEggs || 0;
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
    const dateParam = searchParams.get("date"); // YYYY-MM-DD

    // 1. Get total count for serial numbers
    const totalSalesCount = await Sale.countDocuments({ userId });

    // 2. Build query filter
    let query = { userId };
    if (dateParam) {
      const startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateParam);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // 3. Fetch sales sorted by creation time (newest first)
    const sales = await Sale.find(query).lean().sort({ createdAt: -1 });

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
      totalSalesCount, // Send total count to frontend
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
    const {
      cratesSold, crateSalePrice,
      individualEggs, eggSalePrice,
      boxesSold, boxSalePrice, cratesPerBox,
      eggsPerCrate, date, paymentMethod
    } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date is required" },
        { status: 400 }
      );
    }

    const numCrates = Number(cratesSold) || 0;
    const numIndividual = Number(individualEggs) || 0;
    const numBoxes = Number(boxesSold) || 0;
    const numEPC = Number(eggsPerCrate) || 30;
    const numCPB = Number(cratesPerBox) || 7;
    const numCratePrice = Number(crateSalePrice) || 0;
    const numEggPrice = Number(eggSalePrice) || 0;
    const numBoxPrice = Number(boxSalePrice) || 0;
    const payment = ["cash", "gpay", "phonepe", "upi_other"].includes(paymentMethod)
      ? paymentMethod
      : "cash";

    if (numCrates === 0 && numIndividual === 0 && numBoxes === 0) {
      return NextResponse.json(
        { success: false, error: "Enter boxes, crates, or individual eggs to sell" },
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

    if (numBoxes > 0 && numBoxPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Box sale price is required when selling boxes" },
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
    const boxEggs = numBoxes * numCPB * numEPC;
    const crateEggs = numCrates * numEPC;
    const totalEggsToSell = boxEggs + crateEggs + numIndividual;

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
      boxesSold: numBoxes,
      boxSalePrice: numBoxPrice,
      cratesPerBox: numCPB,
      eggsPerCrate: numEPC,
      paymentMethod: payment,
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
