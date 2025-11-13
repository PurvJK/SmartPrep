const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve images from uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const theoryRoutes = require("./routes/theory");
const uploadRoutes = require("./routes/upload");

app.use("/api/theory", theoryRoutes);
app.use("/api/upload", uploadRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => app.listen(5000, () => console.log("Server running on http://localhost:5000")))
.catch(err => console.log(err));
