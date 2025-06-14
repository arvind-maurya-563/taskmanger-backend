const mongoose = require("mongoose");

const { projectBoardModel } = require("../Models/projectBoardModel");
const { TaskModel } = require("../Models/taskModel");
module.exports = {
  async createProjectDash(req, res) {
    try {
      const { projectName } = req.body;
      const createdBy = new mongoose.Types.ObjectId(req.user.id);
      let existingProject = await projectBoardModel.findOne({
        projectName,
        createdBy,
      });
      if (existingProject) {
        return res.status(203).send({
          status: false,
          message: "Project already exists with this name.",
        });
      }
      await projectBoardModel.create({
        projectName: projectName || `${firstname}'s Project`,
        createdBy: createdBy,
        assignedTo: [],
      });
      return res.send({
        status: true,
        message: "Project created successfully.",
      });
    } catch (error) {
      console.error("createUser error:", error);
      return res.status(500).send({
        status: false,
        message: "Something went wrong during user creation.",
        error,
      });
    }
  },
  async updateProject(req, res) {
    try {
      const updatedBy = new mongoose.Types.ObjectId(req.user.id);
      const project = await projectBoardModel.findByIdAndUpdate(
        req.body._id,
        { ...req.body, updatedBy, updatedAt: new Date() },
        { new: true }
      );
      await TaskModel.updateMany(
        { projectId: req.body._id },
        { $set: { projectName: project?.projectName } }
      );
      if (project) {
        return res.send({
          status: true,
          message: "Project updated successfully.",
        });
      }
      return res.send({ status: false, message: "Project not found." });
    } catch (error) {
      console.log(error);
      res
        .status(203)
        .send({ status: false, message: "Somthing went wrong", error });
    }
  },
  async getProjects(req, res) {
    try {
      const parent = req?.user?.createdBy
        ? new mongoose.Types.ObjectId(req.user.createdBy)
        : null;
      const createdBy = new mongoose.Types.ObjectId(req.user.id);
      const data = await projectBoardModel.find({
        $or: [{ createdBy: createdBy }, { createdBy: parent }],
      });
      return res.send({
        status: true,
        data,
      });
    } catch (error) {
      console.log("error", error);
      res.status(203).send({
        status: false,
        message: "somthing went wrong",
      });
    }
  },
};
