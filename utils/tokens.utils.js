const jwt = require("jsonwebtoken");
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRATION,
  JWT_REFRESH_EXPIRATION,
} = require("../config/jwt.config");

const generateTokens = (user) => {
  // Generate access token
  const accessToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRATION }
  );

  // Generate refresh token with limited payload
  const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION,
  });

  return { accessToken, refreshToken };
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateTokens,
  verifyToken,
};
