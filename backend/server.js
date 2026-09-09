require('dotenv').config({ path: './.env' })

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const routes = require('./routes/routes')

const app = express()

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
)

app.use(express.json())
app.use(cookieParser())

app.use('/api', routes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})