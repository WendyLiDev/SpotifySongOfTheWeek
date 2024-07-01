const express = require('express')
const app = express()

const PORT = 8080;

const collectRouter = require('./routes/collect')
app.use('/collect', collectRouter)

app.use(express.static('public'))

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('./index')   
})

app.listen(PORT, () => {
    collectRouter.startCollectingTrackPlays();
})

