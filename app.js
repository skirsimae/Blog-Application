var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

app.use(cookieParser());
app.use(session({
	secret: 'saladus', 
	resave: true,
	saveUninitialized: false
}));
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', './views');
app.set('view engine', 'pug');

app.use(express.static('./public/css'))

var Sequelize = require('sequelize');
var sequelize = new Sequelize('postgres://' + process.env.POSTGRES_USER + ':' + process.env.POSTGRES_PASSWORD + '@localhost/postgres');

sequelize.sync()
var User = sequelize.define('user', {
    name: {
        type:Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: Sequelize. STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: Sequelize.STRING,
    },
});


app.get('/home', function (req, res) {
    res.render('index', {
        message: req.query.message,
        user: req.session.user
    });
});


app.get('/profile', function(req, res){
    var user = req.session.user;

    if (user === undefined) {
        res.render('login', {
            message: 'Please log in to view your profile.',
        });
    } else {
        User.findAll({
            where: {
                name: user.name
            },
        }).then(() => {
            res.render('profile', {
                user: user
            });
        });
    };
});


//Create a blogging application that allows users to register an account.
app.get('/register', function(req, res) {
	res.render('register')
});


app.post('/register', function(req,res) {
    var newUser = req.body.newUser
    var newEmail = req.body.newEmail
    var newPassword = req.body.newPassword

    if(newUser === 0 || newEmail === 0 || newPassword === 0) {
        res.render('register', {
            message:'Missing details, please try again.'
        });
    };
    // if(user.name === newUser) {
    //     res.render('register', {
    //         message:'Username already exists, please log in or choose another username'
    //     });
    // };
    if(newUser !== 0 && newEmail !== 0 && newPassword !== 0){
        User.create({
            name: newUser,
            email: newEmail,
            password: newPassword,
        }).then(function(user) {
            req.session.user = user;
            res.redirect('profile')
        });
    };
})

//Create a blogging application that allows users to login.
app.get('/login', function (req, res){
    res.render('login');
});


app.post('/login', function (req, res){
    var loginEmail = req.body.loginEmail;
    var loginPassword = req.body.loginPassword;

    if(loginEmail.length === 0){
        res.render('login', {
            message:'Please fill out your username.'
        });
        return;
    }
    if(loginPassword.length === 0){
        res.redirect('login', {
            message:'Please fill out your password.'});
        return;
    }
    User.findOne({
        where: {
            email: loginEmail
    }
    }).then(function(user){
        if(user !== null && loginPassword == user.password) {
            req.session.user = user;
            res.redirect('/profile');
        } else {
            res.render('login', {
                message:'Invalid email or password.'
            });  
        }
    });
});


//Create a blogging application that allows users to log out.

app.get('/logout', function (req, res){
    req.session.destroy(function(err){
        if(err){
            throw err;
        }
        res.render('index', {
            message: "Successfully logged out."
        });
    });
});


const server = app.listen(8080, () => {
    console.log(`server has started ${server.address().port}`)
})