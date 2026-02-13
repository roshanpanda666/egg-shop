import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema(
  {
    cratesSold: {
      type: Number,
      default: 0,
    },
    crateSalePrice: {
      type: Number,
      default: 0,
    },
    individualEggs: {
      type: Number,
      default: 0,
    },
    eggSalePrice: {
      type: Number,
      default: 0,
    },
    eggsPerCrate: {
      type: Number,
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

// Delete cached model to pick up schema changes during HMR
if (mongoose.models.Sale) {
  mongoose.deleteModel("Sale");
}

export default mongoose.model("Sale", SaleSchema);
