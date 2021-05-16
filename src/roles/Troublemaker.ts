import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Troublemaker extends Role {
  name = RoleName.troublemaker;

  doTurn(): void {
    Log.info('Troublemaker turn played.');
  }
}
