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
    const user = await User.findById(session.user.id).select("eggsPerCrate cratesPerBox");

    return NextResponse.json({
      success: true,
      data: {
        eggsPerCrate: user?.eggsPerCrate || 30,
        cratesPerBox: user?.cratesPerBox || 7,
      },
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
    const { eggsPerCrate, cratesPerBox } = body;

    const update = {};

    if (eggsPerCrate !== undefined) {
      if (eggsPerCrate < 1) {
        return NextResponse.json(
          { success: false, error: "Eggs per crate must be at least 1" },
          { status: 400 }
        );
      }
      update.eggsPerCrate = Number(eggsPerCrate);
    }

    if (cratesPerBox !== undefined) {
      if (cratesPerBox < 1) {
        return NextResponse.json(
          { success: false, error: "Crates per box must be at least 1" },
          { status: 400 }
        );
      }
      update.cratesPerBox = Number(cratesPerBox);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid settings provided" },
        { status: 400 }
      );
    }

    await User.findByIdAndUpdate(session.user.id, update);

    const user = await User.findById(session.user.id).select("eggsPerCrate cratesPerBox");

    return NextResponse.json({
      success: true,
      data: {
        eggsPerCrate: user?.eggsPerCrate || 30,
        cratesPerBox: user?.cratesPerBox || 7,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
