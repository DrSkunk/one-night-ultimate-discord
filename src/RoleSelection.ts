import { MAX_ROLES_COUNT } from './Constants';
import { RoleName } from './enums/RoleName';

/** Werewolves are always in the game; the host picks the remaining cards. */
export const FIXED_ROLES: RoleName[] = Array.from(
  { length: MAX_ROLES_COUNT[RoleName.werewolf] },
  () => RoleName.werewolf
);

const SELECTABLE_ROLES: RoleName[] = [
  RoleName.doppelganger,
  RoleName.drunk,
  RoleName.hunter,
  RoleName.insomniac,
  RoleName.mason,
  RoleName.minion,
  RoleName.robber,
  RoleName.seer,
  RoleName.tanner,
  RoleName.troublemaker,
  RoleName.villager,
];

export interface RoleChoice {
  label: string;
  value: string;
  role: RoleName;
}

/**
 * Selectable cards. Roles that can appear multiple times get one option per
 * card, e.g. `mason:1` and `mason:2`.
 */
export const ROLE_CHOICES: RoleChoice[] = SELECTABLE_ROLES.flatMap((role) => {
  const count = MAX_ROLES_COUNT[role];
  return Array.from({ length: count }, (_, i) => ({
    label: count > 1 ? `${capitalize(role)} #${i + 1}` : capitalize(role),
    value: `${role}:${i + 1}`,
    role,
  }));
});

export function amountOfRolesToPick(
  playerCount: number,
  cardsOnTable: number
): number {
  return playerCount + cardsOnTable - FIXED_ROLES.length;
}

export function rolesFromSelection(values: readonly string[]): RoleName[] {
  const seen = new Set<string>();
  return values.map((value) => {
    const choice = ROLE_CHOICES.find((c) => c.value === value);
    if (!choice || seen.has(value)) {
      throw new Error(`Invalid role selection: ${value}`);
    }
    seen.add(value);
    return choice.role;
  });
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
