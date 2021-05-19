import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Tanner extends Role {
  readonly name = RoleName.tanner;

  doTurn(): void {
    Log.info('Tanner turn played.');
  }

  clone(): Role {
    return new Tanner();
  }
}
