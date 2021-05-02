const express = require('express');
//router
var indexRouter = require('./routes/index');
const app = express();
const { google } = require("googleapis");
const request = require("request");
const cors = require("cors");
const urlParse = require("url-parse");
const queryParse = require("query-string");
const bodyParser = require("body-parser");
const axios = require("axios");


const PORT = process.env.PORT || 8888;
//Set Views
app.set('views', './views');
app.set('view engine', 'ejs');

//create middleware static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


//router
app.use('/', indexRouter);


//error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// app.get('/loginYoutube', (req, res) => {
//     const oauth2Client = new google.auth.OAuth2(
//       //client id
//       "701543701254-18brjpn5lc3mr8m8hmtr8ql8fkcl9p3a.apps.googleusercontent.com",
//       //client secret
//       "zUnUpV1D9fN9fpPh52_yCTBY",
//       //link to redirect to
//       "http://localhost:8888/getArtists"
//     )
//     const googleScopes = [ "https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/youtube"]
//     const url = oauth2Client.generateAuthUrl({
//       access_type: "offline",
//       scope: googleScopes,
//       state: JSON.stringify({
//         callbackUrl: req.body.callbackUrl,
//         userID: req.body.userid
//       })
//     })
  
//     request(url, (err, response, body) => {
//       console.log("error: ", err);
//       console.log("statusCode: ", response && response.statusCode);
//       res.send({url});
//     })
//     //youtube=true; // replace with actual login thing later
//     // res.render('index', {
//     //   youtube, 
//     //   spotify, 
//     //   apple, 
//     // atleastonelogin});
//   });

app.listen(PORT,() => console.log(`Server started on port ${PORT}`));