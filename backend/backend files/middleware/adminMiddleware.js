const requireAdmin = (req, res, next) => {
  // The verified JWT contains the user's role; never rely on a role sent by the browser.
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Administrator access is required' })
  }

  next()
}

module.exports = requireAdmin
