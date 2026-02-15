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
    boxesSold: {
      type: Number,
      default: 0,
    },
    boxSalePrice: {
      type: Number,
      default: 0,
    },
    cratesPerBox: {
      type: Number,
      default: 7,
    },
    eggsPerCrate: {
      type: Number,
      default: 30,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "gpay", "phonepe", "upi_other"],
      default: "cash",
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
