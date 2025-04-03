const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["parent", "child", "therapist"],
    required: true,
    lowercase: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () {
      return this.role === "child";
    },
  },
  isVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", UserSchema);
