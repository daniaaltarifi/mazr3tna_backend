const express = require("express");
const router = express.Router();
const BlogsController = require("../Controller/BlogsController.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer storage
const customStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images"); // Destination folder
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const filePath = path.join("images", file.originalname);

    // Check if file already exists with the same name
    if (fs.existsSync(filePath)) {
      // If the file exists, don't upload again
      cb(null, file.originalname);  // Same filename will not be added again
    } else {
      // If file doesn't exist, proceed with saving the file
      cb(null, file.originalname);
    }
  },
});

// Middleware to handle file upload
const upload = multer({
  storage: customStorage,
  fileFilter: (req, file, cb) => {
    // Optionally, you can filter file types if needed
    cb(null, true);
  },
});
 router.get("/get/blogs", BlogsController.getAllblogs);
router.post('/addblog',upload.fields([{ name: "img", maxCount: 1 }]),BlogsController.addblogs)
router.put("/updateblog/:id", upload.fields([{ name: "img", maxCount: 1 }]), BlogsController.updateblogs);

router.delete("/delete/blog/:id", BlogsController.deleteblogs);
router.get("/getblogbyid/:id",BlogsController.getblogsById)
 module.exports = router;



