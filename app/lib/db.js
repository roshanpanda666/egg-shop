import mongoose from "mongoose";

const MONGODB_URI = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@eggshop0.xhexnj1.mongodb.net/eggdb?appName=eggshop0`;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;