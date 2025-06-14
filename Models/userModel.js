const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  role: {
    type: String,
    default: "admin"
  },
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  orgName: {
    type: String,
  },
  isDeleted: { type: Boolean, default: false },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user_db",
    default: null
  },
  createdAt: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user_db",
    default: null
  }
});

UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

const user_model = mongoose.model("user_db", UserSchema, "user_db");
module.exports = {user_model};
