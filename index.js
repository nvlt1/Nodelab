const express = require('express');
require('dotenv').config();
const session = require('express-session');
const bcrypt = require('bcrypt');
const saltRounds = 12;
const MongoStore = require('connect-mongo');
const port = process.env.PORT || 3000;
const app = express();
const expireTime = 60 * 60 * 1000 // expires after 1 hour (hours * minutes * seconds * milliseconds)

app.use(express.urlencoded({extended: false}))
// users and passwords (in memory 'database)
var users = [];


/* secret information section*/
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section*/

var mongoStore = MongoStore.create({
    // need to give admin privileges and ensure the correct user and password.
	mongoUrl : `mongodb+srv://${mongodb_user}:${mongodb_password}@atlascluster.oqysggr.mongodb.net/?retryWrites=true&w=majority`,
    crypto: {
        secret: mongodb_session_secret
    }
})
console.log(mongodb_user, mongodb_password, mongodb_session_secret, node_session_secret);
app.use(session({
    secret: node_session_secret,
    store: mongoStore, // default is memory store
    saveUninitialized: false,
    resave: true
}));


app.get('/', (req, res) => {
    if (req.session.authenticated){
        var html = `
        <form action='/temp' method='post>
        <button>Go to Members Area</button>
        </form>
        <form action='/logout' method='post>
        <button>Logout</button> 
        </form> 
        `;
        res.send(html);
    } else{
        var html = `
        <form action='/signup' method= 'get'>
        <button>Sign up</button>
        </form>
        <form action='/login' method='post'>
        <button>Log in</button>
        </form>
        `;
        res.send(html);
    }
    // var html = `
    // <form action='/signup' method= 'get'>
    // <button>Sign up</button>
    // </form>
    // <form action='/login' method='post'>
    // <button>Log in</button>
    // </form>
    // `;
    // res.send(html);
});

app.get('/signup', (req, res) => {
    var missingUsername = req.query.missing;
    var missingEmail = req.query.missing;
    var missingPassword = req.query.missing;
    var html = `
    create user
    <form action='/submitUser' method= 'post'>
    <input name='username' type='text' placeholder='name'>
    <br>
    <input name='email' type='text' placeholder='email'>
    <br>
    <input name='password' type='text' placeholder='password'>
    <br>
    <button>Submit</button>
    </form>
    `;
    if (missingUsername) {
        html += "<br> name is required";
    }
    if (missingEmail) {
        html += "<br> email is required";
    }
    if (missingPassword) {
        html += "<br> password is required";
    }
    res.send(html);
});

app.get('/members', (req, res) => {
    if (req.session.authenticated){

        var html = `
        Hello, ${req.session.username}
        <br>
        "Meme1: <img src='/meme1.png' style='width:250px'>"
        <br>
        "Meme2: <img src='/meme2.png' style='width:250px'>"
        <form action='/logout' method='post'>
        <button>Signout</button>
        </form>
        `;
        res.send(html);

    }
    if (!req.session.authenticated){
        var html = `
        Log in first!
        <form action='/' method='get'>
        <button>go back</button>
        </form>
        `;
        res.send(html);
    }
});

app.post('/logout', (req, res) => {
    req.session.authenticated = false;
    res.redirect('/');
});

app.post('/submitUser', (req, res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    if (!username){
        res.redirect('/signup?missing=1');
    }
    if (!email) {
        res.redirect('/signup?missing=2');
    }
    if (!password){
        res.redirect('/signup?missing=3');
    }

    var hashedPassword = bcrypt.hashSync(password, saltRounds);

    users.push({ username: username, email: email , password: hashedPassword });

    console.log(users);

    var usershtml = "";
    for (i = 0; i < users.length; i++) {
        usershtml += "<li>" + users[i].username + ": " + users[i].email + 
        ": " + users[i].password + "</li>";
    }
    res.redirect('/members');
})

app.post('/loggingin', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    var usershtml = "";
    for (i = 0; i < users.length; i++) {
        if (users[i].username == username) {
            if (bcrypt.compareSync(password, users[i].password)) {
                req.session.authenticated= true;
                req.session.username = username;
                req.session.cookie.maxAge = expireTime;

                res.redirect('/members');
                return;
            }
        }
    }
    
    // user and password combination not found
    // res.redirect('/loggedin');
    res.redirect('/login');
});

app.post('/login', (req, res) => {
    var html = `
    log in
    <form action='/loggingin' method='post'>
    <input name='username' type='text' placeholder='username'>
    <br>
    <input name='password' type='text' placeholder='password'>
    <br>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});


app.use(express.static(__dirname + "/public"));


app.get("*", (req,res) => {
    res.status(404);
    res.send("Page not found - 404");
})

app.listen(port, (req, res) => {
    console.log("Node application listening on port " + port);
});


