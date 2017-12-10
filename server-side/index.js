var express = require('express');
var app = express();
var session = require('express-session');
var path = require('path');
var routes = require('./api.js');

//configure the app to use body-parser to ensure json format across all api calls
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({secret:'Comp426FinalProject', resave: false, saveUninitialized: true}));

//Set static directories to serve to client
app.use(express.static(path.join(__dirname + '/../client-side/')));
app.use('/css', express.static(__dirname + '/../client-side/css'));
app.use('/javascript', express.static(__dirname + '/../client-side/javascript'));
app.use('/images', express.static(__dirname + '/../client-side/images'))

//use the routes file to handle all apis for the app
app.use('/', routes);

//the app will listen on port 3000
app.listen(3000, function () {
    console.log('App listening on port 3000!');
});
