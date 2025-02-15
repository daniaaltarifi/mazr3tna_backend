const express = require("express");
const router = express.Router();
const ProductController = require("../Controller/ProductController.js");
const BrandController = require("../Controller/BrandController.js");


const multer = require('../Configurations/Multer');

 router.get("/get/certificates", BrandController.getAllCertificates);
router.post('/addcertificate',multer.fields([{ name: "certificate_img", maxCount: 1 }]),BrandController.addCertificate)
router.put("/updatecert/:id", multer.fields([{ name: "certificate_img", maxCount: 1 }]), BrandController.updateCertificate);

router.delete("/delete/cert/:id", BrandController.deleteCertificate);


router.get("/get/season", BrandController.getSeasons);
router.get("/get/productbyseason/:season", BrandController.getProductBySeasons);
router.get("/get/latestproducts", BrandController.getLatestProduct);
router.get("/getcertificatebyid/:id",BrandController.getCertificateById)
 module.exports = router;



