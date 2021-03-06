var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt');
var pug = require('pug');


app.use(cookieParser());
app.use(session({
    secret: 'saladus',
    resave: true,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));


app.set('views', './views');
app.set('view engine', 'pug');


var Sequelize = require('sequelize');
var db = new Sequelize('postgres://' + process.env.POSTGRES_USER + ':' + process.env.POSTGRES_PASSWORD + '@localhost/postgres');


//Define tables
db.sync()

var User = db.define('user', {
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,
});

var Post = db.define('post', {
    title: Sequelize.STRING,
    body: Sequelize.STRING,
});

var Comment = db.define('comment', {
    body: Sequelize.STRING,
});


//Create connections between tables
User.hasMany(Post);
User.hasMany(Comment);

Post.belongsTo(User);
Post.hasMany(Comment);

Comment.belongsTo(User);
Comment.belongsTo(Post);


//Homepage
app.get('/', function(req, res) {
    res.render('index')
})


//Profile page
app.get('/profile', function(req, res) {
    var user = req.session.user

    if (user === undefined) {
        res.render('login', {message: 'Please log in to view your profile'});
    } else {
        res.render('profile', {user: user});
    };
})


//Register
app.get('/register', function(req, res) {
    res.render('register')
})


app.post('/register', function(req, res) {
    var newUser = req.body.newUser
    var newEmail = req.body.newEmail
    var newPassword = req.body.newPassword

    User.sync()
    User.findOne({
        where: {
            name: newUser
        }
    })
    .then(function(user) {
        if (newUser.length === 0 || newEmail.length === 0 || newPassword.length === 0) {
            res.render('register', {message: 'Missing details, please try again'});
            return;
        };
        if (user != null && user.name === newUser) {
            res.render('register', {message: 'Username already taken, please log in or choose another username'});
            return;
        } else {
            bcrypt.hash(newPassword, null, null, function(err, hash) {
                if (err) {
                    throw err;
                } else {
                    User.create({
                        name: newUser,
                        email: newEmail,
                        password: hash
                    })
                    .then(function() {
                        res.redirect('/login');
                    });
                };
            });
        };
    });
})


//Log in
app.get('/login', function(req, res) {
    res.render('login')
})


app.post('/login', function(req, res) {
    var email = req.body.email
    var password = req.body.password

    if (email.length === 0 || password.length === 0) {
        res.render('login', {message: 'Username or password missing'});
        return;
    };

    User.findOne({
        where: {
            email: email
        } 
    })
    .then (function(user) {
        if(user == null) {
            res.render('login', {message: 'User not in the system, please register'});
            return;  
        }
        else {
            var hash = user.password
            bcrypt.compare(password, hash, function(err, result) {
                if (err) {
                    res.render('login', {message: 'Invalid email or password, please try again or register'});
                }
                if(result === true) {
                    req.session.user = user;
                    res.redirect('/profile');
                }
                else {
                    res.render('login', {message: 'Something went wrong, please try again or register'});
                };
            });
        };
    });
})


//Log out 
app.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            throw err;
        }
        res.render('index', {message: "Successfully logged out"});
    });
})


//Create a post 
app.get('/posts', function(req, res){
    var user = req.session.user
    
    if (user === undefined) {
        res.render('login', {message:'Please log in'});  
    }
    else {
        res.render('posts');
    };
})


app.post('/posts', function(req, res){
    var user = req.session.user
    var title = req.body.title
    var body = req.body.body
    
    if (user === undefined) {
        res.render('login', {message:'Please log in'});  
    }
    else {
        Post.create({
            title: title,
            body: body,
            userId: user.id
        })
        .then (function(posts) {
            res.redirect('/myposts')
        });
    };
})


//See posts from the logged in user
app.get('/myposts', function(req, res){
    var user = req.session.user
    
    if (user === undefined) {
        res.render('login', {message:'Please log in'});  
    }
    else {
        Post.findAll({
            where: {
            userId: user.id
        },
            include: [{
            model: User
            }]
        })
        .then (function(posts) {
            res.render('myposts', {posts: posts})
        });
    };
})


//See posts from all users
app.get('/allposts', function(req, res) {
    var user = req.session.user
    
    if (user === undefined) {
        res.render('login', {message:'Please log in'});  
    }
    else {
        Post.findAll({
            include: [{model: Comment}, {model: User}],
        })
        .then (function(posts) {
            User.findAll()
            .then (function(users) {
                res.render('allposts', {
                    posts: posts,
                    users: users
                });
            });
        });
    };
})


//Leave messages
app.post('/allposts', function(req, res) {
    var user = req.session.user
    var body = req.body.body
   
    if (user === undefined) {
        res.render('login', {
            message:'Please log in'
        });  
    }
    else {
        Comment.create({
            body: body,
            userId: user.id,
            postId: req.body.postId
        })
        .then (function(comments) {
            res.redirect('/allposts');
        });
    };
})


//Listen to the server
const server = app.listen(8000, () => {
    console.log(`server has started ${server.address().port}`)
})