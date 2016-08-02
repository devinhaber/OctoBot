var config = require('./config.json');
var dbmanage = require('./dbmanage.js');
var bot = require('./app.js');
var bodyParser = require('body-parser');
var disk = require('diskusage');

var express = require('express')
var app = express()

var mustacheExpress = require('mustache-express')
app.engine('mustache', mustacheExpress());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.set('view engine', 'mustache');

app.get('/', (req, res) => {
    disk.check('/', (err, info) => {
        if (err) {
            console.log(err);
            res.render('index', {"free": "ERR", "remaining": "ERR"});
        } else {
            res.render('index', {"free": info.free / 1000000, "total": info.total / 1000000});
        }
    })
})

app.post('/', (req, res) => {
    dbmanage.checkAuth(req, (val) => {
        if (val == true) {
            res.send('Accepted')
        } else {
            res.status(403).end();
        }
    })
})

app.listen(80);
