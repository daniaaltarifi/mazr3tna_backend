const express = require("express");
const router = express.Router();
const ProductController = require("../Controller/ProductController.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

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
// router.get("/:id", ProductController.getProductDetails);
// router.get("/bymaintype/:main_product_type", ProductController.getProducts);
// router.get("/bysubtype/:subtype", ProductController.getProductBysubType);
router.delete("/delete/:id", ProductController.deleteProduct);
router.put("/update/:id", upload.array("img", 5), ProductController.updateProduct);

// // Brand routes
// router.post("/addbrand", upload.fields([{ name: "brand_img", maxCount: 1 }]), BrandController.addBrand);
// router.get("/get/productbybrands/:brand", BrandController.getProductBasedOnBrands);
// router.put("/updatebrand/:id", upload.fields([{ name: "brand_img", maxCount: 1 }]), BrandController.updateBrand);
// router.get("/get/brandsbyid/:id", BrandController.getBrandByid);
// router.delete("/delete/brand/:id", BrandController.deleteBrand);

// // Get sizes
// router.get("/get/sizesbags", BrandController.sizesBags);
// router.get("/get/sizesfragrances", BrandController.sizesFragrance);

// // Get seasons


// // Get all products

// router.get("/getproductbyid/:id",ProductController.getProductById)
// router.put('/updateFragranceVariants/:id', ProductController.updateFragranceVariant);
// router.put("/updatebagsvariants/:id",ProductController.updateBagVariants)
// router.get("/getfragrancevariantsbyid/:id",ProductController.getFragranceVariantsById)
// router.get("/getbagsvariansbyid/:id", ProductController.getBagVariantsById)
// router.delete('/deletefragrancevariant/:variantFragranceID', ProductController.deleteFragranceVariantByFragranceID);
// router.delete("/deletebagsvariants/:VariantID", ProductController.deleteBagVariantByVariantID)
// router.get("/variants/getAllProductsWithVariantsCMS",ProductController.getAllProductsWithVariantsCMS)
// router.delete("/deleteProductImageById/:id", ProductController.deleteProductImage)

router.get("/getbyid/:id",ProductController.getProductDetails)
router.get("/getbyidcms/:id",ProductController.getProductByIdCms)
router.get("/get/allproducts", ProductController.getAllProducts);
router.get("/get/getAllPro", ProductController.getAllPro);


router.delete("/deleteimage/:id", ProductController.deleteProductImage)


module.exports = router;
