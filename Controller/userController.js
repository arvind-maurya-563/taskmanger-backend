const { user_model } = require("../Models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const {
  genrateRandomPassword,
  generateRandomOtp,
} = require("../Helper/genericHelper");
const { sendEmail } = require("../Helper/otpHelper");
const { email_otp_model } = require("../Models/otpModel");
const { projectBoardModel } = require("../Models/projectBoardModel");
module.exports = {
  async createUser(req, res) {
    try {
      const {
        firstname,
        lastname,
        email,
        projectName,
        orgName,
        password,
        role,
      } = req.body;
      let existingUser = await user_model.findOne({ email, isDeleted: false });
      if (existingUser) {
        return res.status(203).send({
          status: false,
          message: "User already exists with this email.",
        });
      }
      const randomPassword = password || genrateRandomPassword();
      const username = email.toLowerCase().trim();
      const securePassword = randomPassword + process.env.PASS_KEY;
      const hashedPassword = await bcrypt.hash(securePassword, 10);
      const isCreatedByAdmin = req?.user?.id ? true : false;
      const createdBy = isCreatedByAdmin
        ? new mongoose.Types.ObjectId(req.user.id)
        : null;
      const user = await user_model.create({
        firstname,
        lastname,
        email: username,
        password: hashedPassword,
        username,
        createdBy,
        orgName,
        ...(role ? { role } : {}),
        isVerified: isCreatedByAdmin,
      });

      // Admin-created user: send plain email with credentials, no dashboard creation
      if (isCreatedByAdmin) {
        const mailContent = `
        Hello ${firstname},

        Your account has been created successfully.

        Login Details:
        Email (Username): ${email}
        Password: ${randomPassword}

        Please change your password after logging in.

        Regards,
        TaskManager Team
      `;
        await sendEmail(email, mailContent, "Your TaskManager Account Details");
        return res.send({
          status: true,
          message: `User created successfully! An email with login credentials has been sent to ${email}.`,
        });
      }

      const randomOtp = generateRandomOtp();
      await email_otp_model.findOneAndUpdate(
        { email },
        { $set: { otp: randomOtp } },
        { upsert: true, new: true }
      );
      // ✅ Create TaskManager (ProjectBoard renamed) entry
      await projectBoardModel.create({
        projectName: projectName || `${firstname}'s Project`,
        createdBy: user._id,
      });

      const otpTemplate = `
      <div style="font-family: Arial, sans-serif; font-size: 15px;">
        Hello ${firstname},<br /><br />
        Your TaskManager account has been created successfully.<br /><br />
        <strong>Your One-Time Password (OTP):</strong><br />
        <div style="font-size: 22px; font-weight: bold; margin: 10px 0; color: #2c3e50;">${randomOtp}</div>
        Please enter this OTP to verify your email.<br /><br />
        Login Email: ${email}<br />
        Password: ${randomPassword}<br /><br />
        Thank you,<br />
        TaskManager Team
      </div>
    `;
      await sendEmail(email, otpTemplate, "Verification OTP");
      return res.send({
        status: true,
        message:
          "User created successfully. Please verify your email using the OTP sent to your inbox. You can also verify during login.",
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
  async updateUser(req, res) {
    try {
      const updatedBy = new mongoose.Types.ObjectId(req.user.id);
      if (req.user.id === req.body._id) {
        return res.status(203).send({
          status: false,
          message: "You can't update your own account. Please contact admin. ",
        });
      }
      const { email } = req.body;
      let existigUser = await user_model.findOne({
        email,
        _id: { $ne: req.body._id },
        isDeleted: false,
      });
      if (existigUser) {
        return res.status(203).send({
          status: false,
          message: "User Already exists with this email.",
        });
      }
      const user = await user_model.findByIdAndUpdate(
        req.body._id,
        { ...req.body, updatedBy, updatedAt: new Date() },
        { new: true }
      );
      if (user) {
        return res.send({
          status: true,
          message: "User updated successfully.",
        });
      }
      return res.send({ status: false, message: "User not found." });
    } catch (error) {
      console.log(error);
      res
        .status(203)
        .send({ status: false, message: "Somthing went wrong", error });
    }
  },
  async deleteUser(req, res) {
    try {
      if (req.user.id === req.body._id) {
        return res.status(203).send({
          status: false,
          message: "You can't delete your own account. Please contact admin. ",
        });
      }
      const deletedBy = new mongoose.Types.ObjectId(req.user.id);
      await user_model.findByIdAndUpdate(
        req.body._id,
        { isDeleted: true, deletedBy, deletedAt: new Date() },
        { new: true }
      );
      return res.send({ status: true, message: "User deleted successfully." });
    } catch (error) {
      console.log("error: ", error);
      res
        .status(203)
        .send({ status: false, message: "Somthing went wrong", error });
    }
  },
  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const user = await user_model.findOne({ email, isDeleted: false }).lean();
      if (!user) {
        return res
          .status(203)
          .send({ status: false, message: "Invalid credentials" });
      }
      const securePasswrod = password + process.env.PASS_KEY;
      const validPassword = await bcrypt.compare(securePasswrod, user.password);
      if (!validPassword) {
        return res
          .status(203)
          .json({ status: false, message: "Invalid email or password" });
      }

      if (!user.isVerified) {
        const randomOtp = generateRandomOtp();

        await email_otp_model.findOneAndUpdate(
          { email },
          { $set: { otp: randomOtp } },
          { upsert: true, new: true }
        );

        const otpEmail = `
        <div style="font-family: Arial, sans-serif; font-size: 15px;">
          Hello ${user.firstname || "User"},<br /><br />
          Your email is not verified.<br /><br />
          <strong>OTP for verification:</strong><br />
          <div style="font-size: 22px; font-weight: bold; margin: 10px 0; color: #2c3e50;">${randomOtp}</div>
          Please enter this OTP to activate your account.<br /><br />
          Thank you,<br />
          TaskManager Team
        </div>
      `;
        await sendEmail(email, otpEmail, "Verification OTP");
        return res.status(203).json({
          status: true,
          message:
            "User not verified. OTP has been sent to your email for verification.",
          otpSent: true,
        });
      }
      delete user.password;
      const parent = user.createdBy || null;
      const projectData = await projectBoardModel.find({
        $or: [{ createdBy: user._id }, { createdBy: parent }],
      });
      const token = jwt.sign(
        {
          id: user._id,
          ...user,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
      return res.send({
        status: true,
        data: {
          ...user,
        },
        projectData: projectData,
        token,
        message: "Login successfully",
      });
    } catch (error) {
      console.error("Error in login:", error);
      return res
        .status(203)
        .send({ status: false, message: "Something went wrong" });
    }
  },
  async getUsers(req, res) {
    try {
      const { page, pagesize, search_string = "" } = req.query;
      const createdBy = new mongoose.Types.ObjectId(req.user.id);
      let users = [];
      let totalCount = 0;
      const searchQuery = {
        $or: [
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$fullname" },
                regex: search_string,
                options: "i",
              },
            },
          },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$email" },
                regex: search_string,
                options: "i",
              },
            },
          },
        ],
      };
      const queryPipe = [
        {
          $match: {
            isDeleted: false,
            $or: [{ _id: createdBy }, { createdBy: createdBy }],
          },
        },
        {
          $addFields: {
            fullname: { $concat: ["$firstname", " ", "$lastname"] },
            isOwnAccount: { $eq: ["$_id", createdBy] },
          },
        },
        ...(search_string
          ? [
              {
                $match: searchQuery,
              },
            ]
          : []),
        {
          $project: {
            password: 0,
            isDeleted: 0,
            createdAt: 0,
            createdBy: 0,
          },
        },
      ];
      if (page && pagesize) {
        const skip = (page - 1) * pagesize;
        const [userData, count] = await Promise.all([
          user_model.aggregate(queryPipe).skip(skip).limit(+pagesize),
          user_model.aggregate(queryPipe),
        ]);
        users = userData;
        totalCount = count.length;
      } else {
        users = await user_model.aggregate(queryPipe);
      }
      return res.status(200).json({
        status: true,
        data: users,
        totalCount,
      });
    } catch (error) {
      console.error("Error in getting users:", error);
      res.status(203).send({ status: false, message: "Something went wrong" });
    }
  },
  async verifyUser(req, res) {
    try {
      const { email, otp } = req.body;
      const user = await user_model.findOne({
        email,
      });
      const otpData = await email_otp_model.findOne({ email });
      if (otpData.otp == otp) {
        await email_otp_model.findByIdAndDelete(otpData._id);
        user.isVerified = true;
        await user.save();
        res.status(200).send({
          status: true,
          message: "OTP verified successfully.",
        });
      } else {
        return res.status(203).send({
          status: false,
          message: "Invalid OTP. Please try again.",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(203).send({
        status: false,
        message:
          "Something went wrong while verifying the user. Please try again later.",
      });
    }
  },
  async verifyToken(req, res) {
    try {
      const parent = req?.user?.createdBy
        ? new mongoose.Types.ObjectId(req.user.createdBy)
        : null;
      const createdBy = new mongoose.Types.ObjectId(req.user.id);
      const data = await projectBoardModel.find({
        $or: [{ createdBy: createdBy }, { createdBy: parent }],
      });
      return res
        .status(200)
        .json({ status: req?.user ? true : false, data: req.user, projectData: data });
    } catch (error) {
      console.log(error);
      return res.status(203).send({
        status: false,
        message:
          "Something went wrong while verifying the user. Please try again later.",
      });
    }
  },
  async changePassword(req, res) {
    try {
      const { id } = req.user;
      const { password, newPassword } = req.body;
      if (!password || !newPassword) {
        return res.status(203).send({
          status: false,
          message: "Both current and new passwords are required.",
        });
      }
      const user = await user_model.findById(id);
      if (!user) {
        return res.status(203).send({
          status: false,
          message: "User not found.",
        });
      }
      const securePassword = password + process.env.PASS_KEY;
      const validPassword = await bcrypt.compare(securePassword, user.password);
      if (!validPassword) {
        return res.status(203).send({
          status: false,
          message: "Current password is incorrect.",
        });
      }
      const secureNewPassword = newPassword + process.env.PASS_KEY;
      user.password = await bcrypt.hash(secureNewPassword, 10);
      await user.save();
      res.status(200).send({
        status: true,
        message: "Password changed successfully.",
      });
    } catch (error) {
      res.status(203).send({
        status: false,
        message:
          "An error occurred while changing the password. Please try again later.",
      });
    }
  },
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(203).send({
          status: false,
          message: "Invalid request. Email is required.",
        });
      }

      const user = await user_model.findOne({ email, isDeleted: false });

      if (!user) {
        return res.status(203).send({
          status: false,
          message: "No user exists with this email.",
        });
      }

      const randomPassword = genrateRandomPassword();
      const securePassword = randomPassword + process.env.PASS_KEY;
      const hashedPassword = await bcrypt.hash(securePassword, 10);

      user.password = hashedPassword;
      await user.save();

      // ✅ Professional Email Template
      const emailTemplate = `
      <div style="font-family: 'Segoe UI', sans-serif; font-size: 15px; color: #333;">
        <h2 style="color: #2c3e50;">Password Reset Successful</h2>
        <p>Dear ${user.firstname || "User"},</p>
        <p>Your password for your TaskManager account has been successfully reset.</p>

        <p><strong>Please use the credentials below to log in:</strong></p>

        <table style="margin-top: 10px;">
          <tr>
            <td style="padding: 4px 8px;">Login Email:</td>
            <td style="padding: 4px 8px;"><strong>${email}</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 8px;">New Password:</td>
            <td style="padding: 4px 8px;"><strong>${randomPassword}</strong></td>
          </tr>
        </table>

        <p style="margin-top: 20px;">We recommend you change this password after logging in for better security.</p>

        <p>Thank you,<br />The TaskManager Team</p>
      </div>
    `;

      await sendEmail(
        email,
        emailTemplate,
        "Your TaskManager Password Has Been Reset"
      );

      return res.send({
        status: true,
        message: "A new password has been sent to your email.",
      });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      return res
        .status(203)
        .send({ status: false, message: "Something went wrong." });
    }
  },
};
