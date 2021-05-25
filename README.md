# One Night Ultimate Discord

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-f8bc45.svg)](https://github.com/prettier/prettier)

Server application made in typescript that allows a discord server to play the game [One Night Ultimate Werewolf](https://boardgamegeek.com/boardgame/147949/one-night-ultimate-werewolf) by [Bezier Games](https://beziergames.com/).

Check the `help` command for all commands.

## Installation

This requires [NodeJS](https://nodejs.org/en/) to be installed.

Clone `one-night-ultimate-discord` into a directory and `cd` into it. Then run the command `npm install` to install all dependencies.

To start the application after setting the questions and the config file, run `npm start`.

## Config file

Copy `.env.example` to `.env` and fill in your details:

- `PREFIX`: The prefix for the commands.
- `DISCORD_TOKEN`: Your Discord bot token.
- `DISCORD_GUILD_ID`: The ID of the server/guild where the bot will run.
- `DISCORD_CHANNEL_ID`: The ID of the text channel where the bot will listen to and post messages.

You can create a Discord bot token by going to [the Discord developer portal](https://discord.com/developers/applications/) to create a new application. Then go to `Bot` and click `Copy` under `Token`.

You can find your Guild ID and Text channel ID by enabling developer mode on your Discord client and then rightclicking the server/channel and press `Copy ID`.

## Credits

The following sound files were used:

- [Night loop sample by Serop2012](https://freesound.org/people/serop2012/sounds/169458/)
- [Rooster crow by Promete](https://freesound.org/people/promete/sounds/60142/)
