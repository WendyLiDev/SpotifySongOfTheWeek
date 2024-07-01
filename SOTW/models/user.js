const { Schema } = require("mongoose");

const user = new Schema({
    displayName: String,
    id: String,
    uri: String,
    email: String,
    pfp: String,
    mostRecentLoggedTrackAt: Date,
    recentPlayLog: Map,
    pastWeeksPlays: Map,
    lastUpdateTime: Date,
    accessToken: String,
    refreshToken: String
});

