import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Hunter extends Role {
  name = RoleName.hunter;

  doTurn(): void {
    Log.info('Hunter turn played.');
  }

  clone(): Role {
    return new Hunter();
  }
}
