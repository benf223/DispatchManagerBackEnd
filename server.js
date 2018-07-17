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

// app.get('/planning', (res, req) => {
// 	res.send('hello there');
// });
//
// app.get('/planning/:date', (res, req) => {
// 	res.send('general kenobi');
// });

app.get('/api/rounds/:date', (res, req) => {
	res.send(dbHelper.getRounds(req.day));
});

app.get('/api/releases/:date', (res, req) => {
	res.send(dbHelper.getReleases(req.day));
})

app.listen(62176);