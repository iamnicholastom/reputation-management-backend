const { verifyToken } = require("../utils/tokens.utils");
const { JWT_ACCESS_SECRET } = require("../config/jwt.config");

const authenticateToken = async (req, res, next) => {
  const accessToken = req.cookies["access_token"];

  if (!accessToken) {
    return res.status(401).json({ message: "Access token not found" });
  }

  const decoded = verifyToken(accessToken, JWT_ACCESS_SECRET);

  if (!decoded) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
};

module.exports = {
  authenticateToken,
};
