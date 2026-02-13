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
    const { cratePrice, cratesGot, eggsPerCrate, date } = body;

    if (!cratePrice || !cratesGot || !eggsPerCrate || !date) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const egg = await Egg.create({
      cratePrice: Number(cratePrice),
      cratesGot: Number(cratesGot),
      eggsPerCrate: Number(eggsPerCrate),
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
