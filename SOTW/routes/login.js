// login.js
// Authenticate with Spotify

const dotenv = require('dotenv');
const express = require('express')
const router = express.Router()
const SpotifyWebApi = require("spotify-web-api-node");

dotenv.config();

const PORT = process.env.PORT || 8888;
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SECRET_KEY = process.env.SPOTIFY_CLIENT_SECRET;
const RED_URI = process.env.RED_URI || `http://localhost:${PORT}/login/callback`;

const spotifyAuthAPI = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: SECRET_KEY,
  redirectUri: RED_URI,
});

router.get("/", (req, res) => {
  const generateRandomString = (length) => {
    let text = "";
    let possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  const stateString = generateRandomString(16);

  const scopes = ["user-read-private user-read-email user-library-read user-read-recently-played playlist-modify-public playlist-modify-private playlist-modify-public playlist-modify-private"];
  const loginLink = spotifyAuthAPI.createAuthorizeURL(scopes, stateString);
  res.redirect(loginLink);
});

router.get('/callback', function(req, res) {
  // if (req.query.state !== req.cookies["authState"]) {
  //     // States don't match, send the user away.
  //     return res.redirect("/");
  // }
  
  const authenticationCode = req.query.code;
  if (authenticationCode) {
      spotifyAuthAPI.authorizationCodeGrant(authenticationCode).then((data) => {
        const access_token = data.body['access_token'];
        const refresh_token = data.body['refresh_token'];
        const expires_in = data.body['expires_in'];
  
        spotifyAuthAPI.setAccessToken(access_token);
        spotifyAuthAPI.setRefreshToken(refresh_token);

        console.log('access_token:', access_token);
        console.log('refresh_token:', refresh_token);
  
        console.log(
          `Sucessfully retreived access token. Expires in ${expires_in} s.`
        );

        setInterval(async () => {
          const data = await spotifyAuthAPI.refreshAccessToken();
          const access_token = data.body['access_token'];
  
          console.log('The access token has been refreshed!');
          console.log('access_token:', access_token);
          spotifyAuthAPI.setAccessToken(access_token);
        }, expires_in / 2 * 1000);
  
        return res
          .status(301).redirect('/create');
      },
      function(err) {
        console.log('Something went wrong during authentication!', err);
      });
    }
});

router.spotifyAuthAPI = spotifyAuthAPI;
module.exports = router