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
	async getReleases(day){
		//TODO Query the database and return the formatted data for the client side
		return { releases: day };
	}

	async getRounds(day){
		//TODO Query the database and return the formatted data for the client side
		return { rounds: day };
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