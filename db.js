/**
 * Author: Neil Read
 * 
 * Interface enabling access and manipulation of database.
 * 
 * Before use, database must be started using start() and closed after use using close()
 * 
 * Database actions include find() insert(), update() or remove() for each collection
 * e.g. locations.insert(), releases.remove()
 */

const MongoClient = require("mongodb").MongoClient;
const util = require("./util");
const je = require("./journeyEstimator");
const dbName = "recur_db"; // "test_db" or "recur_db"
const PATH = "mongodb://demo-recur-app.herokuapp.com/";

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
}

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
        if(!(await je.validateAddress(address))) throw new Error("Address not found");

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
        return await update("locations", {name: name}, query);        
    },
    remove: async (name) =>
    {
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
}

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
    insert: async (number, client, containerType, quantity, acceptanceDate, cutoffDate, from, to) =>
    {
        // Check required arguments
        if(!number) throw new Error("A release number is required");
        if(!client) throw new Error("A client is required");

        // Check quantity is positive integer
        if(!Number.isInteger(quantity) || quantity <= 0) throw new Error("Quantity '" + quantity + "' must be a positive integer");
        
        // Validate container type
        try
        {
            if(typeof containerType == "string") containerType = ContainerTypeEnum.parse(containerType);
            else if(!isValidEnum(containerType, ContainerTypeEnum)) throw new Error();
        }
        catch(err)
        {
            throw new Error("Container type '" + containerType + "' is not a valid type");
        }

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

/**
 * Initializes database connection
 * @param {string} name 
 */
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
    return await db.collection(collection).findOne(query, { projection :{ _id: false }});
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
    return await db.collection(collection).findOne(query) != null;
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
    start,
    close,
    getDB,
    LocationTypeEnum,
    ContainerTypeEnum,
    TruckTypeEnum
}