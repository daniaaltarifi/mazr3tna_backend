const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const db = require("./config.js");
const app = express();
const PORT = process.env.PORT || 3005;
app.use(express.json());
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://mazr3tnabackend.kassel.icu'
];


const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, 
};


app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("images"));
const ProductRouter=require('./Router/ProductRouter.js')
// const GiftCardRouter=require('./Router/GiftCardRouter.js')
const LoginRouter=require('./Router/LoginRouter.js')
const UserAddressRouter=require('./Router/UserAddressRouter.js')
const CartRouter=require('./Router/CartRouter.js')
const ResetPasswordRouter=require('./Router/ResetPasswordRouter.js')
const OrdersRouter=require('./Router/OrdersRouter.js')
const SliderRouter=require('./Router/SliderRouter.js')
const WalletRouter=require('./Router/WalletRouter.js')
const FeedbackRouter=require('./Router/FeedbackRouter.js')
const DiscountCodeRouter=require('./Router/DiscountCodeRouter.js')
const MainProductRouter =require('./Router/MainProductRouter.js')
const CertificateRouter =require('./Router/CertificateRouter.js')
const BlogsRouter =require('./Router/BlogsRouter.js')
const AboutRouter =require('./Router/AboutPostRouter.js')
const FooterRouter =require('./Router/FooterRouter.js')
const SocialRouter =require('./Router/SocialRouter.js')
const HeaderRouter =require('./Router/HeaderRouter.js')


const PrivacyPolicyRouter =require('./Router/PrivacyPolicyRouter.js')
const TermsConditionsRouter = require('./Router/TermsConditionsRouter.js')


app.use('/product',ProductRouter)
// app.use('/giftcard',GiftCardRouter)
app.use('/auth',LoginRouter)
app.use('/address',UserAddressRouter)
app.use('/cart',CartRouter)
app.use('/changepassword',ResetPasswordRouter)
app.use('/orders',OrdersRouter)
app.use('/slider',SliderRouter)
app.use('/wallet',WalletRouter)
app.use('/feedback',FeedbackRouter)
app.use('/discountcode',DiscountCodeRouter)
app.use('/mainproduct',MainProductRouter)
app.use('/certificate',CertificateRouter)
app.use('/blogs',BlogsRouter)
app.use('/footer',FooterRouter)
app.use('/social',SocialRouter)
app.use('/header',HeaderRouter)

app.use('/about',AboutRouter)
app.use('/privacypolicy',PrivacyPolicyRouter)
app.use('/TermsConditionsRouter',TermsConditionsRouter)


app.get("/", (req, res) => {
    res.send("Welcome to Mazr3tna! ");
  });
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
  
