const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const TaskSchema = new mongoose.Schema(
  {
    UID: { type: Number,unique: true },
    projectId: { type: String },
    projectName: { type: String },
    title: { type: String },
    filepath: { type: String },
    description: { type: String },
    assignTo: { type: Array },
    status: { type: String },
    dueDate: { type: Date },
    progress: { type: Number },
    priority: { type: Number },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "user_db" },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "user_db" },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "user_db" }
  },
  {
    timestamps: true
  }
);
const TaskLogsSchema = new mongoose.Schema({
  UID: { type: Number },
  title: { type: String },
  projectId: { type: Schema.Types.ObjectId, ref: "user_db" },
  description: { type: String },
  assignTo: { type: Array },
  status: { type: String },
  dueDate: { type: String },
  progress: { type: Number },
  priority: { type: Number },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: "user_db" }
});
const TaskCommentSchema = new mongoose.Schema({
  UID: { type: Number },
  message: { type: String },
  filepath:{type:Array},
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "user_db" },
  updatedAt: { type: Date},
  updatedBy: { type: Schema.Types.ObjectId, ref: "user_db" },
  IsDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: Schema.Types.ObjectId, ref: "user_db" }
})
TaskSchema.pre("validate", async function (next) {
  try {
    if (!this.UID) {
      const latestRecordUid = await mongoose
        .model("task_db")
        .findOne({}, { UID: 1 })
        .sort({ UID: -1 });
      this.UID = latestRecordUid ? latestRecordUid.UID + 1 : 1;
    }
    next();
  } catch (error) {
    return next(new Error("Error generating incremented count."));
  }
});
const TaskModel = mongoose.model("task_db", TaskSchema, "task_db");
const TaskLogsModel = mongoose.model("task_logs_db", TaskLogsSchema, "task_logs_db");
const TaskCommentsModel = mongoose.model("task_comment", TaskCommentSchema, "task_comment");
module.exports = {
  TaskModel,
  TaskLogsModel,
  TaskCommentsModel
};
