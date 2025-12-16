module.exports = (req, res, next) => {
  const user = req.user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso restrito a administradores' });
  }

  next();
};