var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

app.use(cookieParser());
app.use(session({
	secret: 'mina ei tea mis siia kirjutada', 
	resave: true,
	saveUninitialized: false
}));
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', './views');
app.set('view engine', 'pug');

var Sequelize = require('sequelize');
var sequelize = new Sequelize('postgres://' + process.env.POSTGRES_USER + ':' + process.env.POSTGRES_PASSWORD + '@localhost/postgres');


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


app.get('/', function (req, res) {
    res.render('index', {
        message: req.query.message,
        user: req.session.user
    });
});


app.get('/profile', function (req, res) {
    var user = req.session.user;
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
    } else {
        res.render('profile', {
            user: user
        });
    }
});

//Create a blogging application that allows users to register an account.
app.set('views', './views');
app.set('view engine', 'pug');

app.get('/register', function(req, res) {
	res.render('register')
});


app.post('/register', function(req,res) {
    sequelize.sync()
    .then(function() {
        User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        }).then(function(user) {
            if(!req.body.name || !req.body.email || !req.body.password) {
                res.send('Invalid details!');
            }
            else if (user.name === req.body.name) {
                res.render('register', {message:'user already exists, please login or choose another username'});
            }
            res.redirect('profile');
        });
    });
});


//Create a blogging application that allows users to login.
app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', function (req, res) {
    var name = req.body.name;
    var password = req.body.password;

    if(req.body.name.length === 0) {
        res.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
        return;
    }

    if(req.body.password.length === 0) {
        res.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
        return;
    }

    User.findOne({
        where: {
            name: req.body.name
        }
    }).then (function(user) {
        if(user !== 0 && req.body.password === user.password) {
        req.session.user = user;
        res.redirect('/profile');
        } else {
            res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
        }
    }), function (error) {
        response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
    };
});


//Create a blogging application that allows users to log out.

app.get('/logout', function (req, res) {
    req.session.destroy(function(error) {
        if(error) {
            throw error;
        }
        res.redirect('/login?message=' + encodeURIComponent("Successfully logged out."));
    });
});


const server = app.listen(8080, () => {
    console.log(`server has started ${server.address().port}`)
})