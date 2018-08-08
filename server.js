var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var dbHelper = require('./db.js');

app.use(bodyParser.json());

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

var api = express.Router();
var auth = express.Router();

// Used to wake up the Heroku App
api.get('/start', (req, res) => {
});

api.get('/rounds/:date', (req, res) => {
	dbHelper.rounds.get(null).then((result) => {
		res.send(result);
	});
});

// This needs to better process the data returned from the database so that it trims it to fit the smaller format.
api.get('/releases/:date', (req, res) => {
	dbHelper.releases.get(null).then((result) => {
		res.send(result);
	});
});

// This needs to retrieve the whole release given the parameters
api.get('/full_releases/:data', (req, res) => {
	let params = req.params.data.split('@');
	res.send(dbHelper.releases.get('full'));
});

auth.post('/test', (req, res) => {
	console.log(req.body);
	res.sendStatus(200);
});

app.use('/api', api);
app.use('/auth', auth);

app.listen(process.env.PORT || 3000);
