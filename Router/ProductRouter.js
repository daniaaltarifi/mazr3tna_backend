const express = require("express");
const router = express.Router();
const ProductController = require("../Controller/ProductController.js");
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


// Product routes
router.post("/add", upload.array("img", 5), ProductController.addProduct);
router.delete("/delete/:id", ProductController.deleteProduct);
router.put("/update/:id", upload.array("img", 5), ProductController.updateProduct);
router.get("/getbyid/:id",ProductController.getProductDetails)
router.get("/getbyidcms/:id",ProductController.getProductByIdCms)
router.get("/get/allproducts", ProductController.getAllProducts);
router.get("/get/getAllPro", ProductController.getAllPro);


router.delete("/deleteimage/:id", ProductController.deleteProductImage)
router.put("/updatevariants/:id", ProductController.updateVariants);
router.get("/getvariantsbyid/:id", ProductController.getVariantBuId)


module.exports = router;
