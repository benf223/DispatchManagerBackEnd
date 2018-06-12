/**
 * Author: Neil Read
 */

const MongoClient = require("mongodb").MongoClient;
const util = require("./util");
const dbName = "test_db"; // "test_db" or "recur_db"
const url = "mongodb://localhost:27017/" + dbName;

const locationTypes = ["Yard", "Port", "Rail"];

async function insert(collection, containsQuery, value)
{
    let db = null;
    return await MongoClient.connect(url).then(async (val) =>
    {
        db = val;
        return await contains(collection, containsQuery)
    }).then(async (val) =>
    {
        if(val) throw new Error(collection + " already contains entry");

        return await db.db(dbName).collection(collection).insertOne(value);
    }).then(async (val) =>
    {
        db.close();
        console.log("inserted into " + collection);
        return val.ops[0];
    }).catch((err) =>
    {
        if(db) db.close();
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

    return await insert("locations", containsQuery, entry).then((res) =>
    {
        return res;
    });
}

/**
 * 
 * @param {string} name 
 * @param {*} availableDays 
 * @param {*} avoidLocations 
 */
async function insertDriver(name, availableDays, avoidLocations)
{
    return await insert("drivers", null, {name : name, availableDays : availableDays, avoidLocations : avoidLocations}).then((res) =>
    {
        return res;
    });
}

/**
 * 
 * @param {string} collection - Name of collection to search
 * @param {Object} query - Query to filter search
 * @param {Function} callback 
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

async function contains(collection, query)
{
    return await queryDB(collection, query).then((docs) =>
    {
        console.log(docs);
        return docs.length > 0;
    });
}

module.exports = {
    insertDriver,
    insertLocation,
    dbName
}