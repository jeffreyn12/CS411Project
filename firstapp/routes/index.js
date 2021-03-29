const express = require('express');
const router = express.Router();
var request = require('request');
var querystring = require('querystring');
scopes = 'user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private';


var client_id = ''; // Your client id
var client_secret = ''; // Your secret
var redirect_uri = 'http://localhost:8888/callback/'; // Your redirect uri

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

// router.get('/getNewPlaylist', async (req,res) => {

//   var options = {
//     method: "POST",
//     url:  'https://api.spotify.com/v1/users/' + userspotifyid + '/playlists',
//     headers: { 'Authorization': 'Bearer ' + spotifytoken },
//     json: true,
//     body: {
//         "description": "recommended songs",
//         "public": true,
//         "name": "Generated Playlist"
//       } 
//   };
//   console.log(options)

//   request(options, function (error, response) {
//     if (error) throw new Error(error);
//     console.log(response.body.id);
//     spotifygenplaylistid = response.body.id;
//     console.log(spotifyrec);
//     addTracksToPlaylist(spotifygenplaylistid, spotifyrec);
//     res.status(200).send("Check Spotify account for new Playlist");
//   });
// });

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


module.exports = router;