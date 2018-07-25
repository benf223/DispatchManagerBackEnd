/**
 * Author: Neil Read
 */

const MongoClient = require("mongodb").MongoClient;
const util = require("./util");
const dbName = "recur_db"; // "test_db" or "recur_db"
const url = "mongodb://localhost:27017/" + dbName;
const je = require("./journeyEstimator");
const DB_NAME = "test_db"; // "test_db" or "recur_db"
const URL = "mongodb://localhost:27017/" + DB_NAME;
const CONTAINER_TYPES = ["20ft", "40ft"];

/*class Collection
class Collection
{
    constructor(validateFields)
    constructor(collectionName, insert = () => {throw new Error("Insertion not supported for " + collectionName)}, update = (() => {throw new Error("Update not supported for " + collectionName)}), remove = (() => {throw new Error("Remove not supported for " + collectionName)}))
    {
        this.validateFields = validateFields;
        this.collectionName = collectionName;
        this.insert = insert;
        this.update = update;
        this.remove = remove;
    }

        return await insert("drivers", null, {name : name, availableDays : availableDays, avoidLocations : avoidLocations});
    },
    },
    {
        return await remove("drivers", {name: name});
    remove: async (name) =>
    }
        return await update("trucks", {name: name}, query);
    },
    remove: async (name) =>
    {
        return await remove("trucks", {name: name});
    }
}

const releases = {
    // To do: Find out format of release number
    insert: async (number, client, containerType, quantity, acceptanceDate, cutoffDate, from, to) =>
    {
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
        return await insert("releases", {number: number}, {name : name});
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
    DB_NAME,
    LOCATION_TYPES
}