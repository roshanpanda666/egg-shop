import mongoose from "mongoose";

const EggSchema = new mongoose.Schema(
  {
    // Box-level purchase fields
    boxesGot: {
      type: Number,
      default: 0,
    },
    boxPrice: {
      type: Number,
      default: 0,
    },
    cratesPerBox: {
      type: Number,
      default: 7,
    },
    // Crate-level purchase fields
    cratePrice: {
      type: Number,
      default: 0,
    },
    cratesGot: {
      type: Number,
      default: 0,
    },
    eggsPerCrate: {
      type: Number,
      required: [true, "Eggs per crate is required"],
      default: 30,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

if (mongoose.models.Egg) {
  mongoose.deleteModel("Egg");
}

export default mongoose.model("Egg", EggSchema);
