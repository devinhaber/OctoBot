var Discord = require('discord.js');
var config = require('./config.json');
var orm = require('orm');
var dbmanage = require('./dbmanage.js')

var bot = new Discord.Client({autoReconnect: true});

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
        playFile(cmd.author.voiceChannel, cmd.content.substring(6));
    } else if (cmd.content == '!stop') {
        if (bot.voiceConnection) {
            bot.voiceConnection.destroy();
        }
    } else if (cmd.content.substring(0,9) == "!register") {
        if (config.DEV == true) {
            bot.sendMessage(cmd, "WARNING: Bot is currently in a dev environment - any DB changes will not be carried to production", (err) => {});
        }
        if (cmd.content.substring(10,14) == "user") {
            registerUser(cmd);
        }
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

function registerUser(creator) {
    userInfo = {}
    bot.awaitResponse(creator, "Welcome to user registration. Please enter all info except for names in lower case. First, enter a character name", (err,msg) => {
        userInfo.name = msg.content
        bot.awaitResponse(creator, "Enter the following info, seperated by spaces. Values requiring spaces should use underscores: Realm, Faction, Class, Race, Role", (err, msg) => {
            info = msg.content.split(" ")
            userInfo.realm = info[0]
            userInfo.faction = info[1]
            userInfo.class = info[2]
            userInfo.race = info[3]
            userInfo.role = info[4]
            console.log(userInfo)
            dbmanage.registerRaider(userInfo, (err) => {
                if (err) {console.log(err)
                }
                else {
                    bot.sendMessage(creator, "Registration complete!");
                }
            });
        });
    });
}

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
