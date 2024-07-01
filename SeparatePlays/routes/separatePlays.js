// SeparatePlays/routes/separatePlays.js
/**
 * The expectation for separatePlays is to run once a week and
 * take the recently played tracks and sort them into buckets by week
 */

const Cron = require("cron");
const dotenv = require('dotenv');
const express = require('express')
const separatePlaysRouter = express.Router()
const NUM_OF_WEEKS_TO_SAVE_RECENT_PLAYS = require("../constants");

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
/** ====== MongoDB ====== */

separatePlaysRouter.get("/", (req, res) => {
    separatePlays();
});

const separatePlays = async() => {
    console.log("Separating recently played tracks by week");

    await client.connect();
    const dbSOTW = "SOTW";
    const userCollection = "users";
    const database = client.db(dbSOTW);
    const collection = database.collection(userCollection);

    let dbUsers = await collection.find()
            dbUsers.forEach(dbUser => {
                if(dbUser.id !== null) {
                    separateByWeek(dbUser);
                }
            });

    // TODO: Run once a week
    // const job = new Cron.CronJob(
    //     '* * * * *', // cronTime
    //     async function () {
    //         console.log("Separate Plays cron job triggered");
    //         let dbUsers = await collection.find()
    //         dbUsers.forEach(dbUser => {
    //             if(dbUser.id !== null) {
    //                 separateByWeek(dbUser);
    //             }
    //         });
    //     }, // onTick
    //     null, // onComplete
    //     true, // start
    //     'America/Los_Angeles' // timeZone
    // );
}

const separateByWeek = async (dbUser) => {
  // Get recent plays and past weeks plays from DB
  let recentPlayLog = jsonToMap(dbUser.recentPlayLog);
  let pastWeeksPlays = jsonToMap(dbUser.pastWeeksPlays);
  // TODO: pastWeeksPlays contains a map within that also needs to be converted
  console.log("[Before Separate] RecentPlayLog: ", recentPlayLog);
  console.log("[Before Separate] pastWeeksPlays: ", pastWeeksPlays);

  sanitizePastWeeksPlaysMap(pastWeeksPlays);
  recentPlayLog = bucketTimestamps(recentPlayLog, pastWeeksPlays);

  dbUser.recentPlayLog = recentPlayLog;
  dbUser.pastWeeksPlays = pastWeeksPlays;

  console.log("Timestamps have been separated for user ", dbUser.id);
  console.log("recentPlayLog: ", recentPlayLogUpdated);
  console.log("pastWeeksPlays: ", pastWeeksPlays);

  // TODO: Uncomment this when separate plays funcationality works as expected
  // Update recentPlayLog and pastWeeksPlays in DB
  // updateUser(dbUser);
};

/**
 * Modifies pastWeeksPlays map to contain only the most up to date weeks
 * @param {Map} pastWeeksPlays 
 * @returns void
 */
function sanitizePastWeeksPlaysMap(pastWeeksPlays) {
  // Remove weeks that are older than the number of weeks to save
  pastWeeksPlays.forEach((value, key) => {
    if(ISO8601ToUTC(key) < getUTCForPastWeek(NUM_OF_WEEKS_TO_SAVE_RECENT_PLAYS)) {
      pastWeeksPlays.delete(key);
    }
  })

  // Populate Map with timestamps of the past weeks
  for(let i = 1; i <= NUM_OF_WEEKS_TO_SAVE_RECENT_PLAYS; ++i) {
    let weekStartTime = new Date(getUTCForPastWeek(i)).toISOString();
    if(!pastWeeksPlays.has(weekStartTime)){
      pastWeeksPlays.set(weekStartTime, new Map());
    }
  }
}

/**
 * 
 * @param {Map<TrackId, [ISO8601]>} recentPlayLog
 * @param {Map<ISO8601, Map<TrackId, [ISO8601]>>} pastWeeksPlays 
 * @returns Map - recentPlayLog updated 
 */
function bucketTimestamps(recentPlayLog, pastWeeksPlays) {
  let recentPlayLogUpdated = new Map();
  // Separate timestamps in recentPlayLog map into the correct weeks
  // of pastWeeksPlays map
  for (let [songId, songTimestampsList] of recentPlayLog) {
    songTimestampsList.forEach((timestamp) => {
        if(ISO8601ToUTC(timestamp) >= getUTCForPastWeek()) { // Timestamp is from this week
            // Keep timestamp in the updated recentPlayLog
            if(recentPlayLogUpdated.has(songId)) {
              let timestamps = recentPlayLogUpdated.get(songId);
              timestamps.push(timestamp);
              recentPlayLogUpdated.set(songId, timestamps);
            } else {
              recentPlayLogUpdated.set(songId, [timestamp]);
            }
        } else { // Timestamp is from a previous week
            let weekForTimestamp = findWeekForTimestamp(timestamp);
            if(weekForTimestamp === -1) {
              // Do nothing - discard timestamps that are too old
            } else {
              let weekMap = pastWeeksPlays.get(weekForTimestamp);
              if(weekMap === undefined) {
                weekMap = new Map();
              }
              if(weekMap.has(songId)) {
                let timestamps = weekMap.get(songId);
                timestamps.push(timestamp);
                weekMap.set(songId, timestamps);
              } else {
                weekMap.set(songId, [timestamp]);
              }
              pastWeeksPlays.set(weekForTimestamp, weekMap);
            }
        }
    })
  }
  return recentPlayLogUpdated;
}

/**
 * 
 * @param {ISO8601} timestamp
 * @returns ISO8601 Timestamp - The week the timestamp belongs to
 */
function findWeekForTimestamp(timestamp) {
  if(ISO8601ToUTC(timestamp) < 0) {
    throw new Error("Timestamp cannot be a negative number");
  }

  for(let i = 0; i < NUM_OF_WEEKS_TO_SAVE_RECENT_PLAYS; ++i){
    let weekStartTime = getUTCForPastWeek(i);
    if(ISO8601ToUTC(timestamp) - weekStartTime >= 0) {
      return new Date(weekStartTime).toISOString();
    }
  }
  // Timestamp is older than we save
  return -1;
}

/**
 * Default gets the UTC time for the last Sunday at 00:00:00
 * @param {int} numOfWeeksAgo Sets how many weeks ago we get
 * the time stamp for, default is set to 0 for the last occurence of the weekday
 * @param {int} weekdayOffset Sets the day of the week we get
 * the timestamp for, should be a value 0 - 6 and the default is set to 0 for Sunday 
 * @returns UTC timestamp in milliseconds - For the requested weekday for the number of weeks ago
 */
function getUTCForPastWeek(numOfWeeksAgo = 0, weekdayOffset = 0) {
    const milisecsInDay = 86400000;
    var dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const weekday = dayStart.getDay() + 1;
    return dayStart.getTime() - (numOfWeeksAgo * milisecsInDay * 7) - (milisecsInDay * weekday) + (milisecsInDay * (weekdayOffset % 7));
}

/**
 * 
 * @param {ISO8601} isoTimestamp 
 * @returns Unix timestamp
 */
function ISO8601ToUTC(isoTimestamp) {
  let iso = isoTimestamp;
  if(typeof isoTimestamp === "object") {
    iso.toString();
  }
  return new Date(iso);
}

/**
 * When getting a map from the DB, the data is
 * returned to us as a JSON object
 * 
 * Helper to convert JSON object to Map
 * @param {*} jsonObject 
 * @returns an object of type map
 */
function jsonToMap(jsonObject) {
    const map = new Map();
    for (const key in jsonObject) {
      if (jsonObject.hasOwnProperty(key)) {
        map.set(key, jsonObject[key]);
      }
    }
    return map;
}

async function updateUser(user) {
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

separatePlaysRouter.separatePlays = separatePlays;
module.exports = {
  separatePlaysRouter,
  findWeekForTimestamp,
  getUTCForPastWeek,
  sanitizePastWeeksPlaysMap,
};
