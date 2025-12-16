const crypto = require('crypto');

module.exports = (req, res, next) => {
  try {
    const rid = req.headers['x-request-id'] || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    req.requestId = rid;
    res.setHeader('X-Request-Id', rid);
  } catch {}
  next();
};
