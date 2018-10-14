/**
 * Author: Neil Read
 * 
 * Interface enabling access and manipulation of database.
 * 
 * Database actions include get(), getAll(), insert(), update() or remove() for each collection
 * e.g. locations.insert(), releases.remove()
 */

 // MLab Login user: recur_admin pass: recur_admin123

const MongoClient = require("mongodb").MongoClient;
const util = require("./util");
const je = require("./journeyEstimator");

const PATH = require("./config.json").dbPath;

var mongod = null;
var db = null;

const LocationTypeEnum = {
    yard: 0,
    port: 1,
    rail: 2,
    parse: (s) => parseEnum(s, LocationTypeEnum),
    toString: (e) => getEnumString(e, this)
}

const TruckTypeEnum = {
    tribox: 0,
    skeletal: 1,
    parse: (s) => parseEnum(s, TruckTypeEnum),
    toString: (e) => getEnumString(e, this)}

/**
 * Returns name of enum value.
 *
 * @param {number}: enumeration value
 * @param {Object}: enumeration type
 */
function getEnumString(e, type)
{
    return Object.keys(type)[e];
}

/**
 * Returns enum value from a string
 *
 * @param {string}: enumeration name
 * @param {Object}: enumeration type
 */
function parseEnum(s, type)
{
    let e = type[s.trim().toLowerCase()];
    if(e || e == 0) return e;
    else throw new Error("'" + s + "' cannot be parsed.");
}

/**
 * @param {number}: enumeration value
 * @param {Object}: enumeration type
 *
 * @returns true if enumeration maps to a value
 */
function isValidEnum(e, type)
{
    return typeof Object.keys(type)[e] != "undefined";
}

/**
 * Location that containers are delivered to/from
 * 
 * Properties:
 * 	{string} date - Date of associated rounds, must be unique
 * 	{Object[]} truckRounds
 *  {string} truckRounds[i].id - ID of associated truck
 *  {Object[]} truckRounds[i].dayRounds - Rounds for truck during the day
 *  {number} truckRounds[i].dayRounds[j].roundNumber - Index of round
 *  {string[]} truckRounds[i].dayRounds[j].slots - Release numbers of associated releases for round
 * 	{Object[]} truckRounds[i].nightRounds - Rounds for truck during the night
 *  {number} truckRounds[i].nightRounds[j].roundNumber - Index of round
 *  {string[]} truckRounds[i].nightRounds[j].slots - Release numbers of associated releases for round
 *  
 */
const rounds = {
	// TODO Receive rounds for a day and truck from id given and replace with passed truck stuff

	insert: async (date, truckRounds) =>
	{
		// TODO This was missing an argument added null temporarily
		return await insert("rounds", {date: date, truckRounds: truckRounds}, null);
	},

	replaceTruckRounds: async (date, truckID, newRounds) =>
	{
		currentRounds = await rounds.get(date);
		currentRounds.truckRounds[indexOf(currentRounds.truckRounds.find(t => t.id === newRounds.id))] = newRounds;
		return await update("rounds", {date: date}, currentRounds);
	},

	// gets entry by date, inserts empty entry if none is there
	get: async (date) =>
	{
		return await get("truckRounds", {date: date});
	},

	getAll: async () =>
	{
		return await getAll("truckRounds");
	}
}

// First name, last name, username, password

// Login: get username and hashed password
// Register: sees if user in table
const users = {
	register: async (firstName, lastName, username, password) =>
	{
		return await insert("users", {username: username}, {firstName: firstName, lastName: lastName, username: username, password: password});
	},

	update: async (username, query) =>
	{
		for(p in query)
		{
			switch(p)
			{
				case "firstName":
				case "lastName":
					break;
				case "username":
					if(await contains("users", {username: query[p]})) throw new Error("users already contains entry '" + query.username + "'");
					break;
				case "password": 
					query[p] = encrypt(query[p]);
					break;
				default:
					throw new Error("'" + p + "' is not a valid property");
			}
		}

		return await update("users", {username: username}, query);
	},

	remove: async (username) =>
	{
		return await remove("users", {username: username});
	},

	get: async (username) =>
	{
		return await get("users", {username: username});
	},

	getAll: async () =>
	{
		return await getAll("users");
	},

	contains: async (username) =>
	{
		return await contains("users", {username: username});
	}
};

/**
 * Location that containers are delivered to/from
 * 
 * Properties:
 * 	{string} name: name of location, must be unique
 * 	{string} address: Location's address, must be unique, must be an address tracked by the Google Maps API
 * 	{string | number} type: Type of location, must be a value of LocationTypeEnum or its name as a string ('Yard', 'Port', 'Rail')
 * 	{string} [openingTime]: Time of day when location is opened, in 24 hour format 'hh:mm'
 * 	{string} [closingTime]: Time of day when location is closed, in 24 hour format 'hh:mm'
 * 	{boolean} [requiresBooking]: Whether or not a booking must be made before containers are moved.
 */
const locations = {
    /**
     * @param {string} name
     * @param {(string | number)} type
     * @param {string} [openingTime]
     * @param {string} [closingTime]
     * @param {boolean} [requiresBooking]
     */
    insert: async (name, address, type = "Yard", openingTime = null, closingTime = null, requiresBooking = false) =>
    {
        // Check required arguments
        if(!name) throw new Error("A name must be supplied");
        if(!address) throw new Error("An address must be supplied");

        // Validate address
        if(!(await je.validateAddress(address))) throw new Error("Address '" + address + "' not found");

        // Validate location type
        try
        {
            if(typeof type == "string") containerType = LocationTypeEnum.parse(type);
            else if(!isValidEnum(type, LocationTypeEnum)) throw new Error();
        }
        catch(err)
        {
            throw new Error("Location type '" + type + "' is not a valid type");
        }

        // Validate times
        try
        {
            openingTime = util.parseTimeOfDay(openingTime);
        }
        catch(err)
        {
            throw new Error("Invalid opening time: " + err.message);
        }

        try
        {
            closingTime = util.parseTimeOfDay(closingTime);
        }
        catch(err)
        {
            throw new Error("Invalid closing time: " + err.message);
        }

        // Check opening time is before closing time
        if(!util.timeOfDayIsBefore(openingTime, closingTime)) throw new Error("Opening time must be before closing time");

        requiresBooking = requiresBooking ? true : false;
    
        let containsQuery = {$or: [{ name: name }, { address: address }]};
        let entry = {
            name : name, 
            address : address, 
            type : type, 
            openingTime : openingTime, 
            closingTime : closingTime, 
            requiresBooking : requiresBooking
        };
    
        return await insert("locations", containsQuery, entry);
	},
	/**
	 * @param {string} name
	 * @param {Object} query
	 * @param {string} [query.name]
	 * @param {string} [query.address]
	 * @param {string | number} [query.type]
	 * @param {string} [query.openingTime]
	 * @param {string} [query.closingTime]
	 * @param {boolean} [query.requiresBooking]
	 */
    update: async (name, query) =>
    {
		// Validate each passed property
		for(p in query)
		{
			switch(p)
			{
				// Check name is not already stored in database
				case "name":
					if(await contains("locations", {name: query[p]})) throw new Error("locations already contains entry '" + query[p] + "'");
					break;
				// Check address is not already stored in database and is tracked by the Distance Matrix API
				case "address":
					if(await contains("locations", {address: query[p]})) throw new Error("locations already contains entry with address '" + query[p] + "'");
					if(!(await je.validateAddress(query[p]))) throw new Error("Address '" + query[p] + "' not found");
					break;
				// Check valid type is passed
				case "type":
					try
					{
						if(typeof query[p] == "string") value = LocationTypeEnum.parse(query[p]);
						else if(!isValidEnum(query[p], LocationTypeEnum)) throw new Error();
					}
					catch(err)
					{
						throw new Error("Location type '" + query[p] + "' is not a valid type");
					}
					break;
				// Parses and validates times
				case "openingTime":
					query[p] = util.parseTimeOfDay(query[p]);
					if(query.closingTime) query.closingTime = util.parseTimeOfDay(query.closingTime);

					// Checks new opening time is before new or current closing time
					if(!util.timeOfDayIsBefore(query[p], query.closingTime || (await locations.get(name)).closingTime)) throw new Error("Opening time must be before closing time");
					break;
				case "closingTime":
					query[p] = util.parseTimeOfDay(query[p]);

					// Checks new closing time is after new or current opening time if opening time not updated
					if(!query.openingTime && !util.timeOfDayIsBefore((await locations.get(name)).openingTime, query[p])) throw new Error("Closing time must be after opening time");
					break;
				case "requiresBooking": break;
				// Invalid property passed
				default:
					throw new Error("'" + p + "' is not a valid property");
			}
		}

        return await update("locations", {name: name}, query);        
	},
	/**
	 * @param {string} name
	 */
    remove: async (name) =>
    {
		// If release exists that uses this location
		let dependent = await get("releases", {$or: [{ from: name }, { from: name }]});
		if(dependent)
		{
			throw new Error("Release '" + dependent.number + "' depends on entry '" + name + "'");
		}
        return await remove("locations", {name: name});
    },
    /**
     * @param {string} name
     */
    get: async (name) =>
    {
        return await get("locations", {name: name});
    },
    getAll: async () =>
    {
        return await getAll("locations");
	},
	contains: async (name) =>
	{
		return await contains("locations", {name: name});
	}
};

/**
 * Trucks used for making deliveries
 * 
 * Properties:
 * 	{string} name: name of truck, must be unique
 * 	{string | number} type: Type of truck, must be a value of TruckTypeEnum or its name as a string
 */
const trucks = {
    /**
     * @param {string} name
     * @param {(string | number)} type
     */
    insert: async (name, type) =>
    {
        // Validate required arguments
        if(!name) throw new Error("A name must be supplied");

        // Validate type
        try
        {
            if(typeof type == "string") containerType = TruckTypeEnum.parse(type);
            else if(!isValidEnum(type, TruckTypeEnum)) throw new Error();
        }
        catch(err)
        {
            throw new Error("Truck type '" + type + "' is not a valid type");
        }

        return await insert("trucks", {name: name}, {name: name, type: type});
	},
	/**
	 * @param {string} name
	 * @param {Object} query
	 * @param {string} [query.name]
	 * @param {string | number} [query.type]
	 */
    update: async (name, query) =>
    {
		// Validate each passed property
		for(p in query)
		{
			switch(p)
			{
				// Check name does not already exist in collection
				case "name":
					if(await contains("trucks", {name: query[p]})) throw new Error("trucks already contains entry '" + query.name + "'");
					break;
				// Check type is valid
				case "type":
					try
					{
						if(typeof query[p] == "string") query[p] = TruckTypeEnum.parse(query[p]);
						else if(!isValidEnum(query[p], TruckTypeEnum)) throw new Error();
					}
					catch(err)
					{
						throw new Error("Truck type '" + query[p] + "' is not a valid type");
					}
					break;
				// Invalid property passed
				default:
					throw new Error("'" + p + "' is not a valid property");
			}
		}
        return await update("trucks", {name: name}, query);
	},
	/**
	 * @param {string} name
	 */
    remove: async (name) =>
    {
        return await remove("trucks", {name: name});
	},
	/**
	 * @param {string} name
	 */
    get: async (name) =>
    {
        return await get("trucks", {name: name});
    },
    getAll: async () =>
    {
        return await getAll("trucks");
    }
};

//TODO make small releases table

// Update: pass id, day, boolean for up or down 1
// Insert: release_number, size, qty, color
// Edit: Given release id, delete record and replace with releas
// Remove: remove from given id

const smallReleases = {
	insert: async (date, releaseNumber, size, quantity, colour) =>
	{
		entry = {
			date: date,
			releaseNumber: releaseNumber,
			size: size,
			quantity: quantity,
			colour: colour
		}
		return await insert("smallReleases", {releaseNumber: releaseNumber}, entry);
	},

	incOrDecQuantity: async (date, releaseNumber, up) =>
	{
		let quantity = (await get("smallReleases", {date: date, releaseNumber: releaseNumber})).quantity;
		return await update("smallReleases", {date: date, releaseNumber: releaseNumber}, {quantity : (up ? quantity + 1 : quantity - 1) });
	},

	remove: async (releaseNumber) =>
	{
		return await remove("smallReleases", {releaseNumber: releaseNumber});
	},

	get: async (date) =>
	{
		return (await get("smallReleases", {date: date})).toArray();
	},

	getAll: async () =>
	{
		return await getAll("smallReleases");
	}
}

/**
 * Orders for container deliveries received by clients
 * 
 * Properties:
 * 	{string} number: ID of release, must be unique
 * 	{string} client: Name of client
 * 	{number} quantity20ft: Number of 20ft containers to be delivered, must be integer >= 0
 * 	{number} quantity40ft: Number of 40ft containers to be delivered, must be integer >= 0, both quantities cannot be 0
 * 	{Date} acceptanceDate: Date client will begin to accept deliveries
 * 	{Date} cutoffDate: Date deliveries must be completed by
 * 	{string} from: Location containers will be retrieved from, must correspond to name in 'locations' collection
 * 	{string} from: Location containers will be delivered to, must correspond to name in 'locations' collection
 */
const releases = {
    /**
     * @param {string} number
     * @param {string} client
	 * @param {number} quantity20ft
	 * @param {number} quantity40ft
     * @param {Date} acceptanceDate
     * @param {Date} cutoffDate
     * @param {string} from: must match location name from database
     * @param {string} to: must match location name from database
     */
    insert: async (number, client, quantity20ft, quantity40ft, acceptanceDate, cutoffDate, from, to) =>
    {
        // Check required arguments
        if(!number) throw new Error("A release number is required");
        if(!client) throw new Error("A client is required");

		// Checks quantities are positive integers
		if(!Number.isInteger(quantity20ft) || quantity20ft < 0) throw new Error("20ft container quantity '" + quantity20ft + "' must be zero or a positive integer");
		if(!Number.isInteger(quantity40ft) || quantity40ft < 0) throw new Error("40ft container quantity '" + quantity40ft + "' must be zero or a positive integer");

		// Checks that both properties are not undefined/0
		if(!quantity20ft && !quantity40ft) throw new Error("At least one quantity must be positive");
		
        // Validate dates
        if(!(acceptanceDate instanceof Date)) throw new Error("'" + acceptanceDate + "' is not a valid date");
        if(!(cutoffDate instanceof Date)) throw new Error("'" + cutoffDate + "' is not a valid date");
        
        // Check acceptance date is before cutoff
        if(cutoffDate.getTime() <= acceptanceDate.getTime()) throw new Error("Cutoff '" + util.parseDateString(cutoffDate) + "' is before acceptance date '" + util.parseDateString(acceptanceDate) + "'");
        
        //Check addresses are different
        if(from == to) throw new Error("Source and destination addresses are identical");
        
        // Check address are in database
        if(!(await contains("locations", {name: from}))) throw new Error("Cannot find address '" + from + "'");
        if(!(await contains("locations", {name: to}))) throw new Error("Cannot find address '" + to + "'");

        let entry = {
            number: number,
            client: client,
			quantity20ft: quantity20ft,
			quantity40ft: quantity40ft,
            acceptanceDate: acceptanceDate,
            cutoffDate: cutoffDate,
            from: from,
            to: to
        }
        return await insert("releases", {number: number}, entry);
	},
	/**
	 * @param {string} number
	 * @param {Object} query
	 * @param {string} [query.number]
	 * @param {string} [query.client]
	 * @param {number} [query.quantity20ft]
	 * @param {number} [query.quantity40ft]
	 * @param {Date} [query.acceptanceDate]
	 * @param {Date} [query.cutoffDate]
	 * @param {string} [query.from]
	 * @param {string} [query.to]
	 */
    update: async (number, query) =>
    {
		// Validate passed properties
		for(p in query)
		{
			switch(p)
			{
				// Check number does not exist in collection
				case "number":
					if(await contains("releases", {name: query[p]})) throw new Error("releases already contains entry '" + p[query] + "'");
					break;
				// For both quantities, check that they are zero or positive integers and both are not zero
				case "quantity20ft":
					if(!Number.isInteger(query[p]) || query[p] < 0) throw new Error("20ft container quantity '" + query[p] + "' must be a positive integer");
					if(!query[p] && (query.quantity40ft == 0 || (await releases.get(number)).quantity40ft == 0)) throw new Error("At least one quantity must be positive");
					break;
				case "quantity40ft":
					if(!Number.isInteger(query[p]) || query[p] < 0) throw new Error("40ft container quantity '" + query[p] + "' must be a positive integer");
					if(!query[p] && (query.quantity20ft == 0 || (await releases.get(number)).quantity20ft == 0)) throw new Error("At least one quantity must be positive");
					break;
				// Validate dates
				case "acceptanceDate":
					if(!(query[p] instanceof Date)) throw new Error("'" + query[p] + "' is not a valid date");
					let cutoff = query.cutoffDate || (await releases.get(number)).cutoffDate;
					if(!(cutoff instanceof Date)) throw new Error("'" + cutoff + "' is not a valid date");
					if(cutoff.getTime() <= query[p].getTime()) throw new Error("Acceptance date '" + util.parseDateString(query[p]) + "' is after or on cut-off '" + util.parseDateString(cutoff) + "'");
					break;
				case "cutoffDate":
					// If query contains acceptance date, cut-off is already validated
					if(!query.acceptanceDate)
					{
						if(!(query[p] instanceof Date)) throw new Error("'" + query[p] + "' is not a valid date");
						let acceptanceDate = (await releases.get(number)).acceptanceDate;
						if(query[p].getTime() <= acceptanceDate.getTime()) throw new Error("Acceptance date '" + util.parseDateString(acceptanceDate) + "' is after or on cut-off '" + util.parseDateString(query[p]) + "'");
					}
					break;
				// Checks addresses are in database and are not the same
				case "from":
					if(!(await contains("locations", {name: query[p]}))) throw new Error("Cannot find address '" + query[p] + "'");
					let to = query.to || (await get("releases", {number: number})).to;
					if(query[p] == to) throw new Error("Start and end location are identical");
				case "to":
					if(!(await contains("locations", {name: query[p]}))) throw new Error("Cannot find address '" + query[p] + "'");
					if(!query.from && query[p] == (await get("releases", {number: number})).from) throw new Error("Start and end location are identical");
				case "client": break;
				// Invalid property passed
				default:
					throw new Error("'" + p + "' is not a valid property");
			}
		}
        return await update("releases", {number: number}, query);
	},
	/**
	 * @param {string} number
	 */
    remove: async (number) =>
    {
        return await remove("releases", {number: number});
	},
	/**
	 * @param {string} number
	 */
	get: async (number) =>
	{
		return get("releases", {number: number});
	},

	getAll: async () =>
	{
		return await getAll("releases");
	},

	contains: async (number) =>
	{
		return await contains("releases", {number: number});
	}
};

/**
 * Initializes database connection
 * @param {string} name
 */
async function start(path = PATH)
{
    return await MongoClient.connect(path).then(async (val) =>
    {
        mongod = val;
		db = val.db();
    }).catch((err) =>
    {
        if(mongod) mongod.close();
        throw err;
    });
}

// Close database
async function close()
{
    mongod.close();
}

/**
 * Returns a single entry from a collection based on the given query
 *
 * @param {string} collection
 * @param {Object} query
 */
async function get(collection, query)
{
    return await db.collection(collection).findOne(query, {projection: {_id: false}});
}

/**
 * Returns all entries in the given collection as an array
 *
 * @param {string} collection
 */
async function getAll(collection)
{
    return await db.collection(collection).find({}, { projection :{ _id: false }}).toArray();
}

async function update(collection, identifierQuery, updateQuery)
{
	return await db.collection(collection).findOneAndUpdate(identifierQuery, {$set: updateQuery}, {returnNewDocument: true}).then((res) =>
	{
		// Entry was not found
		if(!res.value) throw new Error("No entry '" + util.getFirstProperty(identifierQuery) + "' found");
		return res.value;
	});
}

async function remove(collection, query)
{
	return await db.collection(collection).findOneAndDelete(query).then((res) =>
	{
		if(!res.value) throw new Error("No entry '" + util.getFirstProperty(query) + "' found");
		return res.value;
	});
}

/**
 * Inserts a single entry into a given collection.
 *
 * @param {string} collection
 * @param {Object} containsQuery: If specified and an entry already exists based on this query, throws error
 * @param {Object} value
 *
 * @returns {Object} the inserted value
 */
async function insert(collection, containsQuery, value)
{
    // Checks entry does not already exist
    return await contains(collection, containsQuery).then(async (val) =>
    {
		if(val)
		{
			let prop = util.getFirstProperty(containsQuery);
			prop = typeof(prop) === "object" ? "" : " '" + prop + "'";
			throw new Error(collection + " already contains entry" + prop);
		}
        return await db.collection(collection).insertOne(value);
    }).then((val) =>
    {
        return val.ops[0];
    });
}

/**
 * @param {string} collection: Name of the collection to be checked
 * @param {Object} query: Query to match with elements in the collection
 *
 * @returns true if the element is in the collection
 */
async function contains(collection, query)
{
    return await db.collection(collection).findOne(query).then((val) =>
    {
        return val != null;
	});
}

function encrypt(str)
{
	return bcrypt.hashSync(str, bcrypt.genSaltSync(SALT_WORK_FACTOR));
}

function getDB()
{
    return db;
}

module.exports = {
    users,
    locations,
    releases,
    trucks,
    start,
    close,
    getDB,
    LocationTypeEnum,
    TruckTypeEnum,
    rounds,
	smallReleases
};