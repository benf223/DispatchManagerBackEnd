var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var dbHelper = require('./db.js');
var jwt = require('./jwt.js');
var userService = require('./user.service');

app.use(bodyParser.json());
app.use(jwt());
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
	next();
});

var api = express.Router();
var auth = express.Router();

// Used to wake up the Heroku App
api.get('/start', (req, res) => {
});

// Rounds assigned to each truck on a given day
api.get('/rounds/:date', (req, res) => {
	let params = req.params.date;

	dbHelper.rounds.get(params).then((result) => {
		res.send(result);
	});
});

api.get('/releases/:date', (req, res) => {
	let params = req.params.date;

	// Query the truncated version
	dbHelper.releases.get(params).then((result) => {
		res.send(result.releases);
	});
});

// Retrieves all the full releases
api.get('/full_releases', (req, res) => {
	// Should retrieve all releases that were started within the past 30 days?
	dbHelper.fullReleases.get(null, null).then((result) => {
		res.send(result);
	})
});

// This needs to retrieve the whole release given the parameters
api.get('/full_releases/:releaseID', (req, res) => {
	// This is bad form need to change it.
	let params = req.params.releaseID.split('@');

	dbHelper.fullReleases.get(params[0], params[1]).then((result) => {
		res.send(result);
	})
});

// Gets a TruckRounds object from the frontend and will update the database with the new information
api.post('/update_rounds', (req, res) => {
	console.log('jdiosa');
	console.log(req.body);
	res.send({result: 200});
});

// Gets a Change object from the frontend and will update the truncated version of the releases in the database with the new information
api.post('/update_release', (req, res) => {
	console.log(req.body);

	// if (req.body.increase1) {
	// 	console.log(`Increase ${req.body.increase1.release}`);
	// 	dbHelper.releases.update(null, null);
	// }
	//
	// if (req.body.increase2) {
	// 	console.log(`Increase ${req.body.increase2.release}`);
	// 	dbHelper.releases.update(null, null);
	// }
	//
	// if (req.body.decrease1) {
	// 	console.log(`Decrease ${req.body.decrease1.release}`);
	// 	dbHelper.releases.update(null, null);
	// }
	//
	// if (req.body.decrease2) {
	// 	console.log(`Decrease ${req.body.decrease2.release}`);
	// 	dbHelper.releases.update(null, null);
	// }

	res.send({result: 200});
});

// Adds a new release to the FullReleases collection and then adds a truncated version to the Releases collection
api.post('/add_release', (req, res) => {
	console.log(req.body);
	res.sendStatus(200);
});

// Need to find and remove the release based on it's ID as given
api.delete('/delete_release/:release', (req, res) => {
	console.log(req.params.release);
	res.sendStatus(200);
});

auth.post('/register', (req, res) => {
	console.log(req.body);

	userService.create(req.body).then(() => res.json({}));

	user = {username: req.body.username, token: null};

	res.send(user);
	// res.sendStatus(200);
});

auth.post('/login', (req, res) => {
	console.log(req.body);

	userService.authenticate(req.body).then(user => user ? res.json(user) : res.status(400).json({message : 'Error authenticating'}));

	user = {username: req.body.username, token: 'hello'};

	res.send(user)
});

app.use('/api', api);
app.use('/auth', auth);

app.listen(process.env.PORT || 3000);
