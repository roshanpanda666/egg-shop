import connectDB from "@/app/lib/db";
import Egg from "@/app/models/Egg";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const eggs = await Egg.find({ userId }).lean().sort({ date: -1 });
    return NextResponse.json({ success: true, data: eggs });
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
      boxesGot, boxPrice, cratesPerBox,
      cratePrice, cratesGot, eggsPerCrate, date
    } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date is required" },
        { status: 400 }
      );
    }

    const numBoxes = Number(boxesGot) || 0;
    const numBoxPrice = Number(boxPrice) || 0;
    const numCPB = Number(cratesPerBox) || 7;
    const numCratePrice = Number(cratePrice) || 0;
    const numCratesGot = Number(cratesGot) || 0;
    const numEPC = Number(eggsPerCrate) || 30;

    if (numBoxes === 0 && numCratesGot === 0) {
      return NextResponse.json(
        { success: false, error: "Enter boxes or crates purchased" },
        { status: 400 }
      );
    }

    if (numBoxes > 0 && numBoxPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Box price is required when purchasing boxes" },
        { status: 400 }
      );
    }

    if (numCratesGot > 0 && numCratePrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Crate price is required when purchasing crates" },
        { status: 400 }
      );
    }

    const egg = await Egg.create({
      boxesGot: numBoxes,
      boxPrice: numBoxPrice,
      cratesPerBox: numCPB,
      cratePrice: numCratePrice,
      cratesGot: numCratesGot,
      eggsPerCrate: numEPC,
      date: new Date(date),
      userId,
    });

    return NextResponse.json({ success: true, data: egg }, { status: 201 });
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
      return NextResponse.json({ success: false, error: "Entry ID is required" }, { status: 400 });
    }

    const entry = await Egg.findOneAndDelete({ _id: id, userId });
    if (!entry) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Entry deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
