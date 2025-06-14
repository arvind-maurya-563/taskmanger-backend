const express = require("express");
const {
  addTask,
  updateTask,
  getTask,
  deleteTask,
  createComment,
  updateComment,
  getComments,
  deleteComment
} = require("../Controller/taskController");
const taskRouter = express.Router();
taskRouter.post("/create-task", addTask);
taskRouter.post("/update-task", updateTask);
taskRouter.get("/get-task", getTask);
taskRouter.post("/delete-task", deleteTask);
taskRouter.post("/delete-comment", deleteComment);
taskRouter.post("/add-comment", createComment);
taskRouter.post("/update-comment", updateComment);
taskRouter.get("/get-comments", getComments);
module.exports = { taskRouter };
