import connectDB from "@/app/lib/db";
import Egg from "@/app/models/Egg";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const eggs = await Egg.find({}).lean().sort({ date: -1 });
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
    });

    return NextResponse.json({ success: true, data: egg }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
