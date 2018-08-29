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

// Rounds assigned to each truck on a given day
api.get('/rounds/:date', (req, res) => {
	let params = req.params.date;

	dbHelper.rounds.get(params).then((result) => {
		res.send(result);
	});
});

// This needs to better process the data returned from the database so that it trims it to fit the smaller format.
api.get('/releases/:date', (req, res) => {
	let params = req.params.date;

	dbHelper.releases.get(null, params).then((result) => {
		res.send(result.releases);
	});
});

// Retrieves all the full releases?
api.get('/full_releases', (req, res) => {
	// Should retrieve all releases that were started within the past 30 days?
	dbHelper.releases.get('fuller', null).then((result) => {
		res.send(result);
	})
});

// This needs to retrieve the whole release given the parameters
api.get('/full_releases/:releaseID', (req, res) => {
	// This is bad form need to change it.
	let params = req.params.releaseID.split('@');

	dbHelper.releases.get('full@' + params[0], params[1]).then((result) => {
		res.send(result);
	})
});

// Requires a truckID and a truck with it's slots and will replace the whole thing in the database
api.post('/update_rounds', (req, res) => {
	console.log(req.body);
	res.sendStatus(200);
});

// Gets a Change object from the frontend and will update the database with the new information
// This will have side effects consider having two separate tables for releases
// ie: Full Releases and the Data that is being sent to the frontend for the planning sheet
// This would also improve the other aspects of the backend assuming it can keep itself maintained well enough
api.post('/update_release', (req, res) => {
	console.log(req.body);

	if (req.body.increase1) {
		console.log(`Increase ${req.body.increase1.release}`);
		dbHelper.releases.update(null, null);
	}

	if (req.body.increase2) {
		console.log(`Increase ${req.body.increase2.release}`);
		dbHelper.releases.update(null, null);
	}

	if (req.body.decrease1) {
		console.log(`Decrease ${req.body.decrease1.release}`);
		dbHelper.releases.update(null, null);
	}

	if (req.body.decrease2) {
		console.log(`Decrease ${req.body.decrease2.release}`);
		dbHelper.releases.update(null, null);
	}

	res.sendStatus(200);
})

auth.post('/test', (req, res) => {
	console.log(req.body);
	res.sendStatus(200);
});

app.use('/api', api);
app.use('/auth', auth);

app.listen(process.env.PORT || 3000);
