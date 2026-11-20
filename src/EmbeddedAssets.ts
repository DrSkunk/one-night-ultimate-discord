import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import doppelganger from '../assets/imgs/doppelganger.png' with { type: 'file' };
import drunk from '../assets/imgs/drunk.png' with { type: 'file' };
import hunter from '../assets/imgs/hunter.png' with { type: 'file' };
import insomniac from '../assets/imgs/insomniac.png' with { type: 'file' };
import mason from '../assets/imgs/mason.png' with { type: 'file' };
import minion from '../assets/imgs/minion.png' with { type: 'file' };
import robber from '../assets/imgs/robber.png' with { type: 'file' };
import seer from '../assets/imgs/seer.png' with { type: 'file' };
import tanner from '../assets/imgs/tanner.png' with { type: 'file' };
import troublemaker from '../assets/imgs/troublemaker.png' with { type: 'file' };
import villager from '../assets/imgs/villager.png' with { type: 'file' };
import werewolf from '../assets/imgs/werewolf.png' with { type: 'file' };
import gong from '../assets/sound/gong.ogg' with { type: 'file' };
import nightloop from '../assets/sound/nightloop.ogg' with { type: 'file' };
import rooster from '../assets/sound/rooster.ogg' with { type: 'file' };
import { RoleName } from './enums/RoleName';
import { Sound } from './enums/Sound';

const roleImages: Record<RoleName, string> = {
  [RoleName.doppelganger]: doppelganger,
  [RoleName.werewolf]: werewolf,
  [RoleName.minion]: minion,
  [RoleName.mason]: mason,
  [RoleName.seer]: seer,
  [RoleName.robber]: robber,
  [RoleName.troublemaker]: troublemaker,
  [RoleName.drunk]: drunk,
  [RoleName.insomniac]: insomniac,
  [RoleName.villager]: villager,
  [RoleName.hunter]: hunter,
  [RoleName.tanner]: tanner,
};

const sounds: Record<Sound, string> = {
  [Sound.gong]: gong,
  [Sound.nightloop]: nightloop,
  [Sound.rooster]: rooster,
};

export function readRoleImage(role: RoleName): Promise<Buffer> {
  return readFile(roleImages[role]);
}

export function openSound(sound: Sound): Readable {
  return Readable.fromWeb(Bun.file(sounds[sound]).stream());
}
