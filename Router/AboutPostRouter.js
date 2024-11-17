
const express = require('express')
const router = express.Router();
const AboutPostController = require('../Controller/AboutController')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const customStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images"); 
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const filePath = path.join("images", file.originalname);
    if (fs.existsSync(filePath)) {
      // If the file exists, don't upload again
      cb(null, file.originalname);  // Same filename will not be added again
    } else {
      // If file doesn't exist, proceed with saving the file
      cb(null, file.originalname);
    }
  },
});

const upload = multer({
  storage: customStorage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

router.get('/getallaboutposts', AboutPostController.getAllAboutPosts);
router.post('/addabout',upload.fields([{ name: "img", maxCount: 1 }]),AboutPostController.addAbout);
router.get('/getaboutpostbyid/:id',AboutPostController.getAboutPostById)
router.put('/updatedaboutpost/:id',upload.fields([{ name: "img", maxCount: 1 }]),AboutPostController.updateAboutPost)
router.delete('/deletaboutpost/:id',AboutPostController.deleteAboutPost)



module.exports = router