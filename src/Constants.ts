import { RoleName } from './enums/RoleName';

export const RULES_URL =
  'http://cloud-3.steamusercontent.com/ugc/1788471362465556315/4214EC45E12DF09CD40CF84DC7A00C1744412402/';
export const MINIMUM_PLAYERS = 3;
export const MAXIMUM_PLAYERS = 10;
export const CARDS_ON_TABLE = 3;
export const MAX_RETRIES = 5;
export const SETUP_WAIT_TIME = 60000;
export const REACTION_WAIT_TIME = 20000;
export const FAKE_USER_TIME = 10000;
export const ROUND_TIME_MINUTES = 5;
export const ROUND_TIME_MILLISECONDS = ROUND_TIME_MINUTES * 60000;
export const NIGHT_ALMOST_OVER_REMINDER = 30000;
export const MAX_ROLES_COUNT: { [key in keyof typeof RoleName]: number } = {
  doppelganger: 1,
  werewolf: 2,
  minion: 2,
  mason: 2,
  seer: 1,
  robber: 1,
  troublemaker: 1,
  drunk: 1,
  insomniac: 1,
  villager: 3,
  hunter: 1,
  tanner: 1,
};
