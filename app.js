var Discord = require('discord.js');
var config = require('./config.json');
var orm = require('orm');
var dbmanage = require('./dbmanage.js');
var ytdl = require('ytdl-core');
var fs = require('fs')

var bot = new Discord.Client({autoReconnect: true});

var disk = require('diskusage');

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
    } else if (cmd.content.substring(0,8) == '!youtube') {
        bot.joinVoiceChannel(cmd.author.voiceChannel, (err,connection) => {
            if (err) {console.log(err)};
            ytdl(cmd.content.substring(9), { filter: function(format) { return format.container === 'mp4' && !format.encoding; } }).pipe(fs.createWriteStream('./sounds/temp.mp3'))
            .on('finish', () => {
                connection.playFile('./sounds/temp.mp3', {'volume': config.volume}, (err, intent) => {
                    intent.on('end', () => {connection.destroy()});
                })
            })
            })
    } else if (cmd.content == '!sounds') {
        fs.readdir('./sounds', (err, files) => {
            if (err) {console.log(err)} else {
                bot.sendMessage(cmd, files.toString(), (err, msg) => {return;});
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

bot.loginWithToken(config.token)

exports.logout = () => {
    bot.logout((err) => {
        if (err) console.log(err);
    })
}

exports.login = () => {
    bot.loginWithToken(config.token)
}
