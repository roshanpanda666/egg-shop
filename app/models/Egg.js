import mongoose from "mongoose";

const EggSchema = new mongoose.Schema(
  {
    eggPrice: {
      type: Number,
      required: [true, "Egg price is required"],
    },
    eggsGot: {
      type: Number,
      required: [true, "Eggs received count is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
  },
  { timestamps: true }
);

const Egg = mongoose.models.Egg || mongoose.model("Egg", EggSchema);

export default Egg;
