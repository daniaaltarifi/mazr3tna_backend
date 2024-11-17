


const express = require('express')
const router = express.Router();
const TermsConditionsCoontroller = require('../Controller/TermsConditionsController')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json());

router.get('/getAllTermsConditions', TermsConditionsCoontroller.getTermsAndConditions);
router.post('/addTermsConditions', TermsConditionsCoontroller.addTermsAndConditions);
router.put('/updateTermsConditions/:id', TermsConditionsCoontroller.updateTermsAndConditions);
router.delete('/deleteTermsConditions/:id', TermsConditionsCoontroller.deleteTermsAndConditions);
router.get('/getTermsConditionsbyid/:id', TermsConditionsCoontroller.getTermsAndConditionsById);



module.exports = router