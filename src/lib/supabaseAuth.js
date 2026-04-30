export const SESSION_MAX_AGE_SECONDS = 10 * 60;

export const supabaseCookieOptions = {
  path: "/",
  sameSite: "lax",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
