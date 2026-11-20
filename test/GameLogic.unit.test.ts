import { describe, expect, it } from 'bun:test';
import { Collection } from 'discord.js';
import { RoleName } from '../src/enums/RoleName';
import { Team } from '../src/enums/Team';
import { getWinner, shuffle } from '../src/GameLogic';
import { GameState } from '../src/GameState';
import { Player } from '../src/Player';

let nextId = 100000000000000000n;
function newPlayer(id = String(nextId++)) {
  return new Player(id, id);
}

function toPlayerCollection(players: Player[]): Collection<string, Player> {
  const result = new Collection<string, Player>();
  for (const player of players) {
    result.set(player.id, player);
  }
  return result;
}

describe('GameLogic', function () {
  describe('getWinner', function () {
    const players = Array.from({ length: 6 }, () => newPlayer());
    const gameState = new GameState();

    gameState.playerRoles.doppelganger = toPlayerCollection([players[0]]);
    gameState.playerRoles.werewolf = toPlayerCollection([
      players[1],
      players[2],
    ]);
    gameState.playerRoles.villager = toPlayerCollection([players[3]]);
    gameState.playerRoles.tanner = toPlayerCollection([players[4]]);
    gameState.playerRoles.hunter = toPlayerCollection([players[5]]);

    it('Nobody dies when everyone has one vote.', function () {
      const chosenPlayers = [
        { chosenBy: players[0], target: players[1] },
        { chosenBy: players[1], target: players[2] },
        { chosenBy: players[2], target: players[3] },
        { chosenBy: players[3], target: players[4] },
        { chosenBy: players[4], target: players[5] },
        { chosenBy: players[5], target: players[0] },
      ];
      const winState = getWinner(chosenPlayers, gameState);
      expect(winState.playersWhoDie).toHaveLength(0);
    });

    it('Villagers win when only a werewolf dies', function () {
      const chosenPlayers = [
        { chosenBy: players[0], target: players[2] },
        { chosenBy: players[1], target: players[0] },
        { chosenBy: players[2], target: players[0] },
        { chosenBy: players[3], target: players[2] },
        { chosenBy: players[4], target: players[2] },
        { chosenBy: players[5], target: players[2] },
      ];

      const winState = getWinner(chosenPlayers, gameState);
      expect(winState.playersWhoDie).toContain(players[2]);
      expect(winState.playersWhoDie).toHaveLength(1);
      expect(winState.winner).toBe(Team.villagers);
    });

    it('Villagers win when a werewolf dies', function () {
      const chosenPlayers = [
        { chosenBy: players[0], target: players[2] },
        { chosenBy: players[1], target: players[0] },
        { chosenBy: players[2], target: players[0] },
        { chosenBy: players[3], target: players[0] },
        { chosenBy: players[4], target: players[2] },
        { chosenBy: players[5], target: players[2] },
      ];

      const winState = getWinner(chosenPlayers, gameState);
      expect(winState.playersWhoDie).toContain(players[0]);
      expect(winState.playersWhoDie).toContain(players[2]);
      expect(winState.playersWhoDie).toHaveLength(2);
      expect(winState.winner).toBe(Team.villagers);
    });

    it('Villagers win when a werewolf dies by the hunter', function () {
      const chosenPlayers = [
        { chosenBy: players[0], target: players[5] },
        { chosenBy: players[1], target: players[5] },
        { chosenBy: players[2], target: players[5] },
        { chosenBy: players[3], target: players[5] },
        { chosenBy: players[4], target: players[5] },
        // players[5] is hunter
        { chosenBy: players[5], target: players[1] },
      ];

      expect(gameState.getRoleName(players[5])).toBe(RoleName.hunter);

      const winState = getWinner(chosenPlayers, gameState);
      expect(winState.playersWhoDie).toContain(players[5]);
      expect(winState.playersWhoDie).toContain(players[1]);
      expect(winState.playersWhoDie).toHaveLength(2);

      expect(winState.winner).toBe(Team.villagers);
    });

    it('Tanner wins when he dies', function () {
      const chosenPlayers = [
        { chosenBy: players[0], target: players[5] },
        { chosenBy: players[1], target: players[5] },
        { chosenBy: players[2], target: players[5] },
        { chosenBy: players[3], target: players[5] },
        // players[4] is tanner
        { chosenBy: players[4], target: players[5] },
        // players[5] is hunter
        { chosenBy: players[5], target: players[4] },
      ];

      expect(gameState.getRoleName(players[4])).toBe(RoleName.tanner);
      expect(gameState.getRoleName(players[5])).toBe(RoleName.hunter);

      const winState = getWinner(chosenPlayers, gameState);
      expect(winState.playersWhoDie).toContain(players[5]);
      expect(winState.playersWhoDie).toContain(players[4]);
      expect(winState.playersWhoDie).toHaveLength(2);

      expect(winState.winner).toBe(Team.tanner);
    });

    it('A dying hunter who did not vote takes nobody with them', function () {
      const chosenPlayers = [
        { chosenBy: players[0], target: players[5] },
        { chosenBy: players[1], target: players[5] },
      ];

      const winState = getWinner(chosenPlayers, gameState);
      expect(winState.playersWhoDie).toEqual([players[5]]);
      expect(winState.dyingHunters).toEqual([players[5]]);
      expect(winState.hunterKillList).toHaveLength(0);
      expect(winState.winner).toBe(Team.werewolves);
    });
  });

  describe('shuffle', function () {
    it('returns a permutation without mutating the input', function () {
      const input = Array.from({ length: 20 }, (_, i) => i);
      const result = shuffle(input);
      expect(input).toEqual(Array.from({ length: 20 }, (_, i) => i));
      expect([...result].sort((a, b) => a - b)).toEqual(input);
    });
  });
});
