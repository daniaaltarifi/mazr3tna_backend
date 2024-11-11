const express = require('express')
const router = express.Router();
const MainProductController = require('../Controller/MainProductController')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 
router.get("/getmainproduct",MainProductController.getmain_product)
router.post("/add",MainProductController.addMainProduct)
router.put("/update/:id",MainProductController.updateMainProduct)
router.delete("/delete/:id",MainProductController.deleteProduct)
router.get("/main_product_filter/:main_product_type_id",MainProductController.filter_main_products)
module.exports =router