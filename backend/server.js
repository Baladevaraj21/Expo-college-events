const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database Connection
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Connected to MongoDB via Backend API");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

// Root Route for Browser Testing
app.get("/", (req, res) => {
    res.send("Welcome to the CampusConnect Backend API! 🚀 (The server is running perfectly)");
});

// Routes Placeholder
app.use("/api/auth", require("./routes/auth"));
app.use("/api/college", require("./routes/college"));
app.use("/api/student", require("./routes/student"));
app.use("/api/student", require("./routes/studentApplications")); // Mapped so it joins with the base URL

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend API Server running on port ${PORT}`);
});
