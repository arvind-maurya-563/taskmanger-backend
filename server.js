const express = require("express");
const cors = require("cors");
const path = require("path");
const fileUpload = require('express-fileupload');
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "64mb" }));
app.use(express.urlencoded({ limit: "64mb", extended: true }));
app.use("/api/files", express.static(path.join(__dirname, "uploads")));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));
app.get('/', async(req, res)=>{
    res.send("App is running");
})
const { connectDatabase } = require("./databaseConfig/db");
const { userRouter } = require("./Routes/userRoutes");
const { taskRouter } = require("./Routes/taskRoutes");
const authMiddleware = require("./Middlewere/jwtMiddlewere");
const { projectRouter } = require("./Routes/projectRoutes");
app.use(authMiddleware);
app.use("/api/user", userRouter);
app.use("/api/task", taskRouter);
app.use("/api/project", projectRouter);
const port = process.env.PORT || 4200;
connectDatabase(); 
module.exports = app; 

