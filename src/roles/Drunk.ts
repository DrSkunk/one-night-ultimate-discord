import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Drunk extends Role {
  name = RoleName.drunk;

  doTurn(): void {
    Log.info('Drunk turn played.');
  }
}
