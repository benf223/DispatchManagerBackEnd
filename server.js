var express = require('express');
var app = express();
var db = require('./db.js');
var dbHelper = new db();

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

var tmp = [
	{ value: 'hello' },
	{ value: 'test' }
];

app.get('/test', (req, res) => {
	res.json(tmp);
});

app.get('/api/rounds/:date', (req, res) => {
	res.send(dbHelper.getRounds(null));
});

app.get('/api/releases/:date', (req, res) => {
	res.send(dbHelper.getReleases(null));
})

app.get('/api/full_releases/:data', (req, res) => {
	let params = req.params.data.split('@');
	res.send(dbHelper.getFullRelease(params[0], params[1]));
})

app.listen(process.env.PORT || 3000);
