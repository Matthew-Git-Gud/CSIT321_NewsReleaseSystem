const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../config/database')

const createToken = (user) => jwt.sign(
  {
    user_id: user.user_id,
    username: user.username,
    role: user.role,
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' },
)

const register = async (req, res) => {
  try {
    const { full_name, username, email, password } = req.body

    if (!full_name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM users WHERE username = ? OR email = ?',
      [username, email],
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await pool.execute(
      `INSERT INTO users
       (username, email, password_hash, full_name)
       VALUES (?, ?, ?, ?)`,
      [username, email, passwordHash, full_name],
    )

    return res.status(201).json({ message: 'Registration successful' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Server error' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email],
    )

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = users[0]

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is suspended' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = createToken(user)

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    })

    return res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Server error' })
  }
}

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })

  return res.json({ message: 'Logout successful' })
}

const getCurrentUser = (req, res) => {
  return res.json({ user: req.user })
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
}
