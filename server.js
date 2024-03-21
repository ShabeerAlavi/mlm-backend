// app.js
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const fileUpload = require('express-fileupload');
// const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { database_URI } = require('./config/keys');

const admin = require('./routes/api/admin');
const profile = require('./routes/api/profile');
const quiz = require('./routes/api/quiz');
const users = require('./routes/api/users');

const app = express();

const publicPath = path.resolve(__dirname, 'client', 'build');

const PORT = process.env.PORT || 5000;

mongoose.connect(database_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Database Connected!'))
.catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport config
require('./config/passport');

// Multer configuration
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, path.join(__dirname, 'uploads'));
//     },
//     filename: function (req, file, cb) {
//         const userId = req.body.userId;
//         cb(null, userId + ".png");
//     }
// });

// const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());

// Static files
app.use(express.static(publicPath));

// Enable CORS
app.use(cors());

// Routes
app.use('/api/admin', admin);
app.use('/api/profile', profile);
app.use('/api/quiz', quiz);
app.use('/api/users', users);
app.use('/uploads', express.static(path.join(__dirname, 'routes', 'uploads')));

// Example route
app.get('/', (req, res) => {
    res.send({
        message: 'Hello World!'
    });
});

// Start server
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));

module.exports = { app, server };
