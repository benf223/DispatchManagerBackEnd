/**
 * Author: Neil Read
 */

const MongoClient = require("mongodb").MongoClient;
const util = require("./util");
const dbName = "test_db"; // "test_db" or "recur_db"
const url = "mongodb://localhost:27017/" + dbName;
const locationTypes = ["Yard", "Port", "Rail"];

class Collection
{
    constructor(collectionName, insert = () => {throw new Error("Insertion not supported for " + collectionName)}, update = (() => {throw new Error("Update not supported for " + collectionName)}), remove = (() => {throw new Error("Remove not supported for " + collectionName)}))
    {
        this.collectionName = collectionName;
        this.insert = insert;
        this.update = update;
        this.remove = remove;
    }
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
    insert: async (name, address, type = "Yard", openingTime = null, closingTime = null, requiresBooking = false) =>
    {
        // To do: Check if address is valid for Google Maps API
        if(!locationTypes.includes(type)) throw new Error("Location type not valid");
        openingTime = util.parseTimeOfDay(openingTime);
        closingTime = util.parseTimeOfDay(closingTime);
        if(typeof(requiresBooking) != "boolean") throw new Error("Booking requirement invalid");
    
        let containsQuery = {$or: [{ name: name }, { address: address }]};
        let entry = {
            name : name, 
            address : address, 
            type : type, 
            openingTime : openingTime, 
            closingTime : closingTime, 
            requiresBooking : requiresBooking
        }
    
        return await insert("locations", containsQuery, entry).then((res) => res);
    },
    update: async (name, query) =>
    {
        return await update("locations", {name: name}, query);        
    },
    remove: async (name) =>
    {
        return await remove("locations", {name: name});
    }
}

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
}

const releases = {
    insert: async (name) =>
    {
        return await insert("releases", null, {name : name});
    },
    update: async (name, query) =>
    {
        return await update("releases", {name: name}, query);
    },
    remove: async (name) =>
    {
        return await remove("releases", {name: name});
    }
}

async function connectDB(callback)
{
    let db = null;
    return await MongoClient.connect(url).then(async (val) =>
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

async function updateDriver(name, updateQuery)
{
    update()
}

async function update(collection, identifierQuery, updateQuery)
{
    connectDB(async (db) =>
    {
        return await db.db(dbName).collection(collection).updateOne(identifierQuery, updateQuery);
    });
}

async function removeRelease(number)
{

}

async function removeTruck(name)
{

}

async function removeLocation(name)
{
    return await remove("locations", {name: name});
}

async function removeDriver(name)
{
    return await remove("drivers", {name: name});
}

async function remove(collection, query)
{
    connectDB(async (db) => await db.db(dbName).collection(collection).deleteOne(query));
}

async function insert(collection, containsQuery, value)
{
    let db = null;
    return await MongoClient.connect(url).then(async (val) =>
    {
        db = val;
        return await contains(collection, containsQuery);
    }).then(async (val) =>
    {
        if(val) throw new Error(collection + " already contains entry");
        return await db.db(dbName).collection(collection).insertOne(value);
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

async function insertRelease(number, truck, containerType, quantity)
{

}

async function insertTruck(name, type)
{

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
async function insertLocation(name, address, type = "Yard", openingTime = null, closingTime = null, requiresBooking = false)
{
    // To do: Check if address is valid for Google Maps API
    if(!locationTypes.includes(type)) throw new Error("Location type not valid");
    openingTime = util.parseTimeOfDay(openingTime);
    closingTime = util.parseTimeOfDay(closingTime);
    if(typeof(requiresBooking) != "boolean") throw new Error("Booking requirement invalid");

    let containsQuery = {$or: [{ name: name }, { address: address }]};
    let entry = {
        name : name, 
        address : address, 
        type : type, 
        openingTime : openingTime, 
        closingTime : closingTime, 
        requiresBooking : requiresBooking
    }

    return await insert("locations", containsQuery, entry).then((res) => res);
}

/**
 * 
 * @param {string} name 
 * @param {*} availableDays 
 * @param {*} avoidLocations 
 */
async function insertDriver(name, availableDays, avoidLocations)
{
    return await insert("drivers", null, {name : name, availableDays : availableDays, avoidLocations : avoidLocations}).then((res) => res);
}

/**
 * 
 * @param {string} collection - Name of collection to search
 * @param {Object} query - Query to filter search
 */
async function queryDB(collection, query)
{
    return await MongoClient.connect(url).then(async (db) =>
    {
        var docs = await db.db(dbName).collection(collection).find(query).toArray();
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
    insertDriver,
    insertLocation,
    dbName
}