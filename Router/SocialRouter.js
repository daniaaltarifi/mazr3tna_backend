const express = require("express");
const router = express.Router();
const SocialController = require("../Controller/SocialController.js");
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
 router.get("/get/social", SocialController.getAllsocial);
router.post('/addsocial',upload.fields([{ name: "icon", maxCount: 1 }]),SocialController.addsocial)
router.put("/updatesocial/:id", upload.fields([{ name: "icon", maxCount: 1 }]), SocialController.updatesocial);

router.delete("/delete/social/:id", SocialController.deletesocial);
router.get("/getsocialbyid/:id",SocialController.getsocialById)
 module.exports = router;



