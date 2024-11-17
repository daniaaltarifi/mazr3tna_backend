
const express = require('express')
const router = express.Router();
const PrivacyPolicyController = require('../Controller/PrivacyPolicyController')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json());






router.get('/getprivacypolicy', PrivacyPolicyController.getPrivacyPlicies);
router.post('/addprivacypolicy', PrivacyPolicyController.addPrivacyPolicy);
router.put('/update/privacypolicy/:id', PrivacyPolicyController.updatePrivacyPolicy);
router.delete('/deleteprivacypolicy/:id', PrivacyPolicyController.deletePrivacyPolicy);
router.get('/getprivacypolicybyid/:id', PrivacyPolicyController.getPrivacyPolicyById);

module.exports = router