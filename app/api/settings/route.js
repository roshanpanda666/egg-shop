import connectDB from "@/app/lib/db";
import User from "@/app/models/User";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

async function getAuthOptions() {
  const mod = await import("@/app/api/auth/[...nextauth]/route");
  return mod.authOptions || {};
}

export async function GET() {
  try {
    const session = await getServerSession(await getAuthOptions());
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("eggsPerCrate");

    return NextResponse.json({
      success: true,
      data: { eggsPerCrate: user?.eggsPerCrate || 30 },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(await getAuthOptions());
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { eggsPerCrate } = body;

    if (!eggsPerCrate || eggsPerCrate < 1) {
      return NextResponse.json(
        { success: false, error: "Eggs per crate must be at least 1" },
        { status: 400 }
      );
    }

    await User.findByIdAndUpdate(session.user.id, { eggsPerCrate: Number(eggsPerCrate) });

    return NextResponse.json({ success: true, data: { eggsPerCrate: Number(eggsPerCrate) } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
