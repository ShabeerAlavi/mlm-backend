const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const path = require('path');
// const Ravepay = require('ravepay');

const keys = require('../../config/keys');

const validateRegisterInput = require('../../utils/validation/register');
const validateLoginInput = require('../../utils/validation/login');
const validateChangePasswordInput = require('../../utils/validation/changePassword');
const validateUpdateDataInput = require('../../utils/validation/updateData');

const User = require('../../models/Users');
const Profile = require('../../models/Profile');
const Nodelist = require('../../models/Nodelist');
const Infodata = require('../../models/Infodata');
const CmpPayment=require("../../models/cmppayments");
// const { upload } = require('../../server');




const router = express.Router();



////first payment
router.post('/fpay', async (req, res) => {
    const { userId,mobile,cmp_upi,accNo,ifsc,uMobile } = req.body;
    const user_upi=req.body.upiId;
    const user_name=req.body.name;
    const payment_status=req.body.payment_status;
    // const imageSrc = req.body.imgUri;
    console.log("welcome to fpay")
    // Validation (customize as needed)
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.log("!userId")
      return res.status(400).send({ message: 'Invalid request data' });
    }

    try {  
      const newPay= new CmpPayment({
        userId: userId,
        name:user_name,
        mobile: mobile,
        accNo:accNo,
        ifsc:ifsc,
        uMobile:uMobile,
        upiId:user_upi,
        payment_status: payment_status,
        paymentDetails:[
            {
                payment_amount: 500,
                payment_date:new Date(),
                cmp_upi: cmp_upi,
                payment_try:1
            }
        ]
       
      })
  
      await newPay.save()


       await User.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userId)  },
        { $set: { firstPaymentStatus: true, firstPaymentApprovel:"requested", UpiId:user_upi} },
        { new: true } 
        ).then(async ()=>  {
            const file = req.files.imgUri;
            const uploadPath = path.join(__dirname, '../uploads',userId+".png" );
            await file.mv(uploadPath);
            res.status(200).send("waiting for admin approval")
        })
      // Send created document
    } catch (err) {
      console.error(err); // Log error for debugging
      res.status(500).send({ message: 'Error adding Nodelist' });
    }
  });

router.post('/rejCmp', async (req, res) => {
    const { userId,mobile,cmp_upi, } = req.body;
    const user_upi=req.body.upiId;
    const user_name=req.body.name;
    const payment_status=req.body.payment_status;
    // const imageSrc = req.body.imgUri;
    console.log("rejCmprejCmprejCmp")
    // Validation (customize as needed)
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.log("!userId")
      return res.status(400).send({ message: 'Invalid request data' });
    }

    try {  
       await User.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userId)  },
        { $set: { firstPaymentStatus: false, firstPaymentApprovel:"rejected"} },
        { new: true } 
        ).then(async ()=>  {
            await CmpPayment.findOneAndUpdate(
                { userId: new mongoose.Types.ObjectId(userId)  },
                { $set: { payment_status:"rejected"} },
                { new: true } 
                ).then(()=> res.status(201).send("admin rejected"))
        })
      // Send created document
    } catch (err) {
      console.error(err); // Log error for debugging
      res.status(500).send({ message: 'Error adding Nodelist' });
    }
  });

///second payment api

router.post('/addnode', async (req, res) => {
    const { userId,mobile ,payment_status} = req.body;
    const  user_accNo= req.body.accNo;
    const  user_ifsc=req.body.ifsc;
    const  user_uMobile=req.body.uMobile;
    const user_upi=req.body.upiId;
    const user_name=req.body.name;
    
    const newNodeId = await getNextNodeId(); // Get the next available nodeId
  
    console.log("welcome to addnote")
    // Validation (customize as needed)
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.log("!userId")
      return res.status(400).send({ message: 'Invalid request data' });
    }
  
    try {
      // Find the first document with isMaturedNode: false
      const firstNonMaturedNode = await Nodelist.findOne({ isMaturedNode: false });
      console.log("firstNonMaturedNode" ,firstNonMaturedNode )
      if (!firstNonMaturedNode) {
        return res.status(400).send({ message: 'No non-matured nodes found' });
      }
  
      const { name, nodeId, upiId,ifsc,uMobile,accNo } = firstNonMaturedNode;
  
      // Update maturedNode of the first non-matured node
      firstNonMaturedNode.maturedNode.push(newNodeId);
      if (firstNonMaturedNode.maturedNode.length === 2) {
        firstNonMaturedNode.isMaturedNode = true;
      }
  
      await firstNonMaturedNode.save();
  
      // Create the new Nodelist document
      const newDocument = new Nodelist({
        userId:userId,
        name:user_name,
        mobile:mobile,
        upiId:user_upi,
        accNo:user_accNo,
        ifsc:user_ifsc,
        uMobile:user_uMobile,
        ref_node:name,
        isMaturedNode: false, // Set true for initial creation
        maturedNode: [],
        ref_node_code: nodeId,
        dateCreated: new Date(),
        nodeId: newNodeId,
        nodeSl:newNodeId-1000,
        ref_upiId: upiId
      });
  
      const savedNode = await newDocument.save();
      console.log("save",savedNode)
      const userData= await User.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userId)  },
        { $set: { firstPaymentStatus: true, firstPaymentApprovel:"approved", ref_upiId: upiId,UpiId:user_upi,ref_node:name,ref_node_code:nodeId,ref_accNo:accNo,ref_ifsc:ifsc,ref_uMobile:uMobile }},
        { new: true } 
        ).then(async()=> {
            await CmpPayment.findOneAndUpdate(
                { userId: new mongoose.Types.ObjectId(userId)  },
                { $set: { payment_status:"approved" } },
                { new: true } 
                ).then(()=> res.status(201).send(savedNode))
       })
      // Send created document
    } catch (err) {
      console.error(err); // Log error for debugging
      res.status(500).send({ message: 'Error adding Nodelist' });
    }
  });

  async function getNextNodeId() {
    console.log(" getNextNodeId")
    try {
      const lastNode = await Nodelist.findOne().sort({ nodeId: -1 }).limit(1);
      if (lastNode) {
        console.log(lastNode.nodeId + 1," ---NextNodeId")
        return lastNode.nodeId + 1;
      } else {
        console.log("1001---NextNodeId")
        return 1001; // Start from 1001 if no Nodelist documents exist
      }
    } catch (err) {
      console.error('Error retrieving last nodeId:', err);
      throw err; // Re-throw the error for handling in the controller
    }
  }


router.post('/register', (req, res) => {
    console.log("regis**********************")
    // const { errors, isValid } = validateRegisterInput(req.body);

    // if (!isValid) {
    //     return res.status(400).json(errors);
    // }

    User.findOne({ name: req.body.name })
        .then(returnedUser => {
            if (returnedUser) {
                errors.username = 'Username already exists!';
                return res.status(406).json(errors);
            }
            User.findOne({ email: req.body.email })
                .then(user => {
                    if (user) {
                        errors.email = 'Email already exists!';
                        return res.status(406).json(errors);
                    } 

                    const userData = new User({
                        name: req.body.name.toUpperCase(),
                        email: req.body.email.toLowerCase(),
                        mobile:req.body.mobile,
                        password: req.body.password
                    });
                
                    bcrypt.genSalt(10, (err, salt) => {
                        if (err) {
                            return console.log(err);
                        }
                
                        bcrypt.hash(userData.password, salt, (err, hash) => {
                            if (err) {
                                return console.log(err);
                            }
                            userData.password = hash;
                            userData.save()
                                .then(savedUser => {
                                    const userProfile = new Profile({
                                        user: savedUser.id
                                    });
                                    userProfile.save()
                                        .then(profile => {
                                            res.json({ message: 'Registration Successful!' });
                                        })
                                        .catch(err => console.log(err));
                                })
                                .catch(err => console.log(err));
                        });
                    });
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
});

// Login user
// @route POST /api/users/login /Returmn JWT token
// @desc login user
// @access Private
router.post('/login', (req, res) => {
    console.log("regis*******************loggggggggggggggggggg***",req.body)
    const email = req.body.email;
    const password = req.body.password;
    const data={};

    User.findOne({ email })
        .then(user => {
            if (!user) {
                console.log("not user")
                data.status = 404;
                data.errors = 'Email/password not found';
                res.status(404).json(data);
            }

    //console.log(password, user.password,"pppp")
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    console.log(isMatch,"is match vavvv")
                    if (isMatch) {
                       // console.log("is match")
                        data.data=user;
                    // Sign the token
                    jwt.sign({payload:user}, keys.secretOrKey, { expiresIn: '30 days' }, (err, token) => {
                        data.token=token;
                        res.json({
                            status :200,
                            data:{data},
                            token: `Bearer ${token}`
                        });
                    });        
                    } else {
                        console.log("is match else")
                        data.status = 404;
                        data.errors = 'Email/password not found';
                        res.status(404).json(data);
                    }
                })
                .catch(err => console.log(err));
        })
        .catch(err => {});
});

router.get('/gu/:userId', (req, res) => {
    console.log("regis*******guuuuuuuuuuuuuu************loggggggggggggggggggg***",req.body)
    const userId = req.params.userId;
    const data={};

    User.findOne({ _id: new mongoose.Types.ObjectId(userId)  },)
        .then(user => {
                        data.data=user;
                        res.json({
                            status :200,
                            data:data,
                            // token: `Bearer ${token}`
                        });
                    // Sign the token
                   
                })
                .catch(err => console.log(err));
        })
    
// Change password
// @route POST /api/users/changePassword
// @desc change user password
// @access Public
router.put('/changePassword', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateChangePasswordInput(req.body);
    const { currentPassword, newPassword } = req.body;

    if (!isValid) {
        return res.status(400).json(errors);
    }

    User.findById(req.user.id)
        .then(user => {
            if (user) {
                bcrypt.compare(currentPassword, user.password)
                    .then(isMatch => {
                        if (isMatch) {
                            bcrypt.genSalt(10, (err, salt) => {
                                if (err) {
                                    return console.log(err);
                                }
                        
                                bcrypt.hash(newPassword, salt, (err, hash) => {
                                    if (err) {
                                        return console.log(err);
                                    }
                                    bcrypt.compare(newPassword, user.password)
                                        .then(isMatch => {
                                            if (isMatch) {
                                                errors.newPassword = 'New password cannot be the same with the current password';
                                                return res.status(403).json(errors);
                                            } else {
                                                user.password = hash;
                                                user.save()
                                                    .then(() => res.json({ success: 'Password changed successfully!' }))
                                                    .catch(err => console.log(err));
                                            }
                                        })
                                        .catch(err => console.log(err));
                                });
                            });
                        } else {
                            errors.currentPassword = 'Incorrect Password!';
                            return res.status(401).json(errors);
                        }
                    })
                    .catch(err => console.log(err));
            } 
        })
        .catch(err => console.log(err));
});

// Update data
// @route PUT /api/users/updateData
// @desc update user data
// @access Private
router.put('/updateData', passport.authenticate('jwt', { session: false }), (req, res) => {
    console.log(req.user.id);
    const { errors, isValid } = validateUpdateDataInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const userData = {
        firstName: req.body.firstName.toUpperCase(),
        lastName: req.body.lastName.toUpperCase(),
        email: req.body.email.toLowerCase(), 
        phone: req.body.phone,
        password: req.body.password
    };

    User.findOne({ _id: req.user.id })
        .then(user => {
            if (user) {
                bcrypt.compare(req.body.password, user.password)
                    .then(isMatch => {
                        if (isMatch) {
                            user.firstName = userData.firstName;
                            user.lastName = userData.lastName;
                            user.email = userData.email;
                            user.phone = userData.phone
                            user.save()
                                .then(updatedUser => {
                                    Profile.findOne({ user: req.user.id })
                                        .then(profile => {
                                            const payload = {
                                                success: 'Update Successful',
                                                id: updatedUser.id,
                                                username: updatedUser.username,
                                                firstName: updatedUser.firstName,
                                                lastName: updatedUser.lastName,
                                                email: updatedUser.email,
                                                phone: updatedUser.phone,
                                                lastSeen: user.lastSeen,
                                                dateCreated: user.dateCreated,
                                                balance: profile.balance,
                                                totalEarnings: profile.totalEarnings,
                                                gamesPlayed: profile.gamesPlayed,
                                                rank: profile.rank,
                                                wins: profile.wins,
                                                losses: profile.losses,
                                                bank: profile.bank,
                                                accountName: profile.accountName,
                                                accountNumber: profile.accountNumber
                                            };
                                            jwt.sign(payload, keys.secretOrKey, { expiresIn: '30 days' }, (err, token) => {
                                                res.json({
                                                    ...payload,
                                                    token: `Bearer ${token}`
                                                });
                                            });
                                        })
                                        .catch(err => console.log(err))
                                })
                                .catch(err => console.log(err));
                        } else {
                            errors.password = 'Incorrect password!';
                            res.status(401).json(errors);
                        }
                    })
                    .catch(err => console.log(err));
            }
        })
        .catch(err => console.log(err));
});

// Gets quiz questions
// @route GET /api/users/quiz/category/:category
// @desc get questions by category
// @access Private
router.get('/quiz/category/:quizCategory', passport.authenticate('jwt', { session: false }), (req, res) => {
    Quiz.find({ type: req.params.quizCategory })
        .then(quizzes => res.json(quizzes))
        .catch(err => console.log(err));
});

// add user credit card
// @route POST /api/users/addCard
// @desc Add Credit card to user account
// @access Private
router.post('/addCard', passport.authenticate('jwt', { session: false }), (req, res) => {
    console.log('card request');
    console.log(req.user);
    Profile.findOne({ user: req.user._id })
        .then(profile => {
            if (!profile) {
                console.log('profile found ', profile);
                return res.status(404).json({ msg: 'No profile found!' });
            }
            profile.cardNumber = req.body.cardNumber;
            profile.cardName = req.body.cardName;
            profile.cvv = req.body.cvv;
            profile.cardExp = req.body.cardExp;
            profile.save()
                .then(profile => {
                    console.log('user ', req.user);
                    const payload = {
                        id: req.user.id,
                        username: req.user.username,
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        email: req.user.email,
                        phone: req.user.phone,
                        lastSeen: req.user.lastSeen,
                        dateCreated: req.user.dateCreated,
                        balance: profile.balance,
                        totalEarnings: profile.totalEarnings,
                        gamesPlayed: profile.gamesPlayed,
                        rank: profile.rank,
                        wins: profile.wins,
                        losses: profile.losses,
                        bank: profile.bank,
                        accountName: profile.accountName,
                        accountNumber: profile.accountNumber,
                        cardName: profile.cardName,
                        cardNumber: profile.cardNumber,
                        cvv: profile.cvv,
                        cardExp: profile.cardExp
                    };
                    jwt.sign(payload, keys.secretOrKey, { expiresIn: '30 days' }, (err, token) => {
                        res.json({
                            ...payload,
                            success: 'Card added Successfully',
                            token: `Bearer ${token}`
                        });
                    });
                })
                .catch(err => console.log(err));
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: 'Something went wrong.' });
        });
});

// add User Bank Details
// @route POST /api/users/addBank
// @desc Add Bank user bank account details
// @access Private
router.post('/addBank', passport.authenticate('jwt', { session: false }), (req, res) => {
    console.log(req.body);
    Profile.findOne({ user: req.user._id })
        .then(profile => {
            if (!profile) {
                return res.status(404).json({ msg: 'No profile found!' });
            }
            profile.accountName = req.body.accountName;
            profile.accountNumber = req.body.accountNumber;
            profile.bank = req.body.bank;
            profile.save()
                .then(profile => {
                    console.log('user ', req.user);
                    const payload = {
                        id: req.user.id,
                        username: req.user.username,
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        email: req.user.email,
                        phone: req.user.phone,
                        lastSeen: req.user.lastSeen,
                        dateCreated: req.user.dateCreated,
                        balance: profile.balance,
                        totalEarnings: profile.totalEarnings,
                        gamesPlayed: profile.gamesPlayed,
                        rank: profile.rank,
                        wins: profile.wins,
                        losses: profile.losses,
                        bank: profile.bank,
                        accountName: profile.accountName,
                        accountNumber: profile.accountNumber,
                        cardName: profile.cardName,
                        cardNumber: profile.cardNumber,
                        cvv: profile.cvv,
                        cardExp: profile.cardExp
                    };
                    jwt.sign(payload, keys.secretOrKey, { expiresIn: '30 days' }, (err, token) => {
                        res.json({
                            ...payload,
                            success: 'Bank added Successfully',
                            token: `Bearer ${token}`
                        });
                    });
                })
                .catch(err => console.log(err));
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: 'Something went wrong.' });
        });
});

// funds user account
// @route POST /api/users/fundAccount
// @desc Add funds to user account
// @access Private
router.post('/fundAccount', passport.authenticate('jwt', { session: false }), (req, res) => {
    const publicKey = 'FLWPUBK-1a0620ce92aeed540c4de14424668caf-X';
    const secret = 'FLWSECK-4d3a45d7786963cbb688f9265b3eca67-X';
    const encryptionKey = '4d3a45d77869397ffdbb1b3b';
    const merchantID = '3017378';

    const customer = req.body;
    // Authenticate Library with test public_key and test secret_key
    // const rave = new Ravepay(publicKey, secret, false);
    // rave.Card.charge({
    //     "cardno": customer.cardNumber,
    //     "cvv": customer.cvv,
    //     "expirymonth": customer.expiryMonth,
    //     "expiryyear": customer.expiryYear,
    //     "currency": "NGN",
    //     "country": "NG",
    //     "amount": customer.amount,
    //     "email": customer.email,
    //     "phonenumber": customer.phone,
    //     "firstname": customer.firstName,
    //     "lastname": customer.lastName,
    //     "IP": "355426087298442",
    //     "txRef": "MC-" + Date.now(),// your unique merchant reference
    //     "meta": [{metaname: "flightID", metavalue: "123949494DC"}],
    //     "redirect_url": "https://rave-webhook.herokuapp.com/receivepayment"
    // })
    // .then(paymentResponse => {
    //     console.log(paymentResponse.body);
    //     rave.Card.validate({
    //         "transaction_reference":resp.body.data.flwRef,
    //         "otp":12345
    //     }).then(response => {
    //         console.log(response.body.data.tx);
            
    //     })
    // })
    // .catch(err => console.log(err));
    
});

module.exports = router;