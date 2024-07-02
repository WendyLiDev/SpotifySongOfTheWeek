# Spotify's Song of the Week

For this project, I wanted to be able to determine which songs I have been listening to on repeat the most for each week of the year. Using the Spotify API, I am able to create a new playlist, pull my recently listened to tracks, and add the most played song for every week.

## Goals

1. Store recently played tracks per user continuously
1. Create a playlist
1. Add a song to it each week
1. Support multiple users


## Technologies Used

- Node.js / Express.js
- Database - MongoDB
- Testing - Jest

## User creation (`SOTW`)

To add a user to the database, they first authenticate through Spotify. Then we store the auth token in the database so that we can continue to collect recently played tracks.

## Storing Recently Played Tracks (`CollectSongs`)
Since songs need to be continuously collected from users, this has been separated to be its own process so that it will be not effected by any issues that occur during user creation or determining the song of the week.

### Considerations
1. How often do we need to collect songs?
    1. Average song length on Spotify - ~3 minutes
    1. Maximum number of streams we can collect at a time - 50
    1. On average, we'll want to collect songs every atleast every 2.5 hours but to account for continous listens to shorter songs, the job will run every hour


## Determining the Song of the Week (`SeparatePlays`)

Every week for each user in the database, we store the recent plays in a map. That map contains contains a track id as a key and an array of unix timestamps as the value.

When we separate plays, we run through all the timestamps in the map and bucket each timestamp by week in a nested map that looks like so:

```
tracks_by_week { 
    week_1 : {
        track_id_1: [2024-05-19T00:23:00.000Z,
                     2024-05-20T00:00:00.000Z],
        track_id_2: [2024-05-19T00:04:30.000Z],
        track_id_3: [2024-05-19T00:02:01.000Z]
    },
    week_2 : {
        track_id_2: [2024-05-12T00:10:01.000Z],
        track_id_4: [2024-05-12T00:08:02.000Z],
    },
    ...
}
```

Afterwards, we are able to determine which song was the most played for each given week and add those songs to the "Song of the Week" playlist.

### Considerations
**How do we want to store the recent plays?**

Optimizing for reliability, I chose to store each stream as a timestamp rather than having a map that increments a counter each time `separatePlays` is run. This way, if there are errors or interruptions that occur for during this process, we are able to restart it without missing or double counting streams.

**How long should we store this data for?**

For this, I took into consideration that there could be an issue running this process at any given time since this process relies on being able to connect to the database as well as making calls to the Spotify API. Because of this, the user's recently played tracks data is stored for up to 4 weeks so this process can be restarted if there are any issues. (Currently set to 12 weeks during development)

## Upcoming & Future Thinking

1. For existing users, the site will show their most recently played tracks as well as the current top 3 songs for the week so far.
1. Changing the dillineation for start and end of a week based on the user's local timezone. Currently, the start and end of a week is based on UTC rather than the users local time zone which may cause some users confusion around why some song streams did or did not count towards a particular week.
