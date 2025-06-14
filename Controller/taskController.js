const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const {
  TaskModel,
  TaskLogsModel,
  TaskCommentsModel,
} = require("../Models/taskModel");
const {
  taskUpdateCreateTemplate,
  getUserNameByEmail,
  getUserNamesByEmails,
} = require("../Helper/genericHelper");
const { sendEmail } = require("../Helper/otpHelper");
const { user_model } = require("../Models/userModel");
const sendNewTaskEmail = async (createrEmail, taskObj, assignTo) => {
  try {
    const [assignUsers, creatorInfo] = await Promise.all([
      getUserNamesByEmails(assignTo),
      getUserNameByEmail(createrEmail),
    ]);

    const emailPromises = assignUsers.map((user) => {
      const taskEmailTemplate = taskUpdateCreateTemplate(
        {
          ...taskObj,
          statusName: taskObj.status,
          priority:
            taskObj?.priority === 1
              ? "Low"
              : taskObj?.priority === 2
              ? "Medium"
              : "High",
        },
        {},
        false,
        creatorInfo.name,
        creatorInfo.name,
        user.name,
        taskObj.projectName
      );

      return sendEmail(user.email, taskEmailTemplate, "New Task Assigned");
    });
    await Promise.all(emailPromises);
  } catch (error) {
    console.error("Error sending new task email:", error);
  }
};

const sendUpdateTaskEmail = async (
  creatorEmail,
  taskObj,
  currentTask,
  assignTo
) => {
  try {
    const [assignUsers, creatorInfo] = await Promise.all([
      getUserNamesByEmails(assignTo),
      getUserNameByEmail(creatorEmail),
    ]);

    const emailPromises = assignUsers.map((user) => {
      const taskEmailTemplate = taskUpdateCreateTemplate(
        {
          ...taskObj,
          statusName: taskObj?.status,
          priority:
            taskObj?.priority === 1
              ? "Low"
              : taskObj?.priority === 2
              ? "Medium"
              : "High",
        },
        {
          ...currentTask,
          statusName: currentTask.status,
          priority:
            currentTask?.priority === 1
              ? "Low"
              : currentTask?.priority === 2
              ? "Medium"
              : "High",
        },
        true,
        creatorInfo.name,
        creatorInfo.name,
        user.name,
        taskObj.projectName
      );

      return sendEmail(
        user.email,
        taskEmailTemplate,
        "Task Update Notification"
      );
    });

    await Promise.all(emailPromises);
  } catch (error) {
    console.error("Error sending task update email:", error);
  }
};

module.exports = {
  async getTask(req, res) {
    try {
      let { search, startDate, endDate, projectId, username } = req.query;
      const createdBy = new mongoose.Types.ObjectId(req.user.id);
      const userQueryPipe = [
        {
          $match: {
            isDeleted: false,
            $or: [{ _id: createdBy }, { createdBy: createdBy }],
          },
        },
        {
          $project: {
            email: 1,
          },
        },
      ];
      const userData = await user_model.aggregate(userQueryPipe);
      const allusersemail = userData?.map((el) => el.email) || [];
      const searchQuery = search
        ? {
            $or: [
              { title: { $regex: search, $options: "i" } },
              { description: { $regex: search, $options: "i" } },
            ],
          }
        : {};
      const mainMatchQuery = {
        $match: {
          isDeleted: false,
          ...(projectId ? { projectId } : {}),
          ...(username
            ? { assignTo: username }
            : {
                $or: [
                  { assignTo: { $in: allusersemail } },
                  { createdBy: createdBy },
                ],
              }),
        },
      };
      if (startDate || endDate) {
        mainMatchQuery.$match.dueDate = {};
        if (startDate) {
          startDate = new Date(startDate);
          mainMatchQuery.$match.dueDate.$gte = startDate;
        }
        if (endDate) {
          endDate = new Date(endDate);
          endDate.setHours(23, 59, 59, 9999);
          mainMatchQuery.$match.dueDate.$lte = endDate;
        }
      }
      const queryPipe = [
        mainMatchQuery,
        {
          $lookup: {
            from: "user_db",
            let: { emails: "$assignTo" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$email", "$$emails"],
                  },
                },
              },
              {
                $addFields: {
                  value: "$email",
                  label: {
                    $concat: ["$firstname", " ", "$lastname"],
                  },
                },
              },
              {
                $project: {
                  value: 1,
                  label: 1,
                },
              },
            ],
            as: "userData",
          },
        },
        {
          $addFields: {
            assignTo: "$userData",
          },
        },
        {
          $sort: { updatedAt: -1 },
        },
        {
          $project: {
            assignTo: 1,
            status: 1,
            title: 1,
            description: 1,
            projectId: 1,
            projectName: 1,
            dueDate: 1,
            progress: 1,
            priority: 1,
            UID: 1,
            filepath: 1,
          },
        },
        {
          $group: {
            _id: "$status",
            documents: { $push: "$$ROOT" },
          },
        },
      ];
      if (search) {
        queryPipe.unshift({ $match: searchQuery });
      }
      const taskData = await TaskModel.aggregate(queryPipe);
      return res.status(200).json({
        status: true,
        data: taskData,
      });
    } catch (error) {
      console.error("Error fetching tasks:", error.message);
      return res
        .status(203)
        .json({ status: false, message: "Internal Server Error" });
    }
  },
  async addTask(req, res) {
    try {
      let { attachment, filename, assignTo, projectName, projectId } = req.body;
      const updatedBy = new mongoose.Types.ObjectId(req.user.id);
      const createdBy = new mongoose.Types.ObjectId(req.user.id);
      const task = await TaskModel.create({
        ...req.body,
        projectId: projectId,
        projectName,
        createdBy,
        updatedBy,
      });

      // Handle file attachment
      if (attachment && filename && task) {
        const filesFolder = path.join(
          __dirname,
          "..",
          "uploads",
          "TaskAttachments",
          task._id.toString()
        );

        if (!fs.existsSync(filesFolder)) {
          fs.mkdirSync(filesFolder, { recursive: true });
        }

        const filePath = path.join(filesFolder, filename);
        const base64File = attachment.replace(/^data:.*;base64,/, "");
        fs.writeFileSync(filePath, base64File, { encoding: "base64" });

        task.filepath = `${task._id.toString()}/${filename}`;
        await task.save();
      }

      const taskObj = task.toObject();
      sendNewTaskEmail(req.user.email, taskObj, assignTo);

      return res.status(200).json({
        status: true,
        message: "Task added successfully",
      });
    } catch (error) {
      console.error("Error adding Task:", error.message);
      return res
        .status(500)
        .json({ status: false, message: "Internal Server Error" });
    }
  },
  async updateTask(req, res) {
    const { attachment, filename, assignTo, _id } = req.body;
    try {
      const updatedBy = new mongoose.Types.ObjectId(req.user.id);
      const currentTask = await TaskModel.findById(_id).lean();
      const task = await TaskModel.findByIdAndUpdate(
        _id,
        {
          ...req.body,
          updatedBy,
          updatedAt: new Date(),
        },
        { new: true }
      );
      delete currentTask._id;
      await TaskLogsModel.create({
        ...currentTask,
        updatedBy,
        updatedAt: new Date(),
      });

      // Handle file attachment
      if (attachment && filename && task) {
        const filesFolder = path.join(
          __dirname,
          "..",
          "uploads",
          "TaskAttachments",
          task._id.toString()
        );

        if (!fs.existsSync(filesFolder)) {
          fs.mkdirSync(filesFolder, { recursive: true });
        }

        const filePath = path.join(filesFolder, filename);
        const base64File = attachment.replace(/^data:.*;base64,/, "");
        fs.writeFileSync(filePath, base64File, { encoding: "base64" });

        task.filepath = `${task._id.toString()}/${filename}`;
        await task.save();
      }

      const taskObj = task.toObject();
      sendUpdateTaskEmail(req.user.email, taskObj, currentTask, assignTo);

      return res.status(200).json({
        status: true,
        message: "Task updated successfully",
      });
    } catch (error) {
      console.error("Error updating task:", error.message);
      return res
        .status(500)
        .json({ status: false, message: "Internal Server Error" });
    }
  },
  async deleteTask(req, res) {
    try {
      const deletedBy = new mongoose.Types.ObjectId(req.user.id);
      await TaskModel.findByIdAndUpdate(req.query.id, {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      });
      return res.status(200).json({
        status: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error updating role:", error.message);
      return res
        .status(203)
        .json({ status: false, message: "Internal Server Error" });
    }
  },
  async createComment(req, res) {
    const { files } = req.body;
    try {
      const createdBy = new mongoose.Types.ObjectId(req.user.id);
      const comment = await TaskCommentsModel.create({
        ...req.body,
        createdBy,
      });
      if (files && comment) {
        const filesFolder = path.join(
          __dirname,
          "..",
          "uploads",
          "CommentAttachments",
          comment._id.toString()
        );
        if (!fs.existsSync(filesFolder)) {
          fs.mkdirSync(filesFolder, { recursive: true });
        }
        let filePaths = comment.filepath || [];
        for (let i = 0; i < files.length; i++) {
          const { attachment, filename } = files[i];
          let fileExtension = filename.split(".");
          fileExtension = fileExtension[fileExtension.length - 1];
          const filePath = path.join(filesFolder, filename);
          const base64File = attachment.replace(/^data:.*;base64,/, "");
          fs.writeFileSync(filePath, base64File, { encoding: "base64" });
          filePaths.push(`${comment._id.toString()}/${filename}`);
        }
        comment.filepath = filePaths;
        await comment.save();
      }

      return res.status(200).json({
        status: true,
        message: "Comment added successfully",
      });
    } catch (error) {
      console.error("Error adding comments:", error.message);
      return res
        .status(203)
        .json({ status: false, message: "Internal Server Error" });
    }
  },
  async updateComment(req, res) {
    const { files } = req.body;
    try {
      const updatedBy = new mongoose.Types.ObjectId(req.user.id);
      const comment = await TaskCommentsModel.findByIdAndUpdate(
        req.body._id,
        {
          ...req.body,
          updatedBy,
          updatedAt: new Date(),
        },
        { new: true }
      );
      if (files && comment) {
        const filesFolder = path.join(
          __dirname,
          "..",
          "uploads",
          "CommentAttachments",
          comment._id.toString()
        );
        if (!fs.existsSync(filesFolder)) {
          fs.mkdirSync(filesFolder, { recursive: true });
        }
        let filePaths = comment.filepath || [];
        for (let i = 0; i < files.length; i++) {
          const { attachment, filename } = files[i];
          let fileExtension = filename.split(".");
          fileExtension = fileExtension[fileExtension.length - 1];
          const filePath = path.join(filesFolder, filename);
          const base64File = attachment.replace(/^data:.*;base64,/, "");
          fs.writeFileSync(filePath, base64File, { encoding: "base64" });
          filePaths.push(`${comment._id.toString()}/${filename}`);
        }
        comment.filepath = filePaths;
        await comment.save();
      }
      return res.status(200).json({
        status: true,
        message: "Comment updated successfully",
      });
    } catch (error) {
      console.error("Error updating comments:", error.message);
      return res
        .status(203)
        .json({ status: false, message: "Internal Server Error" });
    }
  },
  async getComments(req, res) {
    try {
      const { UID } = req.query;
      const aggrgateQuery = [
        {
          $match: { UID: +UID, IsDeleted: false },
        },
        {
          $lookup: {
            from: "user_db",
            let: { createdBy: { $ifNull: ["$createdBy", ""] } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$createdBy"],
                  },
                },
              },
              {
                $addFields: {
                  name: {
                    $concat: ["$firstname", " ", "$lastname"],
                  },
                },
              },
              {
                $project: {
                  name: 1,
                  username: 1,
                },
              },
              {
                $project: {
                  _id: 0,
                },
              },
              {
                $limit: 1,
              },
            ],
            as: "userData",
          },
        },
        {
          $addFields: {
            name: { $arrayElemAt: ["$userData.name", 0] },
          },
        },
        {
          $project: {
            name: 1,
            UID: 1,
            message: 1,
            createdAt: 1,
            updatedAt: 1,
            filepath: 1,
          },
        },
        {
          $sort: { _id: -1 },
        },
      ];
      const data = await TaskCommentsModel.aggregate(aggrgateQuery);
      return res.status(200).json({
        status: true,
        data,
      });
    } catch (error) {
      console.error("Error getting comments:", error.message);
      return res
        .status(203)
        .json({ status: false, message: "Internal Server Error" });
    }
  },
  async deleteComment(req, res) {
    try {
      const deletedBy = new mongoose.Types.ObjectId(req.user.id);
      await TaskCommentsModel.findByIdAndUpdate(req.query.id, {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      });
      return res.status(200).json({
        status: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error.message);
      return res
        .status(203)
        .json({ status: false, message: "Internal Server Error" });
    }
  },
};
