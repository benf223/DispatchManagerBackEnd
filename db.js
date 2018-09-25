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
const bcrypt = require("bcrypt");

const PATH = "mongodb://admin:admin123@ds113703.mlab.com:13703/recur_test_db";
const SALT_WORK_FACTOR = 10;

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
    toString: (e) => getEnumString(e, this)
}

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

const truckRounds = {
	/**
	 * @param {string} id
	 * @param {Object[]} [dayRounds]
	 * @param {number} dayRounds.roundNumber
	 * @param {String[]} dayRounds.slots - Array of all associated release numbers 
	 * @param {Object[]} [nightRounds]
	 * @param {number} nightRounds.roundNumber
	 * @param {String[]} nightRounds.slots - Array of all associated release numbers 
	 */
	insert: (id, dayRounds = [], nightRounds = []) =>
	{
		// Checks all releases exist in database
		/*for(const d of dayRounds.concat(nightRounds))
		{
			for(const r of d.slots)
			{
				if(!contains("release", {number: r}))
				{
					throw new Error("Release '" + r + "' does not exist");
				}
			}
		}*/
		return insert("truckRounds", {id: id}, {id: id, dayRounds: dayRounds, nightRounds: nightRounds});
	},

	/**
	 * @param {string} id
	 * @param {string} dayOrNight - whether to add to day or night rounds, should be 'D' or 'N'
	 */
	addReleaseToRound: async (id, dayOrNight, roundNumber, releaseNumber) =>
	{
		if(dayOrNight !== "D" && dayOrNight !== "N") throw new Error("dayOrNight must be 'D' or 'N'");
		if(!(await releases.contains(releaseNumber))) throw new Error("Release " + releaseNumber + " does not exist");
		let t = await truckRounds.get(id);
		let rounds = dayOrNight === "D" ? t.dayRounds : t.nightRounds;
		if(roundNumber < 0 || roundNumber >= rounds.length) throw new Error("Round number " + roundNumber + " not between 0 - " + (rounds.length - 1));
		rounds[roundNumber].push(releaseNumber);
		if(dayOrNight === "D")
		{
			update("truckRounds", {id: id}, {dayRounds: t.dayRounds});
		}
		else
		{
			update("truckRounds", {id: id}, {nightRounds: t.nightRounds});
		}
	},

	/**
	 * @param {string} id
	 * @param {string} dayOrNight - whether to add to day or night rounds, should be 'D' or 'N'
	 */
	addRelease: async (id, dayOrNight, roundNumber, releaseNumber) =>
	{
		if(dayOrNight !== "D" && dayOrNight !== "N") throw new Error("dayOrNight must be 'D' or 'N'");
		if(!(await releases.contains(releaseNumber))) throw new Error("Release " + releaseNumber + " does not exist");
		let t = await truckRounds.get(id);
		let rounds = dayOrNight === "D" ? t.dayRounds : t.nightRounds;
		let entry = rounds.find((s) => s.roundNumber === roundNumber);
		if(!entry) throw new Error("No round number '" + roundNumber + "' exists");
		return entry.push(releaseNumber);
	},

	removeRelease: async (id, dayOrNight, roundNumber, releaseNumber) =>
	{
		if(dayOrNight !== "D" && dayOrNight !== "N") throw new Error("dayOrNight must be 'D' or 'N'");
		let t = await truckRounds.get(id);
		let rounds = dayOrNight === "D" ? t.dayRounds : t.nightRounds;
		let entry = rounds.find((s) => s.roundNumber === roundNumber);
		if(!entry) throw new Error("No round number '" + roundNumber + "' exists");
		
	},

	removeReleaseFromSlotsAux: async (releaseNum, slots) =>
	{
		for(let i = 0; i < slots.length; i++)
		{
			if(slots[i] === releaseNum)
			{
				slots[i] = null;
			}
		}

		return slots;
	},

	removeReleaseFromSlots: async (releaseNum, date, dayOrNight, roundNumber, slots = null) =>
	{
		/*entry = await truckRounds.get(date);
		let rounds = dayOrNight == "D" ? entry.dayRounds : entry.nightRounds;
		let slots = removeReleaseFromSlotsAux(rounds[roundNumber]);*/

		
		
	},

	removeReleaseFromRounds: async (releaseNum, date, dayOrNight) =>
	{

	},

	removeReleaseInRounds: (releaseNum, rounds) =>
	{
		for(s of rounds)
		{
			for(let i = 0; i < s.length; i++)
			{
				if(s[i] === releaseNum)
				{
					s[i] = null;
				}
			}
		}

		return rounds;
	},

	removeReleaseFromAllRounds: async (releaseNum, date = null, dayOrNight = null, roundNumber = null, currentEntry = null) =>
	{
		//let date = util.getTodaysDate();
		while(date.getDate() <= await truckRounds.getLatestDate.getDate())
		{
			let truckRounds = await truckRounds.get(date);
			truckRounds.dayRounds = truckRounds.removeReleaseInRounds(releaseNum, truckRounds.dayRounds);
			truckRounds.nightRounds = truckRounds.removeReleaseInRounds(releaseNum, truckRounds.nightRounds);
			update("truckRounds", {id: date}, {dayRounds: truckRounds.dayRounds, nightRounds: truckRounds.nightRounds});
			date.setDate(date.getDate() + 1);
		}
	},

	getLatestDate: async() =>
	{
		return await get("truckRounds", {}).sort({"id": -1}).limit(1);
	},

	get: async (id) =>
	{
		return await get("truckRounds", {id: id});
	},

	getDayRounds: async (id) =>
	{
		return await truckRounds.get(id).dayRounds;
	},

	getNightRounds: async (id) =>
	{
		return await truckRounds.get(id).nightRounds;
	},

	cancelRound: async (id, dayOrNight, roundNumber, slotIndex) =>
	{
		if(dayOrNight !== "D" && dayOrNight !== "N") throw new Error("dayOrNight must be 'D' or 'N'");
		let t = await truckRounds.get(id);
		let rounds = dayOrNight === "D" ? t.dayRounds : t.nightRounds;
		let entry = rounds.find((s) => s.roundNumber === roundNumber);
		if(!entry) throw new Error("No round number '" + roundNumber + "' exists");
		entry[slotIndex] = null;
	},

	getAll: async () =>
	{
		return await getAll("truckRounds");
	}
}

const users = {
	insert: async (username, password) =>
	{
		password = await bcrypt.hash(password, await bcrypt.genSalt(SALT_WORK_FACTOR));
		return await insert("users", {username: username}, {username: username, password: password});
	},

	update: async (username, query) =>
	{
		for(p in query)
		{
			switch(p)
			{
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

	validateAndGet: async (username, password) =>
	{
		let user = await users.get(username);
		if(!user) throw new Error("No user '" + username + "' exists");
		if(!bcrypt.compareSync(password, user.password)) throw new Error("Password does not match");
		return user;
	},

	getAll: async () =>
	{
		return await getAll("users");
	}
}

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
        }
    
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
		/*if (name === 'full') {
			return { colour: '#2FC066', release: 'release', qtyForty: 3, qtyTwenty: 20};
		}

		return {
			releases: [
				{release: '1', qty: 2, size: 40, colour: '#FF0000'},
				{release: '2', qty: 4, size: 20, colour: '#FF0000'},
				{release: '3', qty: 1, size: 40, colour: '#FFFF00'},
				{release: '4', qty: 5, size: 20, colour: '#FFFF00'},
				{release: '5', qty: 5, size: 20, colour: '#FFFF00'},
				{release: '6', qty: 5, size: 20, colour: '#FFFF00'},
				{release: '7', qty: 5, size: 20, colour: '#FF00FF'},
				{release: '8', qty: 5, size: 20, colour: '#FF00FF'},
				{release: '9', qty: 5, size: 20, colour: '#FF00FF'}
			]
		};*/
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

const rounds = {
	insert: async () =>
	{
		return await null;
	},
	update: async () =>
	{
		return await null;
	},
	remove: async () =>
	{
		return await null;
	},
	get: async (name) =>
	{
		return {
			rounds: [
				{
					id: 'truck1', dayRounds:
						[
							{
								roundNumber: 1,
								slots:
									[
										{
											supports40: true,
											release: {release: 'testday1a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
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
										{
											supports40: true,
											release: {release: 'testday2a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday2c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{
											supports40: true,
											release: {release: 'testday3a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday3b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday3c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{
											supports40: true,
											release: {release: 'testday4a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testday4b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday4c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{
											supports40: true,
											release: {release: 'testday5a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday5c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{
											supports40: true,
											release: {release: 'testday6a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday6c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testday7a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testday7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday7c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testday8a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday8c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							}
						],
					nightRounds:
						[
							{
								roundNumber: 1, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight1a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
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
										{
											supports40: true,
											release: {release: 'testnight2a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testnight2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight2c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight3a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight3b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight3c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight4a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight4b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight4c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight5a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testnight5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight5c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight6a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight6c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight7a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight7c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight8a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testnight8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight8c', size: 1, qty: 1, colour: '#FF0000'}
									}
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
										{
											supports40: true,
											release: {release: 'testday1a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
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
										{
											supports40: true,
											release: {release: 'testday2a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday2c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{
											supports40: true,
											release: {release: 'testday3a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testday3b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday3c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{
											supports40: true,
											release: {release: 'testday4a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday4b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday4c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{
											supports40: true,
											release: {release: 'testday5a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday5c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{
											supports40: true,
											release: {release: 'testday6a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testday6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday6c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testday7a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday7c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testday8a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday8c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							}
						],
					nightRounds:
						[
							{
								roundNumber: 1, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight1a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
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
										{
											supports40: true,
											release: {release: 'testnight2a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight2c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight3a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight3b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight3c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight4a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testnight4b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight4c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight5a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight5c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight6a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight6c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight7a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testnight7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight7c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight8a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight8c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							}
						],
				},
				{
					id: 'truck3',
					dayRounds:
						[
							{
								roundNumber: 1, slots:
									[
										{
											supports40: true,
											release: {release: 'testday1a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
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
										{
											supports40: true,
											release: {release: 'testday2a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testday2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday2c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{
											supports40: true,
											release: {release: 'testday3a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday3b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday3c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{
											supports40: true,
											release: {release: 'testday4a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday4b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday4c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{
											supports40: true,
											release: {release: 'testday5a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testday5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday5c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{
											supports40: true,
											release: {release: 'testday6a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday6c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testday7a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testday7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday7c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testday8a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testday8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testday8c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							}
						],
					nightRounds:
						[
							{
								roundNumber: 1, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight1a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
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
										{
											supports40: true,
											release: {release: 'testnight2a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight2b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight2c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 3, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight3a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testnight3b', size: 1, qty: 1, colour: '#FF0000'}
									}, {
										supports40: false,
										release: {release: 'testnight3c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 4, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight4a', size: 1, qty: 1, colour: '#0000FF'}
										}, {
										supports40: true,
										release: {release: 'testnight4b', size: 1, qty: 1, colour: '#00FF00'}
									}, {
										supports40: false,
										release: {release: 'testnight4c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 5, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight5a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight5b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight5c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							},
							{
								roundNumber: 6, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight6a', size: 1, qty: 1, colour: '#FF0000'}
										}, {
										supports40: true,
										release: {release: 'testnight6b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight6c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							},
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight7a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testnight7b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight7c', size: 1, qty: 1, colour: '#FF0000'}
									}
									]
							}
							,
							{
								roundNumber: 7, slots:
									[
										{
											supports40: true,
											release: {release: 'testnight8a', size: 1, qty: 1, colour: '#00FF00'}
										}, {
										supports40: true,
										release: {release: 'testnight8b', size: 1, qty: 1, colour: '#0000FF'}
									}, {
										supports40: false,
										release: {release: 'testnight8c', size: 1, qty: 1, colour: '#00FF00'}
									}
									]
							}
						],
				}
			]
		};
	},
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
    truckRounds
};