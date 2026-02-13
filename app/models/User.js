import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    eggsPerCrate: {
      type: Number,
      default: 30,
    },
  },
  { timestamps: true }
);

if (mongoose.models.User) {
  mongoose.deleteModel("User");
}

export default mongoose.model("User", UserSchema);
