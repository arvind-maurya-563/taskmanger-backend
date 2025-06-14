const express = require('express');
const { createUser, loginUser, verifyUser, getUsers, changePassword, forgotPassword, forgotUserName, updateUser, getAllUsers, deleteUser, logoutUser, verifyToken } = require('../Controller/userController');
const userRouter = express.Router();
userRouter.post('/create-user', createUser);
userRouter.post('/update-user', updateUser);
userRouter.post('/delete-user', deleteUser);
userRouter.post('/login', loginUser);
userRouter.post('/verify',verifyUser);
userRouter.get('/token',verifyToken);
userRouter.get('/getusers',getUsers);
userRouter.post('/change-password',changePassword);
userRouter.post('/forgot-password',forgotPassword);
module.exports = {userRouter};