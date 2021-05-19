import { RoleName } from './enums/RoleName';

export const MINIMUM_PLAYERS = 2;
export const MAXIMUM_PLAYERS = 10;
export const CARDS_ON_TABLE = 3;
export const MAX_RETRIES = 5;
export const SETUP_WAIT_TIME = 60000;
export const REACTION_WAIT_TIME = 20000;
export const ROUND_TIME_MINUTES = 0.2;
export const ROUND_TIME_MILLISECONDS = ROUND_TIME_MINUTES * 60000;
export const MAX_ROLES_COUNT: { [key in RoleName]: number } = {
  [RoleName.doppelganger]: 1,
  [RoleName.werewolf]: 2,
  [RoleName.minion]: 2,
  [RoleName.mason]: 2,
  [RoleName.seer]: 1,
  [RoleName.robber]: 1,
  [RoleName.troublemaker]: 1,
  [RoleName.drunk]: 1,
  [RoleName.insomniac]: 1,
  [RoleName.villager]: 3,
  [RoleName.hunter]: 1,
  [RoleName.tanner]: 1,
};
