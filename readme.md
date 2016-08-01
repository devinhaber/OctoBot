# OctoBot

A quick discord bot written in node. 

# Features

Currently the bot can:
1. Play sounds from local directory
2. Preserve roles in a discord server
3. (Soon) Register WoW raids and schedule them

# Requirements

Most requirements can be installed via `npm install`. 
In particular, [Discord.js](http://discordjs.readthedocs.io/en/latest/installing.html) will require Python 2.7 and on Windows, Visual Studio.
You will also have to install [FFMPEG](https://ffmpeg.org/download.html) and some form of relational DB.

# Configuration

The bot currently reads settings from a file called `config.json`. You should include this file in the same directory as the bot. `config.json` requires the following properties:
```
"token": Your discord bot token.
"helpMessage": A message to display when someone types !help.
"volume": Global volume setting for all sounds.
"playingGame": The display name for the Discord "currently playing".
"DEV": (Unused) true or false, depending whether the bot is in development mode. 
"DBConnection": DB Url for Node ORM. See below

# Using other databases

The current requirement in package.json uses MySQL as a database. However, the `ORM` package can use many different databases. Install the correct driver based on [ORM](https://github.com/dresende/node-orm2/wiki/Connecting-to-Database). 

No matter what DB you are using, set the DBConnection property in `config.json` to a valid [connection url](https://github.com/dresende/node-orm2/wiki/Connecting-to-Database)
