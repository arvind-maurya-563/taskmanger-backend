# Task Manager Backend

This is the backend for the **Task Manager** application, built with **Node.js** and **Express.js**.

---

## ✅ Prerequisites

Before setting up the project, make sure you have the following tools installed:

1️⃣ Install Git Bash

Download and install Git Bash for Windows:  
👉 [https://git-scm.com/downloads](https://git-scm.com/downloads)

---

2️⃣ Install Node.js

Download and install Node.js (version 14 or higher):  
👉 [https://nodejs.org/](https://nodejs.org/)

After installation, verify versions using Git Bash or terminal:

```bash
node -v
npm -v

🚀 Getting Started
3️⃣ Clone the Repository
Open Git Bash or terminal and run:

bash
git clone https://github.com/arvind-maurya-563/taskmanger-backend.git
cd taskmanger-backend
4️⃣ Install Dependencies
Run the following command to install all required npm packages:

bash
npm install
5️⃣ Create a .env File
Create a .env file in the project root with environment variables. Example:

env
JWT_SECRET="tokensercret"
PASS_KEY="password-secure-key"
USER_PASSWORD="email-passkey"
USER_EMAIL="emailId"
⚠️ Do not commit this file to GitHub.

6️⃣ Start the Server
To run the backend server in development mode:

bash
npm start
The server will start at:
📍 http://localhost:5000

📂 Folder Structure
taskmanger-backend/
│
├── controllers/         # Route controllers
├── models/              # Mongoose models
├── routes/              # Express route definitions
├── middleware/          # Custom middleware (auth, etc.)
├── config/              # DB config or constants
├── .env                 # Environment variables (not committed)
├── server.js            # Entry point
├── package.json         # Project metadata and dependencies
└── README.md            # Project documentation
