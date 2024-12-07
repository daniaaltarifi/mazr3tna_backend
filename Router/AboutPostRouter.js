
const express = require('express')
const router = express.Router();
const AboutPostController = require('../Controller/AboutController')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 



const multer = require('../Configurations/Multer');



router.get('/getallaboutposts', AboutPostController.getAllAboutPosts);
router.post('/addabout',multer.fields([{ name: "img", maxCount: 1 }]),AboutPostController.addAbout);
router.get('/getaboutpostbyid/:id',AboutPostController.getAboutPostById)
router.put('/updatedaboutpost/:id',multer.fields([{ name: "img", maxCount: 1 }]),AboutPostController.updateAboutPost)
router.delete('/deletaboutpost/:id',AboutPostController.deleteAboutPost)



module.exports = router