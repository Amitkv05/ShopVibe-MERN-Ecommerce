function cookieOptions() {
  const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  const production = process.env.NODE_ENV === "production";
  const days = Number(process.env.COOKIE_EXPIRE) || 2;

  const options = {
    httpOnly: true,
    secure: production || sameSite === "none",
    sameSite,
    maxAge: days * 24 * 60 * 60 * 1000,
    path: "/",
  };

  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;
  return options;
}

export const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();
  const safeUser = user.toJSON();

  res.status(statusCode).cookie("token", token, cookieOptions()).json({
    success: true,
    user: safeUser,
  });
};

export const clearAuthCookie = (res) => {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie("token", options);
};
