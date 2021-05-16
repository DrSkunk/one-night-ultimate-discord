import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Doppelganger extends Role {
  name = RoleName.doppelganger;

  doTurn(): void {
    Log.info('Doppelganger turn played.');
  }
}
