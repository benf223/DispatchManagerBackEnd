const MongoClient = require("mongodb").MongoClient;
const util = require("./util");
const dbName = "recur_db";
const url = "mongodb://localhost:27017/recur_db";

const locationTypes = ["Yard", "Port", "Rail"];

async function insert(collection, value)
{
    MongoClient.connect(url, (err, db) =>
    {
        if(err) throw err;

        db.db(dbName).collection(collection).insertOne(value, (err, res) =>
        {
            if(err) throw err;
            console.log("inserted into " + collection);
            db.close();
        });
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

    //console.log(await contains("locations", null));

    await insert("locations", {name : name, address : address, type : type, openingTime : openingTime, closingTime : closingTime, requiresBooking : requiresBooking});
}

/**
 * 
 * @param {string} name 
 * @param {*} availableDays 
 * @param {*} avoidLocations 
 */
async function insertDriver(name, availableDays, avoidLocations)
{
    await insert("drivers", {name : name, availableDays : availableDays, avoidLocations : avoidLocations});
}

/**
 * 
 * @param {string} collection - Name of collection to search
 * @param {Object} query - Query to filter search
 * @param {Function} callback 
 */
async function queryDB(collection, query, callback)
{
    await MongoClient.connect(url, async (err, db) =>
    {
        if(err) throw err;

        var docs = await db.db(dbName).collection(collection).find(query).toArray();
        callback(docs);
        db.close();
    });
}

async function contains(collection, query)
{
    Promise.resolve(await queryDB(collection, query, (docs) =>
    {
        //console.log(docs);
        console.log(docs.length > 0);
        Promise.resolve(docs.length > 0);
    }));
}

//insertDriver("Neil", "Hello", "World");
insertLocation("Place", "123 Random Street", "Port", "6:30", "20:00", true);
queryDB("locations", null, (docs) =>
{
    //console.log(docs);
});