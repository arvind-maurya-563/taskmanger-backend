const generator = require("generate-password");
const { user_model } = require("../Models/userModel");
module.exports = {
  genrateRandomPassword() {
    const randomPassword = generator.generate({
      length: 8,
      uppercase: true,
      lowercase: true,
      symbols: false,
      numbers: true
    });
    // console.log(randomPassword);
    return randomPassword;
  },
  
  generateRandomOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  taskUpdateCreateTemplate(newData, oldData, update, createdBy, updatedBy, name, projectName) {
    const displayKeys = ["title", "description", "statusName", "priority", "progress"];
    let changeDetails = "";
    let updateText = "";
    if (update) {
      const changedKeys = displayKeys.filter(key => newData[key] !== oldData[key]);
      changeDetails = displayKeys.map(key => {
        if (changedKeys.includes(key)) {
          return `<p><strong>${key.replace(/([A-Z])/g, " $1")}:</strong> ${oldData[key]}${key === "progress" ? "%" : ""} => ${newData[key]}${key === "progress" ? "%" : ""}</p>`;
        } else {
          return `<p><strong>${key.replace(/([A-Z])/g, " $1")}:</strong> ${newData[key]}${key === "progress" ? "%" : ""}</p>`;
        }
      }).join("");
      updateText = changedKeys.length === 1
        ? `Your assigned task ${changedKeys[0] === "statusName" ? "status" : changedKeys[0]} has been updated by ${updatedBy}.`
        : changedKeys.length > 1
          ? `Your assigned task has been updated by ${updatedBy}.`
          : `Task details has been changed.`;
    } else {
      changeDetails = displayKeys.map(key =>
        `<p><strong>${key === "title" ? "Title" : key === "description" ? "Description" : key === "statusName" ? "Status" : key === "priority" ? "Priority" : "Progress"}:</strong> ${newData[key]}</p>`
      ).join("");
      updateText = `${createdBy} has assigned a new task to you.`;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f8f8;
        }
        .email-container {
            background-color: #ffffff;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
        }
        h1 {
            color: #2a9d8f;
            font-size: 22px;
            margin-bottom: 15px;
        }
        p {
            font-size: 14px;
            margin: 5px 0;
        }
        .task-details {
            margin-top: 15px;
        }
        .task-details p {
            font-size: 14px;
            margin: 5px 0;
        }
        .btn {
            background-color: #2a9d8f;
            color: white;
            padding: 8px 15px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <h1>Task Notification: ${newData?.title}</h1>
        <h1>Project Name: ${projectName}</h1>
        <p>Hi ${name},</p>
        <p>${updateText} Here are the details:</p>

        <div class="task-details">
            ${changeDetails}
        </div>
    </div>
</body>
</html>`;
  },
  async getUserNameByEmail(email) {
    try {
      const userData = await user_model.findOne({ email }).select('firstname lastname email').lean();
      return { name: `${userData?.firstname} ${userData?.lastname}`, email: userData.email };
    } catch (error) {
      console.log(error);
      return "";
    }
  },
  async getUserNamesByEmails(email) {
    try {
      const users = await user_model
        .find({ email: { $in: email } })
        .select("firstname lastname email")
        .lean();

      return users.map(user => ({
        name: `${user.firstname} ${user.lastname}`,
        email: user.email
      }));
    } catch (error) {
      console.error("Error fetching multiple users:", error);
      return [];
    }
  }
};
