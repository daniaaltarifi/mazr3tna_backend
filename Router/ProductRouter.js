const express = require("express");
const router = express.Router();
const ProductController = require("../Controller/ProductController.js");
const multer = require('../Configurations/Multer');

// Product routes
router.post("/add", multer.array("img", 5), ProductController.addProduct);
router.delete("/delete/:id", ProductController.deleteProduct);
router.put("/update/:id", multer.array("img", 5), ProductController.updateProduct);
router.get("/getbyid/:id",ProductController.getProductDetails)
router.get("/getbyidcms/:id",ProductController.getProductByIdCms)
router.get("/get/allproducts", ProductController.getAllProducts);
router.get("/get/getAllPro", ProductController.getAllPro);


router.delete("/deleteimage/:id", ProductController.deleteProductImage)
router.put("/updatevariants/:id", ProductController.updateVariants);
router.get("/getvariantsbyid/:id", ProductController.getVariantBuId)


module.exports = router;
