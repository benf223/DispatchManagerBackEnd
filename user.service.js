const config = require('./config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db.js');

// TODO adapt this to use our database functionality.

module.exports = {
	authenticate,
	create,
};

async function authenticate({ username, password }) {
	const user = await db.users.get(username);
	if (user && bcrypt.compareSync(password, user.hash)) {
		const { hash, ...userWithoutHash } = user.toObject();	// TODO
		const token = jwt.sign({ sub: user.id }, config.secret);
		return {
			...userWithoutHash,
			token
		};
	}
}

async function create(userParam) {
	// validate
	if (await db.users.get(userParam.username)) {
		throw 'Username "' + userParam.username + '" is already taken';
	}

	const user = db.users.insert(userParam);

	// hash password
	if (userParam.password) {
		user.hash = bcrypt.hashSync(userParam.password, 10);
	}

	// save user
	await user.save();	// TODO
}