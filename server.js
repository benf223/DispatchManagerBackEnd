var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jwt = require('./jwt.js');
var userService = require('./user.service');
var dbWrapper = require('./db.js');

app.use(bodyParser.json());
// app.use(jwt());
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
});

// Rounds assigned to each truck on a given day
api.get('/rounds/:date', (req, res) => {
	let params = req.params.date;

	dbWrapper.rounds.get(params).then((result) => {
		res.send(result);
	}, (e) => {
		res.send(null);
	});
});

// Retrieves small releases for a given day
api.get('/releases/:date', (req, res) => {
	let params = req.params.date;

	// Query the truncated version
	dbWrapper.smallReleases.get(params).then((result) => {
		if (result) {
			res.send(result.releases);
		} else {
			res.send(null);
		}

	}, (e) => {
		res.send(null);
	});
});

// Retrieves all the full releases
api.get('/full_releases', (req, res) => {
	// Should retrieve all releases that were started within the past 30 days?
	dbWrapper.releases.getAll().then((result) => {
		res.send(result);
	})
});

// Retrieves a full release for a given id
api.get('/full_releases/:releaseID', (req, res) => {
	// This is bad form need to change it.
	let params = req.params.releaseID.split('@');

	// params[0] == date
	// params[1] == release id
	dbWrapper.releases.get(params[1]).then((result) => {
		res.send(result);
	})
});

// Receives a TruckRounds object from the frontend and updates the database with the new information
api.post('/update_rounds/:date', (req, res) => {
	dbWrapper.rounds.replaceTruckRounds(req.params.date, req.truckID).then((result) => {
		// Verification here?
		res.send({result: 200});
	});
});

// Receives a Change object from the frontend and updates the truncated version of the releases in the database with the new information
api.post('/update_release/:date', (req, res) => {
	if (req.body.increase1) {
		dbWrapper.smallReleases.incOrDecQuantity(req.params.date, req.body.increase1.release, true).then((result) => {
			// Verification here?
			res.send({result: 200});
		});
	}

	if (req.body.increase2) {
		dbWrapper.smallReleases.incOrDecQuantity(req.params.date, req.body.increase2.release, true).then((result) => {
			// Verification here?
			res.send({result: 200});
		});
	}

	if (req.body.decrease1) {
		dbWrapper.smallReleases.incOrDecQuantity(req.params.date, req.body.decrease1.release, false).then((result) => {
			// Verification here?
			res.send({result: 200});
		});
	}

	if (req.body.decrease2) {
		dbWrapper.smallReleases.incOrDecQuantity(req.params.date, req.body.decrease2.release, false).then((result) => {
			// Verification here?
			res.send({result: 200});
		});
	}
});

// Receives a new release and adds it to the FullReleases collection and then adds a truncated version to the SmallReleases collection
api.post('/add_release', (req, res) => {
	let data = req.body;

	dbWrapper.releases.insert(data.receivedDate, data.release, data.client, data.route, data.qtyTwenty, data.qtyForty, data.choose, data.containerType, data.containerNumbers, data.dueDate, data.dueTime
		, data.reference, data.notes, data.status, data.completeDate, data.invoiced, data.colour).then((result) => {
		// Verification here?
		if (data.qtyTwenty)
		{
			dbWrapper.smallReleases.insert(data.receivedDate, data.release, 20, data.qtyTwenty, data.colour).then((result) => {
				// Verification here?
				if (data.qtyForty)
				{
					dbWrapper.smallReleases.insert(data.receivedDate, data.release, 40, data.qtyForty, data.colour).then((result) => {
						// Verification here?
						res.send({result: 200});
					})
				}
			})
		} else if (data.qtyForty) {
			dbWrapper.smallReleases.insert(data.receivedDate, data.release, 40, data.qtyForty, data.colour).then((result) => {
				// Verification here?
				res.send({result: 200});
			})
		}
	});
});

// Receives a FullRelease containing changes and replaces the release currently stored
// TODO need to remove the release from the rounds (or cleverly reassign it (other team))
api.post('/edit_release', (req, res) => {
	let data = req.body;

	dbWrapper.releases.remove(req.body.release.release).then((result) => {
		// Verification here?
		dbWrapper.smallReleases.remove(req.body.release.release).then((result) => {
			// Verification here?
			dbWrapper.releases.insert(data.receivedDate, data.release, data.client, data.route, data.qtyTwenty, data.qtyForty, data.choose, data.containerType, data.containerNumbers, data.dueDate, data.dueTime
				, data.reference, data.notes, data.status, data.completeDate, data.invoiced, data.colour).then((result) => {
				// Verification here
				if (data.qtyTwenty)
				{
					dbWrapper.smallReleases.insert(data.receivedDate, data.release, 20, data.qtyTwenty, data.colour).then((result) => {
						// Verification here?
						if (data.qtyForty)
						{
							dbWrapper.smallReleases.insert(data.receivedDate, data.release, 40, data.qtyForty, data.colour).then((result) => {
								// Verification here?
								res.send({result: 200});
							})
						}
					})
				} else if (data.qtyForty) {
					dbWrapper.smallReleases.insert(data.receivedDate, data.release, 40, data.qtyForty, data.colour).then((result) => {
						// Verification here?
						res.send({result: 200});
					})
				}
			});
		});
	});
});

// Receives a release id and deletes it from the database
// TODO need to remove the release from the rounds
api.delete('/delete_release/:release', (req, res) => {
	dbWrapper.releases.remove(req.params.release).then((result) => {
		// Verification here?
		dbWrapper.smallReleases.remove(req.params.release).then((result) => {
			// Verification here
			res.send({result: 200});
		})
	});
});

// Receives a user object and attempts to create a new user
auth.post('/register', (req, res) => {
	userService.create(req.body).then((result) => res.json({message: result.firstName + ' ' + result.lastName + ' has been registered as: ' + result.username}));
});

// Receives a user object and attempts to create a authentication token
auth.post('/login', (req, res) => {
	userService.authenticate(req.body).then((user) => {
		res.send(user);
	});
});

app.use('/api', api);
app.use('/auth', auth);

// Starts the server and initialises the database connection
app.listen(process.env.PORT || 3000, () =>
{
	dbWrapper.start().then(() => {
		console.log('Started Database');
	}, (e) => {
		console.log(e);
	});

	console.log('Started Listening');
});
