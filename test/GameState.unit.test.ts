import { expect } from 'chai';
import { Client, Guild, User, SnowflakeUtil } from 'discord.js';
import { RoleName } from '../src/enums/RoleName';
import { GameState } from '../src/GameState';
import { Player } from '../src/Player';
import { Doppelganger } from '../src/roles/Doppelganger';
import { Villager } from '../src/roles/Villager';

const client = new Client();
const guild = new Guild(client, {
  id: SnowflakeUtil.generate(),
});

function newPlayer() {
  const user = new User(client, { id: SnowflakeUtil.generate() }, guild);
  return new Player(user);
}

describe('GameState', function () {
  describe('Player roles', function () {
    it('It should get a valid role of a player', function () {
      const gameState = new GameState();
      const player1 = newPlayer();
      const player2 = newPlayer();
      gameState.playerRoles.doppelganger = [player1, player2];
      expect(gameState.getRoleName(player1)).to.be.eq(RoleName.doppelganger);
      expect(gameState.getRoleName(player2)).to.be.eq(RoleName.doppelganger);
    });
    it('It should throw an error if the player does not have a role', function () {
      const gameState = new GameState();
      const player = newPlayer();
      expect(() => gameState.getRoleName(player)).to.throw(
        'Player does not have a role'
      );
    });
  });

  describe('clone', function () {
    it('it should completely deepclone the gamestate', function () {
      const gameState = new GameState();
      const clonedGameState = gameState.clone();
      expect(clonedGameState.playerRoles).to.have.property(
        RoleName.doppelganger
      );
      if (gameState.playerRoles.doppelganger) {
        gameState.playerRoles.doppelganger.push(newPlayer(), newPlayer());
      }
      expect(gameState.playerRoles)
        .to.have.property(RoleName.doppelganger)
        .to.have.length(2);
      expect(clonedGameState.playerRoles)
        .to.have.property(RoleName.doppelganger)
        .to.have.length(0);
    });
  });
});
