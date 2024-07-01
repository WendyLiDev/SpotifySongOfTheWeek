const express = require('express')
const app = express()

const PORT = 8080;

const { separatePlaysRouter } = require('./routes/separatePlays')
app.use('/separatePlays', separatePlaysRouter)

app.use(express.static('public'))

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('./index')   
})

app.listen(PORT, () => {
    // Separate songs
    separatePlaysRouter.separatePlays();
})

