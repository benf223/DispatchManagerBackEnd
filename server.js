var express = require('express');
var app = express();
var dbHelper = require('./db.js');

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// var tmp = [
// 	{ value: 'hello' },
// 	{ value: 'test' }
// ];

// Used to wake up the Heroku App
app.get('/test', (req, res) => {
	// res.json(tmp);
});

app.get('/api/rounds/:date', (req, res) => {
	dbHelper.rounds.get(null).then((result) => {
		res.send(result);
	});
});

// This needs to better process the data returned from the database so that it trims it to fit the smaller format.
app.get('/api/releases/:date', (req, res) => {
	dbHelper.releases.get(null).then((result) => {
		res.send(result);
	})
});

// This needs to retrieve the whole release given the parameters
app.get('/api/full_releases/:data', (req, res) => {
	let params = req.params.data.split('@');
	res.send(dbHelper.releases.get('full'));
})

app.listen(process.env.PORT || 3000);
