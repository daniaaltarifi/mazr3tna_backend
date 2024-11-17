const express = require('express')
const router = express.Router();
const HeaderController = require('../Controller/HeaderController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 

// router.post('/validatecode', HeaderController.validateHeader);
router.get('/get/:lang', HeaderController.getHeaderByLang);
router.post('/addheader', HeaderController.addHeader);
router.delete('/deleteheader/:id', HeaderController.deletedheader);
router.put('/updateheader/:id', HeaderController.updatedheader);
router.get('/getheaderbyid/:id', HeaderController.getheaderById);
router.get('/getallheader', HeaderController.getallheader);





module.exports = router