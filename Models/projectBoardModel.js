const mongoose = require("mongoose");

const ProjectBoardSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user_db",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const projectBoardModel = mongoose.model(
  "projectBoard",
  ProjectBoardSchema,
  "projectBoard"
);
module.exports = { projectBoardModel };
