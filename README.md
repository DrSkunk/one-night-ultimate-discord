![ONUW logo](assets/imgs/logo.png?raw=true 'ONUW')

# One Night Ultimate Discord

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![License: CC BY-NC-ND 4.0](https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-nd/4.0/)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-f8bc45.svg)](https://github.com/prettier/prettier)

Server application made in typescript that allows a discord server to play the game [One Night Ultimate Werewolf](https://boardgamegeek.com/boardgame/147949/one-night-ultimate-werewolf) by [Bezier Games](https://beziergames.com/).

Check the `help` command for all commands.

[Click here to invite the bot to your server.](https://discord.com/api/oauth2/authorize?client_id=843451299973693472&permissions=0&scope=bot)

## Installation

This requires [NodeJS](https://nodejs.org/en/) to be installed.

Clone `one-night-ultimate-discord` into a directory and `cd` into it. Then run the command `npm install` to install all dependencies.

To start the application after setting the questions and the config file, run `npm start`.

## Config file

Copy `.env.example` to `.env` and fill in your details:

- `PREFIX`: The prefix for the commands.
- `DISCORD_TOKEN`: Your Discord bot token.

You can create a Discord bot token by going to [the Discord developer portal](https://discord.com/developers/applications/) to create a new application. Then go to `Bot` and click `Copy` under `Token`.

## Credits

Images are custom designed by [T44 Productions](https://www.t44.productions/home) with [CC BY-NC-ND 4.0 license](https://creativecommons.org/licenses/by-nc-nd/4.0/).

The following sound files were used:

- [Night loop sample by Serop2012](https://freesound.org/people/serop2012/sounds/169458/)
- [Rooster crow by Promete](https://freesound.org/people/promete/sounds/60142/)
- [Gong sample by InspectorJ](https://freesound.org/people/InspectorJ/sounds/411090/)
