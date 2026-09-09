require('dotenv').config({ path: './.env' })

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/authRoutes')
const preferencesRoutes = require('./routes/preferencesRoutes')
const adminRoutes = require('./routes/adminRoutes')

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/preferences', preferencesRoutes)
app.use('/api/admin', adminRoutes)

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
