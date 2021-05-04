const express = require('express');
const router = express.Router();
var request = require('request');
var querystring = require('querystring');
const { google, GoogleApis } = require('googleapis');
const cors = require("cors");
const urlParse = require("url-parse");
const queryParse = require("query-string");
const bodyParser = require("body-parser");
const axios = require("axios");
const { response } = require('express');
scopes = 'user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private';

var myToken; // google return url thing
var googleAPIKey = "" //your google api key

var client_id = ""; // Your client id
var client_secret = ""; // Your secret
var redirect_uri = 'http://localhost:8888/callback/'; // Your redirect uri

var google_client_id = "";
var google_client_secret = "";

var stateKey = 'spotify_auth_state';

var youtube = false; 
var spotify =false;
var apple = false; 
var atleastonelogin = false;

var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };


//could use bodyparser for inputs
  /* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
      youtube, 
      spotify, 
      apple, 
    atleastonelogin});
    });

var spotifytoken = '';
router.get('/loginSpotify', (req,res) => {
    var state = generateRandomString(16);
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scopes,
      redirect_uri: redirect_uri,
      state: state
    }));
});

var userspotifyid = '';
router.get('/callback', async (req, res) => {
    var code = req.query.code;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code'
        },
        headers: {
          'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
      };
      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
  
          var access_token = body.access_token,
              refresh_token = body.refresh_token;
            spotifytoken = access_token;
          var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };
  
          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            console.log(spotifytoken);
            console.log(body);
            userspotifyid = body.id;
            console.log(userspotifyid);
            //res.status(200).send('OK');
          });
          atleastonelogin = true;
          spotify = true;
          res.redirect('http://localhost:8888/');
        } else {
            res.redirect('/#' +
              querystring.stringify({
                error: 'invalid_token'
              }));
            }
        });
    });


router.get('/getPlaylist', async(req, res) => {
    if (spotify){
      res.redirect('http://localhost:8888/playlists')
    }

});


//limit number of playlists is 20
router.get('/playlists', async(req, res) => {
    var options = {
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: { 'Authorization': 'Bearer ' + spotifytoken },
        json: true
      };
    
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        let playlists = [];
        for (let playlist of response.body.items) {
          //console.log(playlists);
          //playlists.push(playlist.name);
          playlists.push({
              id:playlist.id,
              title: playlist.name
          });
        };
        res.render('about', {text:playlists});
    });

});

var tracksidspotify = [];
var tracknames = [];
router.get('/getPlaylistInfo/:Spotifyid', async(req, res) => {

    let playlistid = req.params.Spotifyid;
    var options = {
        url: 'https://api.spotify.com/v1/playlists/'+ `${playlistid}` + '/tracks',
        headers: { 'Authorization': 'Bearer ' + spotifytoken },
        json: true
      };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        for (let track of response.body.items) {
            console.log(track.track.id);
            console.log(track.track.name);
            tracksidspotify.push(track.track.id);
            tracknames.push(track.track.name);
            
        };
        console.log(tracksidspotify);
        res.redirect('/spotifyrecfromtrack');
      });  

});

var spotifyrec = [];
var spotifygenplaylistid = '';

router.get('/spotifyrecfromtrack', (req, res) => {

  //var stringoftracksidspotify = tracksidspotify.join(" ");
  var slice = tracksidspotify.slice(0,5);
  var tempstring = slice.join("%2C");
  console.log(tempstring);
  var options = {
    url: 'https://api.spotify.com/v1/recommendations?seed_tracks='+ tempstring,
    headers: { 'Authorization': 'Bearer ' + spotifytoken },
    json: true
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
    let recommendations = response.body;
    let sendinfo = [];
    for (let item of recommendations.tracks) {
      var temparrayartists = [];
      for (let artist of item.artists){
        temparrayartists.push(artist.name);
      };
      sendinfo.push({
      spotifyuri: item.uri,
      title: item.name,
      artist: temparrayartists,
      });
      spotifyrec.push(item.uri);
  }; 
  console.log(spotifyrec);  
  //res.status(200).send(sendinfo);
  //res.redirect('/getNewPlaylist');
  createNewPlaylistOnSpotify(userspotifyid, spotifytoken, addTracksToPlaylist);;
  res.status(200).send("Check Spotify account for new Playlist");
  });
});

router.get('/loginYoutube', (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    //client id
    google_client_id,
    //client secret
    google_client_secret,
    //link to redirect to
    "http://localhost:8888/artists"
  )
  const googleScopes = [ "https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/youtube"]
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: googleScopes,
    state: JSON.stringify({
      callbackUrl: req.body.callbackUrl,
      userID: req.body.userid
    })
  })

  request(url, (err, response, body) => {
    console.log("error: ", err);
    console.log("statusCode: ", response && response.statusCode);
    res.redirect(url);
  })
});

router.get('/artists', async (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    //client id
    google_client_id,
    //client secret
    google_client_secret,
    //link to redirect to
    "http://localhost:8888/artists"
  )

  const theURL = new urlParse(req.url);
  const code = queryParse.parse(theURL.query).code;
  const tokens = await oauth2Client.getToken(code); 
  myToken = tokens.tokens.access_token;
  res.render('artists');
})

router.post('/newPlaylist', (req, res) => {
  var artists = req.body.artist1;
  console.log(myToken);
  findArtistVideo(artists, myToken);
  res.render('newPlaylist');
})

function createNewPlaylistOnSpotify(spotifyid, token, addTracksToPlaylist){
  var options = {
    method: "POST",
    url:  'https://api.spotify.com/v1/users/' + spotifyid + '/playlists',
    headers: { 'Authorization': 'Bearer ' + token },
    json: true,
    body: {
        "description": "recommended songs",
        "public": true,
        "name": "Generated Playlist"
      } 
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body.id);
    spotifygenplaylistid = response.body.id;
    console.log(spotifyrec);
    addTracksToPlaylist(spotifygenplaylistid, spotifyrec);
    //res.status(200).send("Check Spotify account for new Playlist");
  });

}

function addTracksToPlaylist(playlistId, uris){
  var options = {
    method: "POST",
    url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=${uris}`,
    headers: { 'Authorization': 'Bearer ' + spotifytoken },
    json: true
    }
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body.id);

})
};

function findArtistVideo(artists, token) {
  var videoId = ""
  var options = {
    method: "GET",
    url: `https://www.googleapis.com/youtube/v3/search?q=${artists}&part=snippet&key=${googleAPIKey}&type=video`,
    json: true
  }
  request(options, function(error, response) {
    if(error) throw new Error(error);
    videoId = response.body.items[0].id.videoId;
    findRelatedVideos(videoId, token);
  })
  
}

function findRelatedVideos(videoId, token) {
  videoIds = []
  var options = {
    method: "GET",
    url: `https://www.googleapis.com/youtube/v3/search?part=snippet&key=${googleAPIKey}&type=video&relatedToVideoId=${videoId}&maxResults=10`,
    json: true
  }
  request(options, function(error, response) {
    if(error) throw new Error(error);
    var i;
    for(i = 0; i < 10; i++) {
      videoIds.push(response.body.items[i].id.videoId)
    }
    console.log(videoIds)
    createNewPlaylist(videoIds, token);
  })
}

function createNewPlaylist(videoIds, token) {
  console.log(token);
  var options = {
    method: "POST",
    url: `https://www.googleapis.com/youtube/v3/playlists?part=snippet,status`,
    headers: { 'Authorization': 'Bearer ' + token },
    body: {
      "snippet": {
        "title": "Recommended Playlist based on Artist",
        "defaultLanguage": "en"
      },
      "status": {
        "privacyStatus": "private"
      }
    },
    json: true
  }
  request(options, function(error, response) {
    if(error) throw new Error(error);
    var playlistId = response.body.id;
    console.log(playlistId);
    addSongsToPlaylist(playlistId, videoIds, token);
  })
}

function addSongsToPlaylist(playlistId, videoIds, token) {
  console.log("in addsongstoplaylist");
  console.log(token);
  var i;
  for(i=0; i < 10; i++) {
    var options = {
      method: "POST",
      url: `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet`,
      headers: { 'Authorization': 'Bearer ' + token },
      body: {
        "snippet": {
          "playlistId": playlistId,
          "position": i,
          "resourceId": {
            "kind": "youtube#video",
            "videoId": videoIds[i]
          }
        }
      },
      json: true
    }
    request(options, function(error, response) {
      if(error) throw new Error(error);
      console.log(response.body);
    })
  }
}

module.exports = router;