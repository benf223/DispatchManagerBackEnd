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
const DB_NAME = "test_db"; // "test_db" or "recur_db"
const URL = "mongodb://localhost:27017/" + DB_NAME;
const LOCATION_TYPES = ["Yard", "Port", "Rail"];
const CONTAINER_TYPES = ["20ft", "40ft"];

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
    insert: async (name, address, type = "Yard", openingTime = null, closingTime = null, requiresBooking = false) =>
    {
        // Check required arguments
        if(!name) throw new Error("A name must be supplied");
        if(!address) throw new Error("An address must be supplied");

        // Validate address
        if(!(await je.validateAddress(address))) throw new Error("Address not found");

        // Validate location type
        if(!LOCATION_TYPES.includes(type)) throw new Error("Location type '" + type + "' is not a valid type");

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
        return await update("locations", {name: name}, query);        
    },
    remove: async (name) =>
    {
        return await remove("locations", {name: name});
    },
    get: async (name) =>
    {
        return get("locations", {name: name});
    },
    getAll: async (name) =>
    {
        return getAll("locations");
    }
};

const trucks = {
    insert: async (name) =>
    {
        return await insert("trucks", null, {name : name});
    },
    update: async (name, query) =>
    {
        return await update("trucks", {name: name}, query);
    },
    remove: async (name) =>
    {
        return await remove("trucks", {name: name});
    }
};

const releases = {
    // To do: Find out format of release number
    insert: async (number, client, containerType, quantity, acceptanceDate, cutoffDate, from, to) =>
    {
        // Check required arguments
        if(!number) throw new Error("A release number is required");
        if(!client) throw new Error("A client is required");

        // Check quantity is positive integer
        if(!Number.isInteger(quantity) || quantity <= 0) throw new Error("Quantity '" + quantity + "' must be a positive integer");
        
        // Validate container type
        if(!CONTAINER_TYPES.includes(containerType)) throw new Error("Container type '" + containerType + "' is not a valid type");
        
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
            containerType: containerType,
            quantity: quantity,
            acceptanceDate: acceptanceDate,
            cutoffDate: cutoffDate,
            from: from,
            to: to
        }
        return await insert("releases", {number: number}, entry);
    },
    update: async (name, query) =>
    {
        return await update("releases", {name: name}, query);
    },
    remove: async (name) =>
    {
        return await remove("releases", {name: name});
    },
	get: async (name) =>
	{
		if (name === 'full') {
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
		};
		// return get("locations", {name: name});
	},
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
								roundNumber: 1, slots:
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
					id: 'truck3', dayRounds:
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

async function connectDB(callback)
{
    let db = null;
    return await MongoClient.connect(URL).then(async (val) =>
    {
        db = val;
        return await callback(db);
    }).then((val) =>
    {
        db.close();
    }).catch((err) =>
    {
        if(db) db.close();
        throw err;
    });
}

async function get(collection, query)
{
    connectDB(async (db) =>
    {
        return await db.db(DB_NAME).collection(collection).findOne(query);
    });
}

async function getAll(collection)
{
    connectDB(async (db) =>
    {
        return await db.db(DB_NAME).collection(collection).find({});
    });
}

async function update(collection, identifierQuery, updateQuery)
{
    connectDB(async (db) =>
    {
        return await db.db(DB_NAME).collection(collection).updateOne(identifierQuery, updateQuery);
    });
}

async function remove(collection, query)
{
    connectDB(async (db) => await db.db(DB_NAME).collection(collection).deleteOne(query));
}

async function insert(collection, containsQuery, value)
{
    let db = null;
    return await MongoClient.connect(URL).then(async (val) =>
    {
        db = val;
        return await contains(collection, containsQuery);
    }).then(async (val) =>
    {
        if(val) throw new Error(collection + " already contains entry");
        return await db.db(DB_NAME).collection(collection).insertOne(value);
    }).then(async (val) =>
    {
        db.close();
        return val.ops[0];
    }).catch((err) =>
    {
        if(db) db.close();
        throw err;
    });
}

/**
 * 
 * @param {string} collection - Name of collection to search
 * @param {Object} query - Query to filter search
 */
async function queryDB(collection, query)
{
    return await MongoClient.connect(URL).then(async (db) =>
    {
        var docs = await db.db(DB_NAME).collection(collection).find(query).toArray();
        db.close();
        return docs;
    });
}

/**
 * Returns true if the associated element is in the collection
 * 
 * @param {string} collection: Name of the collection to be checked
 * @param {Object} query: Query to match with elements in the collection
 */
async function contains(collection, query)
{
    return await queryDB(collection, query).then((docs) => docs.length > 0);
}

module.exports = {
    drivers,
    locations,
    releases,
    rounds,
    DB_NAME,
    LOCATION_TYPES
}