const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // save in uploads folder
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post("/", upload.array("images", 10), (req, res) => {
  const urls = req.files.map(f => `http://localhost:5000/uploads/${f.filename}`);
  res.json({ urls }); // returns array of uploaded image URLs
});

module.exports = router;
