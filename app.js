var Discord = require('discord.js');
var config = require('./config.json');
var ytdl = require('ytdl-core');
var fs = require('fs')

var bot = new Discord.Client();

var disk = require('diskusage');

var users = {}

var currentlyplaying = false;

function playFile(channel, filename) {
    if (channel == null || filename == '' || currentlyplaying == true) {
        return;
    } else {
        currentlyplaying = true;
        channel.join(channel).then((connection) => {
            console.log('joining channel ' + channel.name +", and playing sound " + filename)
            const path = './sounds/' + filename + '.mp3' //More file formats coming in the future!
            const options = 
            {
                'volume': config.volume
            }
            const dispatcher = connection.playFile(path, options);
            dispatcher.once('end', () => {currentlyplaying = false; connection.disconnect()});
        })
    }
}

function executeMessage(cmd) {
    if (cmd.content == '!help') {
        cmd.channel.sendMessage(config.helpMessage);
    } else if (cmd.content.substring(0,5) == "!play") {
        cmd.guild.fetchMember(cmd.author).then((member) => {
            playFile(member.voiceChannel, cmd.content.substring(6));
        })
    } else if (cmd.content == '!stop') {
        console.log("Stopping bot playback")
        currentlyplaying = false;
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
        var args = cmd.content.split(" ")
        if (args.length >= 4 && args[1] == "save") {
            console.log("Saving video at url " + args[2] + " as " + args[3])
            ytdl(args[2], { filter: function(format) { return format.container === 'mp4' && !format.encoding; } }).pipe(fs.createWriteStream('./sounds/' + args[3] + '.mp3'));
            return;
        }
        if (args.length >= 2 && currentlyplaying == false) {
            currentlyplaying = true;
            cmd.guild.fetchMember(cmd.author).then((member) => {
                member.voiceChannel.join(cmd.author.voiceChannel).then((connection) => {
                    console.log("Playing video at url " + cmd.content.substring(9) + " in channel " + cmd.author.voiceChannel.name)
                    ytdl(cmd.content.substring(9), { filter: function(format) { return format.container === 'mp4' && !format.encoding; } }).pipe(fs.createWriteStream('./sounds/temp.mp3')).on('finish', () => {
                        dispatcher = connection.playFile('./sounds/temp.mp3', {'volume': config.volume});
                        dispatcher.once('end', () => {currentlyplaying = false; connection.disconnect()});
                    });
                });
            });
        } 
    } else if (cmd.content == '!sounds') {
            fs.readdir('./sounds', (err, files) => {
                if (err) {console.log(err)} else {
                    cmd.channel.sendMessage(files.join(", "));
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
