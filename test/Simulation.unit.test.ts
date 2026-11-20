import { afterEach, beforeEach, describe, expect, it, jest } from 'bun:test';
import { EventEmitter } from 'node:events';
import type { GuildTextBasedChannel } from 'discord.js';
import { MAXIMUM_PLAYERS, MINIMUM_PLAYERS } from '../src/Constants';
import type { RoleName } from '../src/enums/RoleName';
import { Game } from '../src/Game';
import { shuffle } from '../src/GameLogic';
import { Log } from '../src/Log';
import {
  FIXED_ROLES,
  ROLE_CHOICES,
  rolesFromSelection,
} from '../src/RoleSelection';
import {
  createVirtualPlayers,
  type VirtualStrategy,
} from '../src/VirtualPlayer';

class FakeCollector extends EventEmitter {
  public ended = false;
  stop(reason = 'user') {
    if (!this.ended) {
      this.ended = true;
      this.emit('end', new Map(), reason);
    }
  }
}

function fakeChannel() {
  const sent: unknown[] = [];
  const channel = {
    id: 'simulation',
    name: 'simulation',
    send: async (message: unknown) => {
      sent.push(message);
      return {
        edit: async () => ({}),
        createMessageComponentCollector: () => new FakeCollector(),
      };
    },
  } as unknown as GuildTextBasedChannel;
  return { channel, sent };
}

function randomRoles(playerCount: number): RoleName[] {
  const choices = shuffle(ROLE_CHOICES.map(({ value }) => value));
  const picked = choices.slice(0, playerCount + 3 - FIXED_ROLES.length);
  return [...FIXED_ROLES, ...rolesFromSelection(picked)];
}

async function settle(promise: Promise<unknown>) {
  let done = false;
  void promise.finally(() => (done = true));
  for (let tick = 0; tick < 10_000 && !done; tick++) {
    jest.advanceTimersByTime(500);
    for (let i = 0; i < 20; i++) await Promise.resolve();
  }
  expect(done).toBe(true);
  await promise;
}

async function simulate(playerCount: number, strategy?: VirtualStrategy) {
  const { channel, sent } = fakeChannel();
  const players = createVirtualPlayers(playerCount, { strategy });
  const game = new Game({
    players,
    textChannel: channel,
    voiceChannel: null,
    chosenRoles: randomRoles(playerCount),
    silentNight: true,
    silent: true,
  });
  await settle(game.start());
  await settle(game.endGame());
  return { game, sent };
}

function resultTitle(sent: unknown[]): string | undefined {
  for (const message of sent) {
    const embeds = (message as { embeds?: { data: { title?: string } }[] })
      .embeds;
    const title = embeds?.[0]?.data.title;
    if (title?.includes('has won')) return title;
  }
  return undefined;
}

describe('Full game simulation with virtual players', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Log.setLevel('error');
  });
  afterEach(() => {
    jest.useRealTimers();
    Log.setLevel('info');
  });

  it('plays complete games for every player count with random roles and choices', async () => {
    for (let round = 0; round < 5; round++) {
      for (
        let playerCount = MINIMUM_PLAYERS;
        playerCount <= MAXIMUM_PLAYERS;
        playerCount++
      ) {
        const { game, sent } = await simulate(playerCount);
        expect(resultTitle(sent)).toBeDefined();
        expect(game.gameState.tableRoles).toHaveLength(3);
        const cardsHeld = Object.values(game.gameState.playerRoles).reduce(
          (total, holders) => total + holders.size,
          0
        );
        expect(cardsHeld).toBe(playerCount);
        for (const player of game.players) {
          expect(() => game.gameState.getRoleName(player)).not.toThrow();
        }
      }
    }
  });

  it('kills the player everyone votes for', async () => {
    const strategy: VirtualStrategy = (choices, amount, prompt) =>
      prompt === 'Choose a player to kill.'
        ? [choices.includes('virtual-1') ? 'virtual-1' : choices[0]]
        : choices.slice(0, amount);
    const { sent } = await simulate(4, strategy);
    const results = sent.find((message) => resultTitle([message])) as {
      embeds: { data: { description?: string } }[];
    };
    expect(results.embeds[0].data.description).toContain('Bot 1');
  });
});
