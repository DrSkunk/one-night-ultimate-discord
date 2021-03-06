import { expect } from 'chai';
import {
  Client,
  SnowflakeUtil,
  GuildMember,
  Guild,
  User,
  Collection,
} from 'discord.js';
import { RoleName } from '../src/enums/RoleName';
import { GameState } from '../src/GameState';
import { Player } from '../src/Player';
import { Doppelganger } from '../src/roles/Doppelganger';
import { Drunk } from '../src/roles/Drunk';
import { Seer } from '../src/roles/Seer';
import { Troublemaker } from '../src/roles/Troublemaker';
import { Villager } from '../src/roles/Villager';
import { Werewolf } from '../src/roles/Werewolf';

const client = new Client();
const guild = new Guild(client, {
  id: SnowflakeUtil.generate(),
});

function newPlayer(id = SnowflakeUtil.generate()) {
  const user = new User(client, { id });
  const gm = new GuildMember(
    client,
    { user, displayName: id, nick: id },
    guild
  );
  return new Player(gm);
}

function toPlayerCollection(players: Player[]): Collection<string, Player> {
  const result = new Collection<string, Player>();
  for (const player of players) {
    result.set(player.id, player);
  }
  return result;
}

function checkRole(gameState: GameState, role: RoleName, players: Player[]) {
  expect(gameState.playerRoles[role]).to.be.eql(toPlayerCollection(players));
}

describe('GameState', function () {
  describe('Print', function () {
    const gameState = new GameState();
    const players = [
      newPlayer('11'),
      newPlayer('22'),
      newPlayer('33'),
      newPlayer('44'),
      newPlayer('55'),
    ];
    gameState.playerRoles.doppelganger = toPlayerCollection([players[0]]);
    gameState.playerRoles.werewolf = toPlayerCollection([
      players[1],
      players[2],
    ]);
    gameState.playerRoles.mason = toPlayerCollection([players[3], players[4]]);

    gameState.tableRoles = [new Seer(), new Villager(), new Troublemaker()];

    expect(gameState.print(RoleName.seer)).to.equal(`Player roles:

doppelganger as seer: 11
werewolf: 22, 33
mason: 44, 55

Table roles: seer, villager, troublemaker`);
  });
  describe('Player roles', function () {
    it('It should get a valid role of a player', function () {
      const gameState = new GameState();
      const player1 = newPlayer();
      const player2 = newPlayer();
      gameState.playerRoles.doppelganger = toPlayerCollection([
        player1,
        player2,
      ]);
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

  describe('copy', function () {
    it('it should shallow copy the gamestate', function () {
      const gameState = new GameState();
      const clonedGameState = gameState.copy();
      expect(clonedGameState.playerRoles).to.have.property(
        RoleName.doppelganger
      );

      const players = Array.from({ length: 2 }, () => newPlayer());
      gameState.playerRoles.doppelganger = toPlayerCollection(players);
      expect(gameState.playerRoles)
        .to.have.property(RoleName.doppelganger)
        .to.have.length(2);
      expect(clonedGameState.playerRoles)
        .to.have.property(RoleName.doppelganger)
        .to.have.length(0);
    });
  });

  describe('Move roles', function () {
    it('it should switch roles with table role', function () {
      const players = Array.from({ length: 3 }, () => newPlayer());

      const gameState = new GameState();
      gameState.playerRoles.drunk = toPlayerCollection([players[0]]);
      gameState.playerRoles.werewolf = toPlayerCollection([
        players[1],
        players[2],
      ]);
      gameState.tableRoles = [
        new Doppelganger(),
        new Villager(),
        new Villager(),
      ];

      expect(gameState.playerRoles.drunk).to.have.length(1);
      expect(gameState.playerRoles.doppelganger).to.have.length(0);

      gameState.switchTableCard(players[0], 0);
      expect(gameState.playerRoles.drunk).to.have.length(0);
      expect(gameState.playerRoles.doppelganger).to.have.length(1);

      expect(gameState.tableRoles).to.be.eql([
        new Drunk(),
        new Villager(),
        new Villager(),
      ]);
    });

    it('it should switch roles with table role even with multiple drunks', function () {
      const players = Array.from({ length: 3 }, () => newPlayer());

      const gameState = new GameState();
      gameState.playerRoles.drunk = toPlayerCollection([
        players[0],
        players[1],
      ]);
      gameState.playerRoles.robber = toPlayerCollection([players[2]]);
      gameState.tableRoles = [new Seer(), new Werewolf(), new Werewolf()];

      expect(gameState.playerRoles.drunk).to.have.length(2);
      expect(gameState.playerRoles.robber).to.have.length(1);

      gameState.switchTableCard(players[1], 1);
      checkRole(gameState, RoleName.drunk, [players[0]]);
      expect(gameState.playerRoles.werewolf).to.have.length(1);
      expect(gameState.tableRoles).to.be.eql([
        new Seer(),
        new Drunk(),
        new Werewolf(),
      ]);
    });

    it('it should switch two player roles', function () {
      const players = Array.from({ length: 4 }, (_, i) =>
        newPlayer(i.toString())
      );

      const gameState = new GameState();
      gameState.playerRoles.robber = toPlayerCollection([players[0]]);
      gameState.playerRoles.werewolf = toPlayerCollection([players[1]]);
      gameState.playerRoles.seer = toPlayerCollection([players[2]]);
      gameState.playerRoles.troublemaker = toPlayerCollection([players[3]]);

      gameState.switchPlayerRoles(players[0], players[2]);
      checkRole(gameState, RoleName.robber, [players[2]]);
      checkRole(gameState, RoleName.werewolf, [players[1]]);
      checkRole(gameState, RoleName.seer, [players[0]]);
      checkRole(gameState, RoleName.troublemaker, [players[3]]);

      gameState.switchPlayerRoles(players[2], players[1]);

      checkRole(gameState, RoleName.robber, [players[1]]);
      checkRole(gameState, RoleName.werewolf, [players[2]]);
      checkRole(gameState, RoleName.seer, [players[0]]);
      checkRole(gameState, RoleName.troublemaker, [players[3]]);
    });
  });
});
