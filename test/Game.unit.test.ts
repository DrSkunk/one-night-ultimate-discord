import { describe, expect, it } from 'bun:test';
import { Collection, type GuildTextBasedChannel } from 'discord.js';
import { RoleName } from '../src/enums/RoleName';
import { Game } from '../src/Game';
import { Player } from '../src/Player';

const textChannel = {
  id: '1',
  name: 'test',
  send: async () => ({}),
} as unknown as GuildTextBasedChannel;

let nextId = 100000000000000000n;
function newPlayer(id = String(nextId++)) {
  return new Player(id, id);
}

function newGame(size: number, players: Player[] = []): Game {
  const gamePlayers =
    players.length === 0
      ? Array.from({ length: size }, () => newPlayer())
      : players;
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

  return new Game({
    players: gamePlayers.slice(0, size),
    textChannel,
    voiceChannel: null,
    chosenRoles: roles,
    silentNight: false,
    silent: false,
  });
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
      }).toThrow('Invalid amount of players');

      expect(() => {
        newGame(3);
      }).not.toThrow('Invalid amount of players');

      expect(() => {
        newGame(6);
      }).not.toThrow('Invalid amount of players');

      expect(() => {
        newGame(10);
      }).not.toThrow('Invalid amount of players');

      expect(() => {
        newGame(11);
      }).toThrow('Invalid amount of players');
    });

    it('No invalid role distribution', async function () {
      async function testGame(game: Game) {
        let startedGame = false;
        try {
          await game.start();
          startedGame = true;
        } catch (error) {
          expect((error as Error).message).toContain(
            'Invalid role distribution'
          );
        }
        expect(startedGame).toBe(false);
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
      expect(game.gameState.playerRoles[RoleName.doppelganger].size).toBe(1);
      expect(game.gameState.playerRoles[roleName].size).toBe(1);

      game.gameState.moveDoppelGanger(roleName);
      expect(game.gameState.playerRoles[RoleName.doppelganger].size).toBe(0);
      expect(game.gameState.playerRoles[roleName].size).toBe(2);

      expect(game.gameState.getRoleName(players[1])).toBe(roleName);
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
