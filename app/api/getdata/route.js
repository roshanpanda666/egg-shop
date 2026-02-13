import { connectdb } from "@/app/lib/db";
import mongoose from "mongoose";
import { NextResponse } from "next/server";


export async function GET(){
    await mongoose.connect(connectdb)
    return NextResponse.json({Result:true})
}