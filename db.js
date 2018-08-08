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
const dbName = "recur_db"; // "test_db" or "recur_db"
const PATH = "mongodb://localhost:27017/";
const LOCATION_TYPES = ["Yard", "Port", "Rail"];
const CONTAINER_TYPES = ["20ft", "40ft"];
const TRUCK_TYPES = ["Tribox", "Skeletal"];

var mongod = null;
var db = null;

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
}

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
    getAll: async () =>
    {
        return getAll("locations");
    }
}

const trucks = {
    insert: async (name, type) =>
    {
        if(!TRUCK_TYPES.includes(type)) throw new Error("Truck type '" + type + "' is not a valid type");
        let entry = {
            name: name,
            type: type
        }
        return await insert("trucks", {name: name}, entry);
    },
    update: async (name, query) =>
    {
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
}

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
    get: async(number) =>
    {
        return get("releases", {number: number});
    },
    getAll: async() =>
    {
        return getAll("releases");
    }
}

async function start(name = dbName)
{
    return await MongoClient.connect(PATH + name).then(async (val) =>
    {
        mongod = val;
        db = val.db(dbName);
    }).catch((err) =>
    {
        if(mongod) mongod.close();
        throw err;
    });
}

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
    let r = await db.collection(collection).findOne(query, { projection :{ _id: false }});
    return r;
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
    return await db.collection(collection).updateOne(identifierQuery, updateQuery);
}

async function remove(collection, query)
{
    await db.collection(collection).deleteOne(query);
}

async function insert(collection, containsQuery, value)
{
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
 * Returns true if the associated element is in the collection
 * 
 * @param {string} collection: Name of the collection to be checked
 * @param {Object} query: Query to match with elements in the collection
 */
async function contains(collection, query)
{
    return await db.collection(collection).findOne(query).then((docs) => 
    {
        return docs != null;
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
    dbName,
    LOCATION_TYPES,
    start,
    close,
    getDB
}