const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/users');
const Order = require('../models/Order');
const cors = require('cors');
const app = express();
const router = express.Router();
const generateAuthToken = require('../jwToken');
// Middleware
const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_51N6EfUSCtNBWgQI1he8keBsR0dxXEJnMDl6TJk8Se8l66VgglVVqCAzsifpu62MkLwJi5l0wm5J9Ii226S4Up2Wl007eKfuvB4');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// JWT secret
const jwtSecret = "HaHa";
// var foodItems= require('../index').foodData;
// require("../index")
//Creating a user and storing data to MongoDB Atlas, No Login Requiered
router.post('/register', async (req, res) => {
    const { fName, lName, email, pass } = req.body;
  
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send('User is already registered in our database');
    }
  
    // Hash password
    const hashedPass = await bcrypt.hash(pass, 10);
  
    // Save user to database
    const newUser = new User({
      fName,
      lName,
      email,
      pass: hashedPass,
    });
  
    try {
      await newUser.save();
  
      // Generate JWT token
      const data = {
        user: {
          id: newUser._id,
        },
      };
      const authToken = jwt.sign(data, jwtSecret);
  
      res.json({ success: true, authToken });
    } catch (err) {
      console.log(err);
      res.json({ error: 'Please enter a unique value.' });
    }
  });
// Authentication a User, No login Requiered
router.post('/login', async (req, res) => {
    const userInfo=req.body
      console.log(userInfo,"ppp")
      var user
    try {
      // Find user by email
      user = await User.findOne({email:userInfo.email});
  
      // Check if user exists
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password', success: false });
      }
  
      // Check password
      const validPass = await bcrypt.compare(userInfo.pass, user.pass);
      if (!validPass) {
        return res.status(401).json({ message: 'Invalid email or password', success: false });
      }
  
      // Generate JWT token
      const data = {
        user: {
          id: user._id,
        },
      };
      const authToken = jwt.sign(data, jwtSecret);
  
      res.json({ success: true, authToken });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

// Get logged in User details, Login Required.
router.post('/getuser', generateAuthToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password") // -password will not pick password from db.
        res.send(user)
    } catch (error) {
        console.error(error.message)
        res.send("Server Error")

    }
})
// Get logged in User details, Login Required.
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
  
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: {
          email: "your_email",
          pass: "your_password",
        },
      });
  
      const mailOptions = {
        from: "noreply@example.com",
        to: email,
        subject: "Reset Your Password",
        html: `
          <p>Hi there,</p>
          <p>Please click the following link to reset your password:</p>
          <p><a href="https://yourwebsite.com/reset-password?token=${resetToken}">Reset Password</a></p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        `,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({
        message: `An email with instructions to reset your password has been sent to ${email}.`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred. Please try again later." });
    }
  });
  router.post('/foodData', async (req, res) => {
    try {
        // console.log( JSON.stringify(global.foodData))
        // const userId = req.user._id;
        // await database.listCollections({name:"food_items"}).find({});
        res.send([global.foodData, global.foodCategory])
    } catch (error) {
        console.error(error.message)
        res.send("Server Error")

    }
})

router.post('/orderData', async (req, res) => {
    let data = req.body.order_data
    await data.splice(0,0,{Order_date:req.body.order_date})
    console.log("1231242343242354",req.body.email)

    //if email not exisitng in db then create: else: InsertMany()
    let eId = await Order.findOne({ 'email': req.body.email })    
    console.log(eId)
    if (eId===null) {
        try {
            console.log(data)
            console.log("1231242343242354",req.body.email)
            await Order.create({
                email: req.body.email,
                order_data:[data]
            }).then(() => {
                res.json({ success: true })
            })
        } catch (error) {
            console.log(error.message)
            res.send("Server Error", error.message)

        }
    }

    else {
        try {
            await Order.findOneAndUpdate({email:req.body.email},
                { $push:{order_data: data} }).then(() => {
                    res.json({ success: true })
                })
        } catch (error) {
            console.log(error.message)
            res.send("Server Error", error.message)
        }
    }
})

router.post('/myOrder', async (req, res) => {
    try {
        console.log(req.body.email)
        let eId = await Order.findOne({ 'email': req.body.email })
        //console.log(eId)
        res.json({orderData:eId})
    } catch (error) {
        res.send("Error",error.message)
    }
    

});
router.post("/payment", (req, res) => {
  console.log(req.body);

  const response = {
    status: "success",
    message: "Payment has been processed.",
  };

  res.send(response);
});


module.exports = router
