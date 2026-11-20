![ONUW logo](assets/imgs/logo.png?raw=true 'ONUW')

# One Night Ultimate Discord

[![Build and Test](https://github.com/DrSkunk/one-night-ultimate-discord/actions/workflows/build_test.yml/badge.svg)](https://github.com/DrSkunk/one-night-ultimate-discord/actions/workflows/build_test.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![License: CC BY-NC-ND 4.0](https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-nd/4.0/)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-f8bc45.svg)](https://github.com/prettier/prettier)

Discord bot written in TypeScript that lets a server play [One Night Ultimate Werewolf](https://boardgamegeek.com/boardgame/147949/one-night-ultimate-werewolf) by [Bezier Games](https://beziergames.com/).

The bot uses Discord [interactions](https://docs.discord.com/developers/interactions/overview): slash commands, buttons and select menus. Night actions happen through ephemeral messages that only you can see, in the game channel itself, so no DMs are needed.

[Click here to invite the bot to your server.](https://discord.com/oauth2/authorize?client_id=843451299973693472&permissions=3197952&integration_type=0&scope=bot+applications.commands)

## Commands

| Command                                  | Description                                                         |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `/start [quick] [silent_night] [silent]` | Open a lobby in this channel. Players join from your voice channel. |
| `/skip`                                  | Ask everyone to agree to skip the discussion and vote now.          |
| `/time`                                  | Show how much discussion time is left.                              |
| `/rules`                                 | Link to the official rules.                                         |
| `/help`, `/ping`, `/version`             | Info about the bot.                                                 |

## How a game works

1. The host joins a voice channel and runs `/start` in a text channel. Players in the same voice channel press **Join**, then the host presses **Start**.
2. The host picks the roles from a select menu (only the host can see it). With `quick: true`, the roles of the previous game in that channel are reused.
3. Everyone presses **Reveal my role** to privately see their card. This button keeps working all night, so it also brings back a dismissed message.
4. During the night, the bot sends each player who has to act a private prompt with buttons or select menus.
5. When the discussion time ends (or everyone agrees to `/skip`), each player votes privately and the bot posts the results.

## Installation

You need [Bun](https://bun.sh) 1.4 or newer.

```sh
bun install
cp .env.example .env   # then fill in the values
bun run register       # register the slash commands (once, and after changing commands)
bun start
```

### Configuration

The environment variables are checked at startup and the bot will not start if any are invalid.

| Variable            | Required | Description                                                                                          |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `DISCORD_TOKEN`     | yes      | Bot token (Developer Portal → your application → **Bot** → **Reset Token**). Never commit it.        |
| `DISCORD_CLIENT_ID` | yes      | Application ID (**General Information** tab).                                                        |
| `DEV_GUILD_ID`      | no       | If set, `bun run register` registers the commands to this server only, so changes show up instantly. |
| `LOG_LEVEL`         | no       | `error`, `warn`, `info` (default) or `debug`.                                                        |

The bot needs no privileged intents. It only uses the `Guilds` and `GuildVoiceStates` intents. Invite it with the `bot` and `applications.commands` scopes. In game channels it needs these permissions: View Channel, Send Messages, Embed Links, Attach Files, Connect and Speak.

### Docker

```sh
docker build -t one-night-ultimate-discord .
docker run --rm --env-file .env one-night-ultimate-discord
```

The image runs as a non-root user. Images built from `main` and from releases are published to `ghcr.io/drskunk/one-night-ultimate-discord`.

## Development

```sh
bun run dev        # start with file watching
bun test           # unit tests
bun run lint       # ESLint + Prettier
bun run typecheck  # tsc --noEmit
bun audit          # check dependencies for known vulnerabilities
```

### Discord smoke test

Use a separate Discord application and test server; do not test with a production
bot token. Add the test application's token, application ID, and server ID to a
local `.env` file, then run `bun run register` and `bun start`. Check that:

- `/start` opens a lobby and rejects non-host attempts to start or cancel it.
- Only members in the host's voice channel can join, and the host can select
  roles.
- Each player's role and night prompts are private, and only that player can
  use their components.
- The night actions, wake-up, `/skip`, voting, timeout and results complete
  without stale buttons or failed interactions.
- The bot joins voice, plays the night loop and rooster, and disconnects when
  the game ends or the voice channel empties.

## Credits

Images are custom designed by [T44 Productions](https://www.t44.productions/home) with [CC BY-NC-ND 4.0 license](https://creativecommons.org/licenses/by-nc-nd/4.0/).

The following sound files were used:

- [Night loop sample by Serop2012](https://freesound.org/people/serop2012/sounds/169458/)
- [Rooster crow by Promete](https://freesound.org/people/promete/sounds/60142/)
- [Gong sample by InspectorJ](https://freesound.org/people/InspectorJ/sounds/411090/)
