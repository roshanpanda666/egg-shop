import mongoose from "mongoose";

const EggSchema = new mongoose.Schema(
  {
    cratePrice: {
      type: Number,
      required: [true, "Crate price is required"],
    },
    cratesGot: {
      type: Number,
      required: [true, "Number of crates is required"],
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
