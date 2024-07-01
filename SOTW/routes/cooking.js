// routes/cooking.js

const express = require('express');
const router = express.Router();
const login = require('./login');

router.get("/", async (req, res) => {
    // Get Current User's Recently Played Tracks and log plays
    let recentlyPlayed = [];
    await login.spotifyAuthAPI.getMyRecentlyPlayedTracks({
        limit : 50
    }).then(function(data) {
        data.body.items.forEach(item => {
            let name = item.track.name.toString();
            let artists = "";
            item.track.artists.forEach(artist => {
                artists += artist.name.toString() + ", ";
            })
            let streamInfo = name + " - " + artists;
            recentlyPlayed.push(streamInfo);
        })
    }, function(err) {
        console.log('Something went wrong getting recently played tracks', err);
    });

    console.log("typeof RecentlyPlayed: ", typeof recentlyPlayed);
    console.log("RecentlyPlayed: ", recentlyPlayed);
    res.render('./cooking', { data: recentlyPlayed });
})

module.exports = router