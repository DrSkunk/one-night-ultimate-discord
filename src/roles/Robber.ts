import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Robber extends Role {
  name = RoleName.robber;

  doTurn(): void {
    Log.info('Robber turn played.');
  }
}
