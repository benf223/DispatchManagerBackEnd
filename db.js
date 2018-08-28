/**
 * Author: Neil Read
 * 
 * Interface enabling access and manipulation of database.
 * 
 * Database actions include find() insert(), update() or remove() for each collection
 * e.g. locations.insert(), releases.remove()
 */

const MongoClient = require("mongodb").MongoClient;
const util = require("./util");
const je = require("./journeyEstimator");
const PATH = "mongodb://admin:recurdbadmin1@ds221242.mlab.com:21242/demo-recur-db";

var mongod = null;
var db = null;

const LocationTypeEnum = {
    yard: 0,
    port: 1,
    rail: 2,
    parse: (s) => parseEnum(s, LocationTypeEnum),
    toString: (e) => getEnumString(e, this)
}

const ContainerTypeEnum = {
    twenty: 0,
    forty: 1,
    parse: (s) => parseEnum(s, ContainerTypeEnum),
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

const drivers = {
    insert: async (name, availableDays, avoidLocations) =>
    {
        return await insert("drivers", null, {name : name, availableDays : availableDays, avoidLocations : avoidLocations});
    },
    update: async (name, query) =>
    {
        return await update("drivers", {name: name}, query);
    },
    remove: async (name) =>
    {
        return await remove("drivers", {name: name});
    }
};

const locations = {
    /**
     * @param {string} name
     * @param {(string | number)} type: type of yard as a LocationTypeEnum or name of enum as a string
     * @param {string} openingTime: 24 hour format hh:mm
     * @param {string} closingTime: 24 hour format hh:mm
     * @param {boolean} requiresBooking
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
    update: async (name, query) =>
    {
		for(p in query)
		{
			let value = query[p];
			switch(p)
			{
				case "name":
					if(await contains("locations", {name: query[p]})) throw new Error("locations already contains entry '" + query[p] + "'");
					break;
				case "address":
					if(await contains("locations", {address: query[p]})) throw new Error("locations already contains entry with address '" + query[p] + "'");
					if(!(await je.validateAddress(query[p]))) throw new Error("Address '" + query[p] + "' not found");
					break;
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
				case "openingTime":
					query[p] = util.parseTimeOfDay(query[p]);

					// Checks new opening time is before new or current closing time
					let closingTime = query["closingTime"] ? util.parseTimeOfDay(query["closingTime"]) : (await locations.get(name)).closingTime;
					if(!util.timeOfDayIsBefore(query[p], closingTime)) throw new Error("Opening time must be before closing time");
					break;
				case "closingTime":
					query[p] = util.parseTimeOfDay(query[p]);

					// Checks new closing time is after new or current opening time
					let openingTime = query["openingTime"] ? query["openingTime"] : (await locations.get(name)).openingTime;
					if(!util.timeOfDayIsBefore(openingTime, query[p])) throw new Error("Closing time must be after opening time");
					break;
				case "requiresBooking": break;
				default:
					throw new Error("'" + p + "' is not a valid property");
			}
		}

        return await update("locations", {name: name}, query);        
    },
    remove: async (name) =>
    {
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
        return get("locations", {name: name});
    },
    getAll: async () =>
    {
        return getAll("locations");
    }
};

const trucks = {
    /**
     * @param {string} name
     * @param {(string | number)} type: type of truck as a TruckTypeEnum or name of enum as a string
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
    update: async (name, query) =>
    {
		for(p in query)
		{
			switch(p)
			{
				case "name":
					if(await contains("trucks", {name: query[p]})) throw new Error("trucks already contains entry");
					break;
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
				default:
					throw new Error("'" + p + "' is not a valid property");
			}
		}
        return await update("trucks", {name: name}, query);
    },
    remove: async (name) =>
    {
        return await remove("trucks", {name: name});
    },
    get: async (name) =>
    {
        return await get("trucks", {name: name});
    },
    getAll: async () =>
    {
        return await getAll("trucks");
    }
};

const releases = {
    // To do: Find out format of release number
    /**
     * @param {string} number
     * @param {string} client
     * @param {(string | number)} type: type of container as a ContainerTypeEnum or name of enum as a string
     * @param {number} quantity: positive integer
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
    update: async (number, query) =>
    {
		for(p in query)
		{
			switch(p)
			{
				case "number":
					if(await contains("releases", {name: query[p]})) throw new Error("releases already contains entry '" + p[query] + "'");
					break;
				case "quantity20ft":
					if(!Number.isInteger(query[p]) || query[p] < 0) throw new Error("20ft container quantity '" + query[p] + "' must be a positive integer");
					if(!query[p] && (query.quantity40ft == 0 || (await releases.get(number)).quantity40ft == 0)) throw new Error("At least one quantity must be positive");
					break;
				case "quantity40ft":
					if(!Number.isInteger(query[p]) || query[p] < 0) throw new Error("40ft container quantity '" + query[p] + "' must be a positive integer");
					if(!query[p] && (query.quantity20ft == 0 || (await releases.get(number)).quantity20ft == 0)) throw new Error("At least one quantity must be positive");
					break;
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
				case "from":
					if(!(await contains("locations", {name: query[p]}))) throw new Error("Cannot find address '" + query[p] + "'");
					let to = query.to || (await get("releases", {number: number})).to;
					if(query[p] == to) throw new Error("Start and end location are identical");
				case "to":
					if(!(await contains("locations", {name: query[p]}))) throw new Error("Cannot find address '" + query[p] + "'");
					if(!query.from && query[p] == (await get("releases", {number: number})).from) throw new Error("Start and end location are identical");
				case "client": break;
				default:
					throw new Error("'" + p + "' is not a valid property");
			}
		}
        return await update("releases", {number: number}, query);
    },
    remove: async (number) =>
    {
        return await remove("releases", {number: number});
    },
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
        if(val) throw new Error(collection + " already contains entry");
        return await db.collection(collection).insertOne(value);
    }).then(async (val) =>
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

function getDB()
{
    return db;
}

module.exports = {
    drivers,
    locations,
    releases,
    trucks,
    start,
    close,
    getDB,
    LocationTypeEnum,
    ContainerTypeEnum,
    TruckTypeEnum,
    rounds,
};