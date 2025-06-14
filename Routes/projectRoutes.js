const express = require("express");
const { createProjectDash, updateProject, getProjects } = require("../Controller/projectDashController");
const projectRouter = express.Router();
projectRouter.post("/create-project", createProjectDash);
projectRouter.patch("/update-project", updateProject);
projectRouter.get("/get-project", getProjects);

module.exports = { projectRouter };
