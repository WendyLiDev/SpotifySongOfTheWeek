// routes/create.js

const axios = require('axios');
const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
    axios.post('http://localhost:8888/users', {})
    .catch(error => {
        console.error("Error sending post request to add a new user: ", error);
    });

    return res.status(200).redirect('/cooking');
});

module.exports = router
