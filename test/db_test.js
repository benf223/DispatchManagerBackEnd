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
        //if(testdb) return testdb.close();
    });
});

describe("insertLocation()", () =>
{
    const entry1 = {
        name: "Place",
        address: "123 Random Street",
        type: "Port",
        openingTime: "06:30",
        closingTime: "20:00",
        requiresBooking: true
    };

    const entry2 = {
        name: "Another Place",
        address: "123 Other Street",
        type: "Rail",
        openingTime: "07:45",
        closingTime: "21:30",
        requiresBooking: false
    };

    beforeEach(() =>
    {
        testdb.db(dbName).collection("locations").remove({});
    });

    it("should insert a given location into the 'locations' collection", () =>
    {
        return db.insertLocation(entry1.name, entry1.address, entry1.type, entry1.openingTime, entry1.closingTime, entry1.requiresBooking).then((val) =>
        {
            return testdb.db(dbName).collection("locations").findOne({}, { projection :{ _id: false }});
        }).then((docs) =>
        {
            console.log(docs);
            //expect.fail(null, null, "Success unexpected");
            expect(docs).to.eql(entry1);
            console.log("done");
            Promise.resolve();
        }).catch();
    });

    /*it("should throw an error if the location has the same name as another entry", () =>
    {
        db.insertLocation(entry1.name, entry1.address, entry1.type, entry1.openingTime, entry1.closingTime, entry1.requiresBooking).then(() =>
        {
            return db.insertLocation(entry1.name, entry2.address, entry2.type, entry2.openingTime, entry2.closingTime, entry2.requiresBooking);
        }).then(() =>
        {
            expect.fail(null, null, "Success unexpected");
        }).catch((err) => 
        {
            //console.log(err);
            expect(err).to.eql(new Error("locations already contains entry"));
        });
    });*/
});

