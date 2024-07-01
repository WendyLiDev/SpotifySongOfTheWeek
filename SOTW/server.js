const express = require('express')
const app = express()

const cookieParser = require("cookie-parser");
app.use(cookieParser());
require("dotenv").config();

const loginRouter = require('./routes/login')
const createRouter = require('./routes/create')
const cookingRouter = require('./routes/cooking')
const usersRoutes = require('./routes/users')
app.use('/login', loginRouter)
app.use('/create', createRouter)
app.use('/cooking', cookingRouter)
app.use('/users', usersRoutes)

app.use(express.static('public'))

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('./index')
})

app.listen(8888)
