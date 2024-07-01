// routes/collect.js
const Cron = require("cron");
const dotenv = require('dotenv');
const express = require('express')
const router = express.Router()
const SpotifyWebApi = require("spotify-web-api-node");

dotenv.config();
/** ====== MongoDB ====== */
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://wendylicontact:${process.env.MONGO_PASS}@cluster0.2sadro0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally { }
}
run().catch(console.dir);
/** ====== MongoDB ====== */
const PORT = process.env.PORT || 8080;
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SECRET_KEY = process.env.SPOTIFY_CLIENT_SECRET;
const RED_URI = process.env.RED_URI || `http://localhost:${PORT}/collect`;

const spotifyAuthAPI = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: SECRET_KEY,
  redirectUri: RED_URI,
});

router.get("/", (req, res) => {
    startCollectingTrackPlays();
});

const startCollectingTrackPlays = async() => {
    console.log("Starting collection of your recently played tracks");
    await client.connect();
    const dbSOTW = "SOTW";
    const userCollection = "users";
    const database = client.db(dbSOTW);
    const collection = database.collection(userCollection);

    const job = new Cron.CronJob(
        '0,30 * * * *', // cronTime
        async function () {
            console.log("cron job triggerred");
            // [READ] Get user info from database
            // TODO: Getting all users and all their information here does not seem scalable
            let dbUsers = await collection.find()
            dbUsers.forEach(dbUser => {
                if(dbUser.id !== null) {
                    setUser(dbUser);
                }
            });
        }, // onTick
        null, // onComplete
        true, // start
        'America/Los_Angeles' // timeZone
    );
}

const login = async(dbUser) => {
    spotifyAuthAPI.setAccessToken(dbUser.accessToken);
    spotifyAuthAPI.setRefreshToken(dbUser.refreshToken);
}

const refresh = async() => {
    var data;
    try {
        data = await spotifyAuthAPI.refreshAccessToken();
    } catch (err) {
        console.error(`Something went wrong trying to refresh the access token: ${err}\n`);
    }
    const access_token = data.body['access_token'];

    console.log('The access token has been refreshed!');
    console.log('access_token:', access_token);
    spotifyAuthAPI.setAccessToken(access_token);
}

const setUser = async(dbUser) => {
    try {
        await login(dbUser);
    } catch (err) {
        console.error(`Something went wrong trying to login for user: ${err}\n`);
    }

    try {
        await refresh();
    } catch (err) {
        console.error(`Something went wrong trying to refresh and set the access token: ${err}\n`);
    }

    var updatedUserInfo = {
        displayName: dbUser.displayName,
        id: dbUser.id,
        uri: dbUser.uri,
        email: dbUser.email,
        pfp: dbUser.pfp,
        mostRecentLoggedTrackAt: dbUser.mostRecentLoggedTrackAt,
        firstLoggedTrackOfWeek: dbUser.firstLoggedTrackOfWeek,
        recentPlayLog: jsonToMap(dbUser.recentPlayLog),
        pastWeeksPlays: dbUser.pastWeeksPlays,
        lastUpdateTime: dbUser.lastUpdateTime,
        accessToken: spotifyAuthAPI.getAccessToken(),
        refreshToken: dbUser.refreshToken
    };

    // Get Current User's Recently Played Tracks and log plays
    spotifyAuthAPI.getMyRecentlyPlayedTracks({
        limit : 50
    }).then(function(data) {
        data.body.items.forEach(item => {
            if(Date.parse(updatedUserInfo.mostRecentLoggedTrackAt) < Date.parse(item.played_at)) {
                // Push back the timestamp for the item track id
                if(updatedUserInfo.recentPlayLog.has(item.track.id)) {
                    updatedUserInfo.recentPlayLog.get(item.track.id).push(item.played_at);
                    console.log(Date.parse(item.played_at), " Updated: ", item.track.name);
                } else {
                    updatedUserInfo.recentPlayLog.set(item.track.id, [item.played_at]);
                    console.log(Date.parse(item.played_at), " Added: ", item.track.name);
                }
            }
        })
        if(data.body.items.size > 0) {
            updatedUserInfo.mostRecentLoggedTrackAt = data.body.items[0].played_at;
        }

        updateUser(updatedUserInfo);
        console.log("Updated recentPlayLog for user : ", updatedUserInfo.id);
        // console.log(updatedUserInfo.recentPlayLog);
        
    }, function(err) {
        console.log('Something went wrong when retreiving recently played tracks for track collection!', err);
    });
}

// Function to convert JSON object to Map
function jsonToMap(jsonObject) {
    const map = new Map();
    for (const key in jsonObject) {
      if (jsonObject.hasOwnProperty(key)) {
        map.set(key, jsonObject[key]);
      }
    }
    return map;
  }

async function updateUser(user){
    await client.connect();
    const dbSOTW = "SOTW";
    const userCollection = "users";
    const database = client.db(dbSOTW);
    const collection = database.collection(userCollection);

    try {
        collection.updateOne(
            {id: user.id},
            [
                { $set: {
                    displayName: user.displayName,
                    id: user.id,
                    uri: user.uri,
                    email: user.email,
                    pfp: user.pfp,
                    mostRecentLoggedTrackAt: user.mostRecentLoggedTrackAt,
                    firstLoggedTrackOfWeek: user.firstLoggedTrackOfWeek,
                    recentPlayLog: user.recentPlayLog,
                    pastWeeksPlays: user.pastWeeksPlays,
                    lastUpdateTime: Date.now(),
                    accessToken: spotifyAuthAPI.getAccessToken(),
                    refreshToken: spotifyAuthAPI.getRefreshToken()
                }},
            ]
        );
        console.log("Updated user with id: ", user.id);
    } catch (err) {
        console.error(`Something went wrong trying to update info for user: ${err}\n`);
    }
}

router.startCollectingTrackPlays = startCollectingTrackPlays;
module.exports = router