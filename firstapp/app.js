const express = require('express');
//router
var indexRouter = require('./routes/index');
const app = express();



const PORT = process.env.PORT || 8888;
//Set Views
app.set('views', './views');
app.set('view engine', 'ejs');

//create middleware static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));
app.use(express.urlencoded({
    extended: true
}))

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

app.post('/newPlaylist', (req, res) => {
    res.send('You sent the following artists: ' + req.body.artist1 + ", " + req.body.artist2 + ", " + req.body.artist3 + ", " + req.body.artist4 + ", " + req.body.artist5);
})

app.listen(PORT,() => console.log(`Server started on port ${PORT}`));