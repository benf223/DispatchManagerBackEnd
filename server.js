//https://demo-recur-api.herokuapp.com

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jwt = require('./jwt.js');
var userService = require('./user.service');
var dbHelper = require('./db.js');

app.use(bodyParser.json());
app.use(jwt());
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
	res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
	next();
});

var api = express.Router(null);
var auth = express.Router(null);

// Used to wake up the Heroku App
api.get('/start', (req, res) => {
	// res.sendStatus(200);
	// userService.create({username: 'admin', password: 'test', firstName: 'admin', lastName: 'istrator'});
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
	dbHelper.smallReleases.get(params).then((result) => {
		res.send(result.releases);
	});
});

// Retrieves all the full releases
api.get('/full_releases', (req, res) => {
	// Should retrieve all releases that were started within the past 30 days?
	dbHelper.releases.getAll().then((result) => {
		res.send(result);
	})
});

// This needs to retrieve the whole release given the parameters
api.get('/full_releases/:releaseID', (req, res) => {
	// This is bad form need to change it.
	let params = req.params.releaseID.split('@');

	// params[0] == date
	// params[1] == release id
	dbHelper.releases.get(params[1]).then((result) => {
		res.send(result);
	})
});

// Gets a TruckRounds object from the frontend and will update the database with the new information
api.post('/update_rounds/:date', (req, res) => {
	console.log(req.body);
	console.log(req.params.date);

	dbHelper.rounds.replaceTruckRounds(req.params.date, req.truckID).then((result) => {
		// Verification here?
		res.send({result: 200});
	});
});

// Gets a Change object from the frontend and will update the truncated version of the releases in the database with the new information
api.post('/update_release/:date', (req, res) => {
	console.log(req.body);
	console.log(req.params.date);

	if (req.body.increase1) {
		console.log(`Increase ${req.body.increase1.release}`);
		dbHelper.smallReleases.incOrDecQuantity(req.params.date, req.body.increase1.release, true).then((result) => {
			// Verification here?
			res.send({result: 200});
		});
	}

	if (req.body.increase2) {
		console.log(`Increase ${req.body.increase2.release}`);
		dbHelper.smallReleases.incOrDecQuantity(req.params.date, req.body.increase2.release, true).then((result) => {
			// Verification here?
			res.send({result: 200});
		});
	}

	if (req.body.decrease1) {
		console.log(`Decrease ${req.body.decrease1.release}`);
		dbHelper.smallReleases.incOrDecQuantity(req.params.date, req.body.decrease1.release, false).then((result) => {
			// Verification here?
			res.send({result: 200});
		});
	}

	if (req.body.decrease2) {
		console.log(`Decrease ${req.body.decrease2.release}`);
		dbHelper.smallReleases.incOrDecQuantity(req.params.date, req.body.decrease2.release, false).then((result) => {
			// Verification here?
			res.send({result: 200});
		});
	}
});

// Adds a new release to the FullReleases collection and then adds a truncated version to the Releases collection
api.post('/add_release', (req, res) => {
	console.log(req.body);

	dbHelper.releases.insert('', '', 0, 0, null, null, '', '').then((result) => {
		// Verification here?
		dbHelper.smallReleases.insert(null, null, null, null, null).then((result) => {
			// Verification here?
			res.send({result: 200});
		})
	});
});

api.post('/edit_release', (req, res) => {
	console.log(req.body);

	// TODO need to remove the release from the rounds (or cleverly reassign it (other team))

	dbHelper.releases.remove(req.body.release.release).then((result) => {
		// Verification here?
		dbHelper.smallReleases.remove(req.body.release.release).then((result) => {
			// Verification here?
			dbHelper.releases.insert('', '', 0, 0, null, null, '', '').then((result) => {
				// Verification here
				dbHelper.smallReleases.insert(null, null, null, null, null, null).then((result) => {
					// Verification here
					res.send({result: 200});
				})
			});
		});
	});
});

// Need to find and remove the release based on it's ID as given
api.delete('/delete_release/:release', (req, res) => {
	console.log(req.params.release);

	dbHelper.releases.remove(req.params.release).then((result) => {
		// Verification here?
		dbHelper.smallReleases.remove(req.params.release).then((result) => {
			// Verification here
			res.send({result: 200});
		})
	});

	// TODO need to remove the release from the rounds
});

auth.post('/register', (req, res) => {
	console.log(req.body);

	userService.create(req.body).then(() => res.json({}));
});

auth.post('/login', (req, res) => {
	console.log(req.body);

	userService.authenticate(req.body).then(user => user ? res.json(user) : res.status(400).json({message : 'Error authenticating'}));
});

app.use('/api', api);
app.use('/auth', auth);

app.listen(process.env.PORT || 3000, () =>
{
	console.log("Server running");
	dbHelper.start();
});
