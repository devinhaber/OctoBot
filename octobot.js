var config = require('./config.json');
var bot = require('./app.js');
var bodyParser = require('body-parser');
var disk = require('diskusage');
var session = require('express-session')
var multer = require('multer')

const maxFileSize = 10 * 1000 * 1000 // 10 MB

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './sounds')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

//This should cover any browser diffs with mp3 files
mimetypes = ['audio/mp3', 'audio/mpeg', 'audio/x-mpeg-3', 'video/mpeg', 'video/x-mpeg' ]
function filtertype(req, file, cb) {
    for (i in mimetypes) {
        if (file.mimetype == mimetypes[i]) {
            cb(null, true)
        }
    }
    cb(null, false)
}

var limits = {fileSize: maxFileSize}

var upload = multer({fileFilter: filtertype, storage: storage, limits: limits})
var express = require('express')
var app = express()

var mustacheExpress = require('mustache-express')
app.engine('mustache', mustacheExpress());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.set('view engine', 'mustache');
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true
}))

app.get('/', (req, res) => {
    disk.check('/', (err, info) => {
        if (err) {
            console.log(err);
            res.render('main', {"free": "ERR", "total": "ERR", "pctFree": "ERR"})
        } else {
            // Poor auth happening here - not a priority for this small, personal use project
            if (req.session.authed == true) {
                res.render('main', {
                        "free": (info.free / 1000000).toFixed(1),
                        "total": (info.total / 1000000).toFixed(1),
                        "pctFree": (((info.free) / (info.total)) * 100).toFixed()
                    })
            } else {
                res.render('index');
        }}
    })
})

app.get('/logout', (req,res) => {
    if (req.session && req.session.authed == true) {
        bot.logout();
        res.redirect('/')
    } else {
        res.render('index')
    }
})

app.get('/login', (req,res) => {
    if (req.session && req.session.authed == true) {
        bot.login();
        res.redirect('/')
    } else {
        res.render('index')
    }
})

app.post('/', (req, res) => {
    if (req.body.username == config.username && req.body.password == config.password){
        req.session.authed = true
        res.redirect('/')
    } else {
        req.session.authed = false
        res.render('index')
    }
})

app.post('/upload', upload.single('sound'), (req, res, next) => {
    if (req.file) {
        res.send('Success! File ' + req.file.originalname + ' uploaded!')
    } else {
        res.send('Failure! File not uploaded. Please ensure that the file is valid')
    }
})

app.listen(80);
