// routes/users.js

const express = require('express');
const login = require('./login');
const mongoose = require('mongoose');

const router = express.Router();

/** ====== MongoDB ====== */
// Mongoose
const uri = `mongodb+srv://wendylicontact:${process.env.MONGO_PASS}@cluster0.2sadro0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});
mongoose.connect(uri);

const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId; 
const dbSOTW = "SOTW";
const userCollection = "users";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
/** ====== MongoDB ====== */

// Create
router.post('/', async (req, res) => {
    var user = {
        displayName: null,
        id: null,
        uri: null,
        email: null,
        pfp: null,
        mostRecentLoggedTrackAt: 0,
        recentPlayLog: new Map(),
        pastWeeksPlays: new Map(),
        lastUpdateTime: null,
        accessToken: null,
        refreshToken: null
    }

    // Get Current User's information
    await login.spotifyAuthAPI.getMe()
    .then(function(data) {
        user.displayName = data.body.display_name;
        user.id = data.body.id;
        user.uri = data.body.uri;
        user.email = data.body.email;
        user.pfp = data.body.images.url;
    }, function(err) {
        console.log('Something went wrong getting myself from Spotify!', err);
    });

    // Get Current User's Recently Played Tracks and log plays
    await login.spotifyAuthAPI.getMyRecentlyPlayedTracks({
        limit : 50
    }).then(function(data) {
        data.body.items.forEach(item => {
            if(Date.parse(user.mostRecentLoggedTrackAt) <
                Date.parse(item.played_at)) {
                // Push back the timestamp for the item track id
                if(user.recentPlayLog.has(item.track.id)) {
                    user.recentPlayLog.get(item.track.id).push(item.played_at);
                } else {
                    user.recentPlayLog.set(item.track.id, [item.played_at]);
                }
            }
        })
    }, function(err) {
        console.error('Something went wrong when retreiving recently played tracks for user creation!', err);
    });

    addUserToDB(user);
})

// Read
router.get('/', async (req, res) => {
    try {
        await client.connect();
        const database = client.db(dbSOTW);
        const collection = database.collection(userCollection);

        let dbUsers = await collection.find();
        await client.close();
        res.json(dbUsers);
    } catch (err) {
        res.status(500).send("Error fetching users");
    }
})

router.get('/:id', async (req, res) => {
    try {
        await client.connect();
        const database = client.db(dbSOTW);
        const collection = database.collection(userCollection);

        let dbUser = await collection.findOne({_id: new ObjectId(req.params.id)});
        await client.close();
        res.json(dbUser);
    } catch (err) {
        res.status(500).send("Error fetching user with id: ", req.params.id);
    }
})

// Update
router.put('/', (req, res) => {
})

// Delete
router.delete('/', (req, res) => {
})

async function addUserToDB(user) {
    await client.connect();
    const dbSOTW = "SOTW";
    const userCollection = "users";
    const database = client.db(dbSOTW);
    const collection = database.collection(userCollection);

    try {
        const exisitingDocument = await collection.findOne({id: user.id});
        if(!exisitingDocument) {
            await collection.updateOne(
                {id: user.id},
                [
                    { $set: {
                        displayName: user.displayName,
                        id: user.id,
                        uri: user.uri,
                        email: user.email,
                        pfp: user.pfp,
                        mostRecentLoggedTrackAt: user.mostRecentLoggedTrackAt,
                        recentPlayLog: user.recentPlayLog,
                        pastWeeksPlays: user.pastWeeksPlays,
                        lastUpdateTime: Date.now(),
                        accessToken: login.spotifyAuthAPI.getAccessToken(),
                        refreshToken: login.spotifyAuthAPI.getRefreshToken()
                    }},
                ], {upsert: true})
            console.log(`New user successfully inserted.\n`);
        } else {
            console.log("A user with this the id ", user.id, " already exists!")
        }
    } catch (err) {
        console.error(`Something went wrong trying to insert the new user: ${err}\n`);
    }
}

module.exports = router