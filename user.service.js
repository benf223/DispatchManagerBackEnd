const config = require('./config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db.js');

// TODO adapt this to use our database functionality.

module.exports = {
	authenticate,
	create,
	getByUsername,
};

async function authenticate(userData) {
	const user = await db.users.get(userData.username);

	if (user && bcrypt.compareSync(userData.password, user.password)) {
		console.log('matches');
		const token = jwt.sign({ sub: user.username }, config.secret);
		return {
			token
		};
	}
}

async function create(userParam) {
	// validate
	if (await db.users.get(userParam.username)) {
		throw 'Username "' + userParam.username + '" is already taken';
	}

	// hash password
	let hash = bcrypt.hashSync(userParam.password, 10);

	return db.users.register(userParam.firstName, userParam.lastName, userParam.username, hash);
}

async function getByUsername(username) {
	return await db.users.get(username);
}