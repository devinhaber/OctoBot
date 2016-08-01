var Discord = require('discord.js');
var config = require('./config.json');
var orm = require('orm');
var dbmanage = require('./dbmanage.js');
var bodyParser = require('body-parser');

var bot = new Discord.Client({autoReconnect: true});

var disk = require('diskusage');

var express = require('express')
var app = express()

var mustacheExpress = require('mustache-express')
app.engine('mustache', mustacheExpress());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.set('view engine', 'mustache');

var users = {}

function playFile(channel, filename) {
    if (channel == null || filename == '') {
        return;
    } else {
        bot.joinVoiceChannel(channel, (err, connection) => {
            console.log('joining channel ' + channel.name)
            path = './sounds/' + filename + '.mp3' //More file formats coming in the future!
            options = 
            {
                'volume': config.volume
            }
            connection.playFile(path, options, (err, intent) => {
                intent.on('end', () => {connection.destroy()});
                if (err) {
                    console.log(err)
                }
            })
        })
    }
}
function executeMessage(cmd) {
    if (cmd.content == '!help') {
        bot.sendMessage(cmd, config.helpMessage, (err, msg) => {return;});
    } else if (cmd.content.substring(0,5) == "!play") {
        console.log(cmd.author + "playing sound" + cmd.content.substring(6));
        playFile(cmd.author.voiceChannel, cmd.content.substring(6));
    } else if (cmd.content == '!stop') {
        if (bot.voiceConnection) {
            bot.voiceConnection.destroy();
        }
    } else if (cmd.content == '!remaining') {
        // Probably won't work on windows. Whatever
        disk.check('/', (err, info) => {
            if (err) {console.log(err);}
            else {
                bot.sendMessage(cmd, info.free + ' space free out of ' + info.total + ' total.', (err, msg) => {});
            }
        })
    }
}
function processMessage(msg) {
    if (msg.content.substring(0,1) == '!') {
        //for (user in config.authorizedUsers) {
            //for (i = 0; i < config.authorizedUsers.length; i++) {
                //if (config.authorizedUsers[i] == msg.author.username) {
                    executeMessage(msg);
                    return;
                //}
            //}
        //}
         
    }
}

bot.on("message", msg => {
    processMessage(msg);})

bot.on("ready", () => {
    //Update for funny game message
    bot.setPlayingGame(config.playingGame, (err) => {if (err) {console.log(err);}})
    //On joining, store everyones roles for usage
    for (i=0;i<bot.servers.length;i++) {
        server = bot.servers[i];
        for (mem in server.memberMap) {
            users[server.name + mem] = server.memberMap[mem]['roles'];
        }
    }
    orm.connect(config.DBConnection, (err, db) => {
        if (err) throw err;
        dbmanage.setSchema(orm, db);
    })
})

bot.on("serverMemberUpdated", (server, newUser, oldUser) => {
    //Whenever a user is modified, update his roles
    users[server.name + newUser.id] = server.rolesOfUser(newUser);
})

bot.on("serverNewMember", (server, user) => {
    //If a user is added, change his roles to the cached version
    found = false;
    for (prop in users) {
        if ((server.name + user.id) == prop) {
            roles = users[server.name + user.id];
            bot.addUserToRole(user, roles, (err) => {if (err) {console.log(err);}});
            found = true;
        }
    }
    //If we can't find the cached version, then we store their roles
    if (!found) {
        users[server.name + user.id] = server.rolesOfUser(user)
    }
})

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

bot.loginWithToken(config.token)
