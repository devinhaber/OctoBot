# OctoBot

A quick discord bot written in node. Comes with a control panel written using express.

# Features

Currently the bot can:
1. Play sounds from local directory
2. Preserve roles in a discord server
3. Play youtube videos, and save them
4. Take randomly selected images from an imgur album, and post them

# Requirements

Most requirements can be installed via `npm install`. 
In particular, [Discord.js](http://discordjs.readthedocs.io/en/latest/installing.html) will require Python 2.7 and on Windows, Visual Studio.
You will also have to install [FFMPEG](https://ffmpeg.org/download.html) and some form of relational DB.

# Running

Simply use `node octobot` to run the bot. To only run the bot portion and not the control panel website, use `node app` instead.

# Configuration

The bot currently reads settings from a file called `config.json`. You should include this file in the same directory as the bot. `config.json` requires the following properties:
```
"token": Your discord bot token.
"helpMessage": A message to display when someone types !help.
"volume": Global volume setting for all sounds.
"playingGame": The display name for the Discord "currently playing".
"sessionSecret": Secret key used by express-session to sign session cookies 
"username": Username for bot control panel - hardcoded in config for ease of use
"password": Password for bot control panel - again, for small personal project, no need to secure pass
"album": The album hash to access for the !smug command
"clientID": Your imgur API client ID
```
