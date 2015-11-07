var express = require('express');
var app = express();
var port = process.env.PORT || 8080;

var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');


app.use(cookieParser('what'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: 'what', resave: true, saveUninitialized: true}));

app.use(require('./controllers/main.js')());

app.listen(port);
console.log('Port: ' + port);