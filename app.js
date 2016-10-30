var Discord = require('discord.js');
var config = require('./config.json');
var orm = require('orm');
var dbmanage = require('./dbmanage.js');
var ytdl = require('ytdl-core');
var fs = require('fs')

var bot = new Discord.Client();

var disk = require('diskusage');

var users = {}

function playFile(channel, filename) {
    if (channel == null || filename == '') {
        return;
    } else {
        channel.join(channel).then((connection) => {
            console.log('joining channel ' + channel.name)
            const path = './sounds/' + filename + '.mp3' //More file formats coming in the future!
            const options = 
            {
                'volume': config.volume
            }
            const dispatcher = connection.playFile(path, options);
            dispatcher.on('end', () => {connection.disconnect()});
        })
    }
}

function executeMessage(cmd) {
    if (cmd.content == '!help') {
        cmd.channel.sendMessage(config.helpMessage);
    } else if (cmd.content.substring(0,5) == "!play") {
        console.log(cmd.author + "playing sound" + cmd.content.substring(6));
        cmd.guild.fetchMember(cmd.author).then((member) => {
            playFile(member.voiceChannel, cmd.content.substring(6));
        })
    } else if (cmd.content == '!stop') {
        bot.voiceConnections.every((connection) => {
            connection.disconnect();
        });
    } else if (cmd.content == '!remaining') {
        // Probably won't work on windows. Whatever
        disk.check('/', (err, info) => {
            if (err) {console.log(err);}
            else {
                cmd.channel.sendMessage(info.free + ' space free out of ' + info.total + ' total.');
            }
        })
    } else if (cmd.content.substring(0,8) == '!youtube') {
        cmd.guild.fetchMember(cmd.author).then((member) => {
            member.voiceChannel.join(cmd.author.voiceChannel).then((connection) => {
                ytdl(cmd.content.substring(9), { filter: function(format) { return format.container === 'mp4' && !format.encoding; } }).pipe(fs.createWriteStream('./sounds/temp.mp3')).on('finish', () => {
                    dispatcher = connection.playFile('./sounds/temp.mp3', {'volume': config.volume});
                    dispatcher.on('end', () => {connection.disconnect()});
                });
            });
        });
    } else if (cmd.content == '!sounds') {
        fs.readdir('./sounds', (err, files) => {
            if (err) {console.log(err)} else {
                cmd.channel.sendMessage(files.toString());
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
    processMessage(msg);
})

bot.on("ready", () => {
    //Update for funny game message
    //TODO: do that
    //On joining, store everyones roles for usage
    bot.guilds.every((guild) => {
        if (guild.available) {
            guild.members.every((member, index) => {
                users[member.id + guild.id] = member.roles;
            }) 
        }
    })
    //orm.connect(config.DBConnection, (err, db) => {
    //    if (err) throw err;
    //    dbmanage.setSchema(orm, db);
    //})
})

bot.on("guildMemberUpdate", (oldMember, newMember) => {
    //Whenever a user is modified, update his roles
    users[newMember.id + newMember.guild.id] = newMember.roles;
})

bot.on("guildMemberAdd", (member) => {
    //If a user is added, change his roles to the cached version
    found = false;
    for (prop in users) {
        if ((member.id + member.guild.id) == prop) {
            member.setRoles(user[member.id + member.build.id]);
            found = true;
        }
    }
    //If we can't find the cached version, then we store their roles
    if (!found) {
        users[member.id + member.guild.id] = member.roles;
    }
})

bot.login(config.token);

exports.logout = () => {
    bot.destroy();
}

exports.login = () => {
    bot = new Discord.client();
    bot.login(config.token);
}
