const xss = require('xss');

const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe'],
};

const sanitizeString = (s) => (typeof s === 'string' ? xss(s, xssOptions) : s);

const deepSanitize = (val) => {
  if (val == null) return val;
  if (typeof val === 'string') return sanitizeString(val);
  if (Array.isArray(val)) return val.map(deepSanitize);
  if (typeof val === 'object') {
    for (const k of Object.keys(val)) val[k] = deepSanitize(val[k]);
    return val;
  }
  return val;
};

module.exports = (req, res, next) => {
  try {
    if (req.body) req.body = deepSanitize(req.body);
    if (req.query) req.query = deepSanitize(req.query);
    if (req.params) req.params = deepSanitize(req.params);
  } catch {}
  next();
};

