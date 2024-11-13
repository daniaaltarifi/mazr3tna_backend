const express = require("express");
const router = express.Router();
const ProductController = require("../Controller/ProductController.js");
const BrandController = require("../Controller/BrandController.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// Configure multer storage
const customStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "images"); // Destination folder
    },
    filename: (req, file, cb) => {
      // Generate the filename
      const filename = file.originalname;
      const filePath = path.join("images", filename);
  
      // Check if the file already exists
      if (fs.existsSync(filePath)) {
        // If file exists, append a timestamp to the filename
        const timestamp = Date.now();
        const ext = path.extname(filename);
        const baseName = path.basename(filename, ext);
        cb(null, `${baseName}-${timestamp}${ext}`);
      } else {
        // If file doesn't exist, save it with the given filename
        cb(null, filename);
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
 router.get("/get/certificates", BrandController.getAllCertificates);
router.post('/addcertificate',upload.fields([{ name: "certificate_img", maxCount: 1 }]),BrandController.addCertificate)
router.put("/updatecert/:id", upload.fields([{ name: "certificate_img", maxCount: 1 }]), BrandController.updateCertificate);

router.delete("/delete/cert/:id", BrandController.deleteCertificate);


router.get("/get/season", BrandController.getSeasons);
router.get("/get/productbyseason/:season", BrandController.getProductBySeasons);
router.get("/get/latestproducts", BrandController.getLatestProduct);
router.get("/getcertificatebyid/:id",BrandController.getCertificateById)
 module.exports = router;



