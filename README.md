![One Night Ultimate Discord logo](assets/imgs/logo.png)

# One Night Ultimate Discord

Play [One Night Ultimate Werewolf](https://boardgamegeek.com/boardgame/147949/one-night-ultimate-werewolf) by [Bezier Games](https://beziergames.com/) with friends on Discord. The bot uses slash commands, buttons, and private responses visible only to you in your game channel. It runs on your own computer; no hosting, Bun, or Docker is needed to use a release.

> **Discord application name:** The deployed application was renamed **One Night Ultimate WereCord** after Discord rejected interaction replies while its application name contained "Discord" (`USERNAME_INVALID_CONTAINS`). Choose a name without "Discord" for your own application. The repository and project name remain unchanged.

## 1. Create your Discord bot

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create an application and give it a name such as **One Night Ultimate WereCord**.
2. On **General Information**, copy the **Application ID**. On the **Bot** page, create or reset the bot token and copy it. **Keep the token secret**; anyone with it can control your bot.
3. Replace `YOUR_APPLICATION_ID` in the address below with your application ID, open it in a browser, and invite the bot to your server:

   ```text
   https://discord.com/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=3197952&scope=bot%20applications.commands
   ```

The invite requests View Channel, Send Messages, Embed Links, Attach Files, Connect, and Speak. Make sure channel overrides allow those permissions. No privileged intents are required.

## 2. Download and configure

Download the matching ZIP from [GitHub Releases](https://github.com/DrSkunk/one-night-ultimate-discord/releases) (version 1.0.0 or newer) and extract it to its own folder, for example `Downloads/WereCord`. Each ZIP contains the executable, configuration example, and license notices.

| Your computer        | Download                   | Executable                 |
| -------------------- | -------------------------- | -------------------------- |
| Windows 10/11, x64   | `WereCord-windows-x64.zip` | `WereCord-windows-x64.exe` |
| macOS, Apple Silicon | `WereCord-macos-arm64.zip` | `WereCord-macos-arm64`     |
| macOS, Intel         | `WereCord-macos-x64.zip`   | `WereCord-macos-x64`       |
| Linux, x64           | `WereCord-linux-x64.zip`   | `WereCord-linux-x64`       |
| Linux, ARM64         | `WereCord-linux-arm64.zip` | `WereCord-linux-arm64`     |

The Linux builds require glibc and are not for Alpine Linux. The executables are unsigned; Windows SmartScreen or macOS may ask you to confirm that you trust the download. Download only from the release page and compare the ZIP's SHA-256 hash with `SHA256SUMS.txt` before allowing it. Use `Get-FileHash <file> -Algorithm SHA256` on Windows, `shasum -a 256 <file>` on macOS, or `sha256sum <file>` on Linux.

In that folder, copy `config.example` to a plain-text file named **`.env`** (not `.env.txt`) and fill in:

```text
DISCORD_TOKEN=YOUR_BOT_TOKEN
DISCORD_CLIENT_ID=YOUR_APPLICATION_ID
```

Replace both values with those from the Developer Portal. Do not share or commit this file. To register commands only in a test server, also add `DEV_GUILD_ID=YOUR_SERVER_ID`; otherwise they are registered globally.

## 3. Register commands and run

Open a terminal **in the folder containing the executable and `.env`**. The executable reads `.env` from the current terminal folder, not necessarily its own location.

### Windows

Open PowerShell:

```powershell
cd "$HOME\Downloads\WereCord"
if (-not (Test-Path .env)) { Copy-Item config.example .env }
notepad .env
```

Save your configuration and close Notepad, then run:

```powershell
.\WereCord-windows-x64.exe --check
.\WereCord-windows-x64.exe --register
.\WereCord-windows-x64.exe
```

### macOS

Open Terminal. For an Intel Mac, replace `arm64` with `x64` in the commands:

```sh
cd ~/Downloads/WereCord
[ -e .env ] || cp config.example .env
nano .env
```

In nano, save with **Ctrl+O**, press **Enter**, and exit with **Ctrl+X**. Then run:

```sh
chmod +x ./WereCord-macos-arm64
xattr -d com.apple.quarantine ./WereCord-macos-arm64 2>/dev/null
./WereCord-macos-arm64 --check
./WereCord-macos-arm64 --register
./WereCord-macos-arm64
```

### Linux

Open a terminal. For an ARM64 computer, replace `x64` with `arm64`:

```sh
cd ~/Downloads/WereCord
[ -e .env ] || cp config.example .env
nano .env
```

In nano, save with **Ctrl+O**, press **Enter**, and exit with **Ctrl+X**. Then run:

```sh
chmod +x ./WereCord-linux-x64
./WereCord-linux-x64 --check
./WereCord-linux-x64 --register
./WereCord-linux-x64
```

`--check` verifies the bundled images, audio, and voice encryption offline; it does not connect to Discord. `--register` updates your bot's slash commands and is needed on first setup and after command changes. Global commands can take time to appear; test-server commands appear sooner. Use `--help` to see the options.

Leave the terminal and computer running while playing; the bot goes offline when the program stops. Press **Ctrl+C** to stop it. If the bot cannot log in, check the token and application ID in `.env`.

## Play

1. Join a voice channel and use `/start` in a text channel. Players in the same voice channel press **Join**; the host presses **Start** and selects roles.
2. Each player presses **Reveal my role**. Night actions and votes are private to the player.
3. Discuss, then vote when time runs out or everyone agrees to `/skip`.

Use `/time` for the remaining discussion time, `/rules` for the rules, and `/help` for more commands. `/start` also offers `quick`, `silent_night`, and `silent` options.

## Development and releases

For source development, install [Bun](https://bun.sh) at the version in `package.json`:

```sh
bun install --frozen-lockfile
cp .env.example .env  # fill in a separate test bot's credentials
bun run register
bun start
bun run build:executable  # native executable in dist/
bun test
bun run lint
bun run typecheck
bun audit
```

Set `DEV_GUILD_ID` and register commands to enable `/playtest` with virtual players in that test server. `bun run test:discord --register` records a test report; review it for private information before sharing. Docker remains available through the existing `Dockerfile`.

CI checks and builds all release targets on pushes and pull requests. To publish a release, update the version in `package.json`, commit and push it, then create and push a matching tag:

```sh
git tag v1.0.0
git push origin v1.0.0
```

After the tests and isolated executable checks pass, GitHub Actions creates ZIPs containing binaries, configuration examples, license notices, and checksums. The release includes the matching application source; `BUN_LICENSE.md` in each ZIP describes Bun's linked libraries and how to rebuild its LGPL components. To compile with a modified Bun runtime, add `--compile-executable-path=/path/to/bun` to the build command.

## Credits

Artwork by [T44 Productions](https://www.t44.productions/home), licensed [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/). Code is licensed under [ISC](LICENSE).

Sounds: [night loop by Serop2012](https://freesound.org/people/serop2012/sounds/169458/), [rooster by Promete](https://freesound.org/people/promete/sounds/60142/), and [gong by InspectorJ](https://freesound.org/people/InspectorJ/sounds/411090/).
