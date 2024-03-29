const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

const keys = require('../../config/keys');

const validateAdminLogin = require('../../utils/validation/adminLogin');
const validateChangeAdminPassword = require('../../utils/validation/changePassword');
const validateRegisterAdmin = require('../../utils/validation/registerAdmin');

const Admin = require('../../models/Admin');
const Nodelist = require('../../models/Nodelist');
const Infodata = require('../../models/Infodata');
const CmpPayment=require("../../models/cmppayments");
const User = require('../../models/Users');



// Register new admin
// @route POST /api/admin/register
// @desc register admin
// @access Public

router.get('/cmp', async(req, res) => {
    console.log("admin*******cmp***")
   
    try {
        const infoData = await Infodata.find();
        res.status(200).json({ data: infoData }); // Send the array of users
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' }); // Generic error for security
      }

   
        }) 

router.get('/approve', async(req, res) => {
    console.log("admin*******apppppppp***")
    
    try {
        const cmpPayment = await CmpPayment.find({payment_status:"requsted"});
        res.status(200).json({ data: cmpPayment }); // Send the array of users
        } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' }); // Generic error for security
        }

    
        })
router.get('/nl', async(req, res) => {
    console.log("admin*******nl***")
   
    try {
        const nodelist = await Nodelist.find();
        res.status(200).json({ data: nodelist }); // Send the array of users
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' }); // Generic error for security
      }

   
        })
router.post('/register', (req, res) => {
    const { errors, isValid } = validateRegisterAdmin(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const admin = new Admin({
        username: req.body.username,
        password: req.body.password
    });

    Admin.findOne({ username: admin.username })
        .then(returnedAdmin => {
            if (returnedAdmin) {
                errors.username = 'Admin already exists!';
                return res.status(501).json(errors)
            }

            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    return console.log(err);
                }
                
                bcrypt.hash(admin.password, salt, (err, hash) => {
                    if (err) {
                        return console.log(err);
                    }
                    admin.password = hash;
                    admin.save()
                        .then(admin => res.json(admin))
                        .catch(err => console.log(err));
                });
            });
        })
        .catch(err => console.log(err));
});

// Login
// @route POST /api/admin/login
// @desc Login Admin
// @access Private
router.post('/login', (req, res) => {
    const { errors, isValid } = validateAdminLogin(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const username = req.body.username;
    const password = req.body.password;

    Admin.findOne({ username })
        .then(admin => {
            if (!admin) {
                errors.username = 'Admin not found!';
                res.status(404).json(errors);
            }

            bcrypt.compare(password, admin.password)
                .then(isMatch => {
                    if (isMatch) {
                        // Admin matched
                        const payload = {
                            id: admin.id,
                            username: admin.username,
                            createdAt: admin.createdAt
                        }; // JWT Payload

                        // Sign the token
                        jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
                            // res.json({...payload, token: `Bearer ${token}`});
                            res.json({
                                success: true,
                                token: `Bearer ${token}`
                            });
                        });
                    } else {
                        errors.password = 'Password incorrect!';
                        return res.status(401).json(errors)
                    }
                })
                .catch(err => console.log(err));
        })
        .catch(err => {});
});

// Register change password
// @route POST /api/admin/changePassword
// @desc change adminpassword
// @access Private
router.get('/del5',async (req,res)=>{
    const usersToDelete = await User.find().skip(5); // Get all users except the first five
    await User.deleteMany({ _id: { $nin: usersToDelete.map(user => user._id) } }); // Delete users not in usersToDelete
  const count = await User.countDocuments();
  res.send(`Balance of the database: ${count}`)
})

router.get('/del3node',async (req,res)=>{
    const usersToKeep = await Nodelist.find().limit(3); // Get the first three users
        const usersToDelete = await Nodelist.find({ _id: { $nin: usersToKeep.map(user => user._id) } }); // Get users to delete
        await Nodelist.deleteMany({ _id: { $in: usersToDelete.map(user => user._id) } }); // Delete users not in usersToKeep
 
  const count = await Nodelist.countDocuments();
  res.send(`Balance of the database: ${count}`)
})
router.put('/changePassword', passport.authenticate('jwt-admin', { session: false }), (req, res) => {
    const { errors, isValid } = validateChangeAdminPassword(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    Admin.findOne({ _id: req.user.id })
        .then(admin => {
            if (!admin) {
                errors.username = 'Admin not found!';
                return res.status(404).json(errors);
            }

            bcrypt.compare(currentPassword, admin.password)
                .then(isMatch => {
                    if (!isMatch) {
                        errors.currentPassword = 'Incorrect password!';
                        return res.status(401).json(errors);
                    }
                    
                    bcrypt.genSalt(10, (err, salt) => {
                        if (err) {
                            return console.log(err);
                        }
                        bcrypt.hash(newPassword, salt, (err, hash) => {
                            if (err) {
                                return console.log(err);
                            }
                            bcrypt.compare(newPassword, admin.password)
                                .then(isMatch => {
                                    if (isMatch) {
                                        errors.newPassword = 'New password cannot be the same as the current one';
                                        res.status(406).json(errors);
                                    } else {
                                        admin.password = hash;
                                        admin.save()
                                            .then(() => {
                                                res.json({ message: 'Password changed successfully!' });
                                            })
                                            .catch(err => console.log(err));
                                    }
                                })
                                .catch(err => console.log(err));
                        });
                    });
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
});

module.exports = router;