import { expect } from 'chai';
import { Client, Guild, GuildMember } from 'discord.js';
import { RoleName } from '../src/enums/RoleName';
import { GameState } from '../src/GameState';
import { Player } from '../src/Player';
import { Doppelganger } from '../src/roles/Doppelganger';
import { Villager } from '../src/roles/Villager';

describe('GameState', function () {
  describe('clone', function () {
    it('it should completely deepclone the gamestate', function () {
      const gameState = new GameState(
        {
          [RoleName.doppelganger]: [],
          [RoleName.werewolf]: [],
          [RoleName.minion]: [],
          [RoleName.mason]: [],
          [RoleName.seer]: [],
          [RoleName.robber]: [],
          [RoleName.troublemaker]: [],
          [RoleName.drunk]: [],
          [RoleName.insomniac]: [],
        },
        []
      );
      const clonedGameState = gameState.clone();
      expect(clonedGameState.playerRoles).to.have.property(
        RoleName.doppelganger
      );

      const client = new Client();
      const guild = new Guild(client, {});
      const player1 = new Player(new GuildMember(client, {}, guild));
      player1.role = new Doppelganger();
      const player2 = new Player(new GuildMember(client, {}, guild));
      player2.role = new Villager();
      if (gameState.playerRoles.doppelganger) {
        gameState.playerRoles.doppelganger.push(player1, player2);
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
