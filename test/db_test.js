
/**
 * Author: Neil Read
 */
const db = require('../db');
const expect = require('chai').expect;
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = "test_db";

let testdb = null;

before((done) =>
{
    if(db.dbName == "recur_db")
    {
        throw new Error("tests set to alter operational database 'recur_db'");
    }

    MongoClient.connect(url).then((val) => 
    {
        testdb = val;
        done();
    });
});

after(() =>
{
    testdb.db(dbName).dropDatabase().then(() => 
    {
        if(testdb) testdb.close();
    });
});

describe("insertLocation()", () =>
{
    const entry = {
        name: "Place",
        address: "123 Random Street",
        type: "Port",
        openingTime: "06:30",
        closingTime: "20:00",
        requiresBooking: true
    };

    beforeEach(() =>
    {
        testdb.db(dbName).collection("locations").remove({});
    });

    it("should insert a given location into the 'locations' collection", () =>
    {
        db.insertLocation(entry.name, entry.address, entry.type, entry.openingTime, entry.closingTime, entry.requiresBooking).then((val) =>
        {
            return testdb.db(dbName).collection("locations").findOne({}, { projection :{ _id: false }});
        }).then((docs) =>
        {
            expect(docs).to.eql(entry);
        });
    });
});

