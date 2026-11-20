import { describe, expect, it } from 'bun:test';
import { CARDS_ON_TABLE, MAXIMUM_PLAYERS } from '../src/Constants';
import { RoleName } from '../src/enums/RoleName';
import {
  amountOfRolesToPick,
  ROLE_CHOICES,
  rolesFromSelection,
} from '../src/RoleSelection';

describe('RoleSelection', function () {
  it('offers enough unique cards for the largest game', function () {
    const values = ROLE_CHOICES.map(({ value }) => value);
    expect(new Set(values).size).toBe(values.length);
    expect(ROLE_CHOICES.length).toBeGreaterThanOrEqual(
      amountOfRolesToPick(MAXIMUM_PLAYERS, CARDS_ON_TABLE)
    );
    expect(ROLE_CHOICES.length).toBeLessThanOrEqual(25);
  });

  it('maps duplicate cards of the same role to that role', function () {
    expect(rolesFromSelection(['mason:1', 'mason:2', 'seer:1'])).toEqual([
      RoleName.mason,
      RoleName.mason,
      RoleName.seer,
    ]);
  });

  it('rejects unknown or repeated values', function () {
    expect(() => rolesFromSelection(['werewolf:1'])).toThrow(
      'Invalid role selection'
    );
    expect(() => rolesFromSelection(['seer:1', 'seer:1'])).toThrow(
      'Invalid role selection'
    );
  });
});
