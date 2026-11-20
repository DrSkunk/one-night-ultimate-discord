/** An error whose message is safe to show to Discord users. */
export class UserError extends Error {
  override name = 'UserError';
}

export function userMessage(error: unknown): string {
  return error instanceof UserError
    ? error.message
    : 'Something went wrong. Please try again later.';
}
