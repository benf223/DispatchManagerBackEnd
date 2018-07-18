/**
 * Author: Neil Read
 */

// Need to ensure that this will still function correctly as a helper object for server.js

const MongoClient = require("mongodb").MongoClient;
const util = require("./util");
const dbName = "recur_db"; // "test_db" or "recur_db"
const url = "mongodb://localhost:27017/" + dbName;
const locationTypes = ["Yard", "Port", "Rail"];

module.exports = class DB
{
	getReleases(day){
		//TODO Query the database and return the formatted data for the client side
		return { releases: [
			{release: '1', qty: 2, size: 40, colour: '#FF0000'},
			{release: '2', qty: 4, size: 20, colour: '#FF0000'},
			{release: '3', qty: 1, size: 40, colour: '#FFFF00'},
			{release: '4', qty: 5, size: 20, colour: '#FFFF00'},
			{release: '5', qty: 5, size: 20, colour: '#FFFF00'},
			{release: '6', qty: 5, size: 20, colour: '#FFFF00'},
			{release: '7', qty: 5, size: 20, colour: '#FF00FF'},
			{release: '8', qty: 5, size: 20, colour: '#FF00FF'},
			{release: '9', qty: 5, size: 20, colour: '#FF00FF'}
		]};
	}

	getRounds(day){

		//TODO Query the database and return the formatted data for the client side
		return { rounds: [
				{
					id: 'truck1', dayRounds:
						[
							{
								roundNumber: 1, slots:
									[
										{supports40: true, release: {release: 'testday1a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testday1b', size: 1, qty: 1, colour: '#FF0000'}
									}, {
										supports40: false,
										release: {release: 'testday1c', size: 1, qty: 1, colour: '#0000FF'}
									}
									]
							},
							{
								roundNumber: 2, slots:
									[
										{supports40: true, release: {release: 'testday2a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday2c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{supports40: true, release: {release: 'testday3a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday3b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday3c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{supports40: true, release: {release: 'testday4a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testday4b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday4c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{supports40: true, release: {release: 'testday5a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday5c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{supports40: true, release: {release: 'testday6a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday6c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testday7a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testday7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday7c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testday8a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday8c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							}
						],
					nightRounds:
						[
							{
								roundNumber: 1, slots:
									[
										{supports40: true, release: {release: 'testnight1a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight1b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight1c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 2, slots:
									[
										{supports40: true, release: {release: 'testnight2a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testnight2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight2c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{supports40: true, release: {release: 'testnight3a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight3b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight3c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{supports40: true, release: {release: 'testnight4a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight4b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight4c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{supports40: true, release: {release: 'testnight5a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testnight5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight5c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{supports40: true, release: {release: 'testnight6a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight6c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testnight7a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight7c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testnight8a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testnight8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight8c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							}
						]
				},
				{
					id: 'truck2', dayRounds:
						[
							{
								roundNumber: 1, slots:
									[
										{supports40: true, release: {release: 'testday1a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday1b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday1c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 2, slots:
									[
										{supports40: true, release: {release: 'testday2a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday2c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{supports40: true, release: {release: 'testday3a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testday3b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday3c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{supports40: true, release: {release: 'testday4a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday4b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday4c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{supports40: true, release: {release: 'testday5a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday5c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{supports40: true, release: {release: 'testday6a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testday6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday6c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testday7a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday7c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testday8a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday8c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							}
						],
					nightRounds:
						[
							{
								roundNumber: 1, slots:
									[
										{supports40: true, release: {release: 'testnight1a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testnight1b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight1c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 2, slots:
									[
										{supports40: true, release: {release: 'testnight2a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight2c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{supports40: true, release: {release: 'testnight3a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight3b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight3c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{supports40: true, release: {release: 'testnight4a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testnight4b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight4c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{supports40: true, release: {release: 'testnight5a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight5c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{supports40: true, release: {release: 'testnight6a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight6c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testnight7a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testnight7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight7c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testnight8a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight8c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							}
						],
				},
				{
					id: 'truck3', dayRounds:
						[
							{
								roundNumber: 1, slots:
									[
										{supports40: true, release: {release: 'testday1a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday1b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday1c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 2, slots:
									[
										{supports40: true, release: {release: 'testday2a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testday2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday2c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{supports40: true, release: {release: 'testday3a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday3b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday3c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{supports40: true, release: {release: 'testday4a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday4b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday4c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{supports40: true, release: {release: 'testday5a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testday5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday5c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{supports40: true, release: {release: 'testday6a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday6c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testday7a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testday7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday7c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testday8a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testday8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testday8c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							}
						],
					nightRounds:
						[
							{
								roundNumber: 1, slots:
									[
										{supports40: true, release: {release: 'testnight1a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight1b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight1c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 2, slots:
									[
										{supports40: true, release: {release: 'testnight2a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight2c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{supports40: true, release: {release: 'testnight3a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testnight3b', size: 1, qty: 1, colour: '#FF0000'}
									}, {supports40: false, release: {release: 'testnight3c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{supports40: true, release: {release: 'testnight4a', size: 1, qty: 1, colour: '#0000FF'}}, {
										supports40: true,
										release: {release: 'testnight4b', size: 1, qty: 1, colour: '#00FF00'}
									}, {supports40: false, release: {release: 'testnight4c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{supports40: true, release: {release: 'testnight5a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight5c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{supports40: true, release: {release: 'testnight6a', size: 1, qty: 1, colour: '#FF0000'}}, {
										supports40: true,
										release: {release: 'testnight6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight6c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testnight7a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testnight7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight7c', size: 1, qty: 1, colour: '#FF0000'}}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{supports40: true, release: {release: 'testnight8a', size: 1, qty: 1, colour: '#00FF00'}}, {
										supports40: true,
										release: {release: 'testnight8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {supports40: false, release: {release: 'testnight8c', size: 1, qty: 1, colour: '#00FF00'}}
									]
							}
						],
				}
			]};
	}

	async connectDB(callback)
	{
		let db = null;
		return await
			MongoClient.connect(url).then(async (val) =>
			{
				db = val;
				return await callback(db);
			}).then((val) =>
			{
				db.close();
			}).catch((err) =>
			{
				if (db) db.close();
				throw err;
			});
	}

	async update(collection, identifierQuery, updateQuery)
	{
		connectDB(async (db) =>
		{
			return await db.db(dbName).collection(collection).updateOne(identifierQuery, updateQuery);
		});
	}

	async removeLocation(name)
	{
		return await
			remove("locations", {name: name});
	}

	async removeDriver(name)
	{
		return await
			remove("drivers", {name: name});
	}

	async remove(collection, query)
	{
		connectDB(async (db) => await db.db(dbName).collection(collection).deleteOne(query));
	}

	async insert(collection, containsQuery, value)
	{
		let db = null;
		return await
			MongoClient.connect(url).then(async (val) =>
			{
				db = val;
				return await contains(collection, containsQuery);
			}).then(async (val) =>
			{
				if (val) throw new Error(collection + " already contains entry");
				return await db.db(dbName).collection(collection).insertOne(value);
			}).then(async (val) =>
			{
				db.close();
				return val.ops[0];
			}).catch((err) =>
			{
				if (db) db.close();
				throw err;
			});
	}

	/**
	 *
	 * @param {string} name
	 * @param {string} address
	 * @param {string} type - type of location out of 'Yard', 'Port' and 'Rail'
	 * @param {string} openingTime - 24 hour format hh:mm
	 * @param {string} closingTime - 24 hour format hh:mm
	 * @param {boolean} requiresBooking
	 */
	async insertLocation(name, address, type = "Yard", openingTime = null, closingTime = null, requiresBooking = false)
	{
		// To do: Check if address is valid for Google Maps API
		if (!locationTypes.includes(type)) throw new Error("Location type not valid");
		openingTime = util.parseTimeOfDay(openingTime);
		closingTime = util.parseTimeOfDay(closingTime);
		if (typeof(requiresBooking) != "boolean") throw new Error("Booking requirement invalid");

		let containsQuery = {$or: [{name: name}, {address: address}]};
		let entry = {
			name: name,
			address: address,
			type: type,
			openingTime: openingTime,
			closingTime: closingTime,
			requiresBooking: requiresBooking
		}

		return await
			insert("locations", containsQuery, entry).then((res) => res);
	}

	/**
	 *
	 * @param {string} name
	 * @param {*} availableDays
	 * @param {*} avoidLocations
	 */
	async insertDriver(name, availableDays, avoidLocations)
	{
		return await
			insert("drivers", null, {
				name: name,
				availableDays: availableDays,
				avoidLocations: avoidLocations
			}).then((res) => res);
	}

	/**
	 *
	 * @param {string} collection - Name of collection to search
	 * @param {Object} query - Query to filter search
	 */
	async queryDB(collection, query)
	{
		return await
			MongoClient.connect(url).then(async (db) =>
			{
				var docs = await db.db(dbName).collection(collection).find(query).toArray();
				db.close();
				return docs;
			});
	}

	async contains(collection, query)
	{
		return await
			queryDB(collection, query).then((docs) => docs.length > 0);
	}

};

/*class Collection
{
    constructor(validateFields)
    {
        this.validateFields = validateFields;
    }

    validate(fields)
    {
        fields.
    }
}*/

//this needs to be somewhere else (what does it do?)

// module.exports = {
// 	insertDriver,
// 	insertLocation,
// 	dbName
// }