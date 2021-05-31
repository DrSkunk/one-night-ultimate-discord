import { expect } from 'chai';
import {
  Client,
  Guild,
  SnowflakeUtil,
  TextChannel,
  VoiceChannel,
  GuildMember,
  User,
  Collection,
} from 'discord.js';
import { RoleName } from '../src/enums/RoleName';
import { Game } from '../src/Game';
import { Player } from '../src/Player';

const client = new Client();
const guild = new Guild(client, {
  id: SnowflakeUtil.generate(),
});
const textChannel = new TextChannel(guild, { id: SnowflakeUtil.generate() });
const voiceChannel = new VoiceChannel(guild, { id: SnowflakeUtil.generate() });

function newPlayer() {
  const user = new User(client, { id: SnowflakeUtil.generate() });
  const gm = new GuildMember(client, { user }, guild);
  return new Player(gm);
}

function newGame(size: number, players: Player[] = []): Game {
  let users: GuildMember[];
  if (players.length === 0) {
    users = Array.from({ length: size }, () => newPlayer().user);
  } else {
    users = players.map((p) => p.user);
  }
  const roles = [
    RoleName.werewolf,
    RoleName.werewolf,
    RoleName.mason,
    RoleName.mason,
    RoleName.robber,
    RoleName.seer,
    RoleName.troublemaker,
    RoleName.insomniac,
    RoleName.tanner,
    RoleName.hunter,
    RoleName.villager,
  ].slice(0, size);

  return new Game(
    users.slice(0, size),
    textChannel,
    voiceChannel,
    roles,
    false,
    false
  );
}

function toPlayerCollection(players: Player[]): Collection<string, Player> {
  const result = new Collection<string, Player>();
  for (const player of players) {
    result.set(player.id, player);
  }
  return result;
}

describe('Game', function () {
  describe('Initialisation and start', function () {
    it("Don't start with invalid amount of players", function () {
      expect(() => {
        newGame(2);
      }).to.throw('Invalid amount of players');

      expect(() => {
        newGame(3);
      }).to.not.throw('Invalid amount of players');

      expect(() => {
        newGame(6);
      }).to.not.throw('Invalid amount of players');

      expect(() => {
        newGame(10);
      }).to.not.throw('Invalid amount of players');

      expect(() => {
        newGame(11);
      }).to.throw('Invalid amount of players');
    });

    it('No invalid role distribution', async function () {
      async function testGame(game: Game) {
        let startedGame = false;
        try {
          await game.start();
          startedGame = true;
        } catch (error) {
          expect(error.message).to.contain('Invalid role distribution');
        }
        expect(startedGame).to.be.false;
      }
      const players = Array.from({ length: 3 }, () => newPlayer());
      const playersSet = new Collection();
      for (const player of players) {
        playersSet.set(player.id, player);
      }
      let game = newGame(players.length, players);

      game.gameState.playerRoles.doppelganger = toPlayerCollection(
        players.slice(0, 2)
      );
      await testGame(game);

      game = newGame(players.length, players);
      game.gameState.playerRoles.doppelganger = toPlayerCollection([
        players[0],
      ]);
      game.gameState.playerRoles.werewolf = toPlayerCollection(
        players.slice(1, 3)
      );
      game.gameState.playerRoles.robber = toPlayerCollection(
        players.slice(5, 2)
      );

      await testGame(game);
    });
  });
  describe('Doppelganger takes on werewolf, minion, mason and insomniac roles and executes it later', function () {
    function testChange(roleName: RoleName): void {
      const players = Array.from({ length: 3 }, () => newPlayer());

      const game = newGame(players.length, players);

      game.gameState.playerRoles.doppelganger = toPlayerCollection([
        players[0],
      ]);
      game.gameState.playerRoles[roleName] = toPlayerCollection([players[1]]);
      expect(game.gameState.playerRoles)
        .to.have.property(RoleName.doppelganger)
        .to.have.length(1);
      expect(game.gameState.playerRoles)
        .to.have.property(roleName)
        .to.have.length(1);

      game.gameState.moveDoppelGanger(roleName);
      expect(game.gameState.playerRoles)
        .to.have.property(RoleName.doppelganger)
        .to.have.length(0);
      expect(game.gameState.playerRoles)
        .to.have.property(roleName)
        .to.have.length(2);

      expect(game.gameState.getRoleName(players[1])).to.be.eq(roleName);
    }

    it('Doppelganger takes on werewolf executes it later', function () {
      testChange(RoleName.werewolf);
    });

    it('Doppelganger takes on minion executes it later', function () {
      testChange(RoleName.minion);
    });

    it('Doppelganger takes on mason executes it later', function () {
      testChange(RoleName.mason);
    });

    it('Doppelganger takes on insomniac executes it later', function () {
      testChange(RoleName.insomniac);
    });
  });
});
