import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Villager extends Role {
  name = RoleName.villager;

  doTurn(): void {
    Log.info('Villager turn played.');
  }

  clone(): Role {
    return new Villager();
  }
}
