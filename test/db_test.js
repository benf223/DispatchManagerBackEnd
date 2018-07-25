/**
 * Author: Neil Read
 */
const chai = require("chai");
chai.use(require("chai-as-promised"));

const db = require('../db');
const expect = chai.expect;
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = "test_db";

let testdb = null;

before(function ()
{
    if(db.dbName == "recur_db")
    {
        throw new Error("tests set to alter operational database 'recur_db'");
    }

    return MongoClient.connect(url).then((val) => {testdb = val});
});

after(function()
{
    return testdb.db(dbName).dropDatabase().then(function()
    {
        if(testdb) testdb.close();
    });
});

describe("locations.insert()", function()
{
    this.timeout(10000);

    beforeEach(function()
    {
        testdb.db(dbName).collection("locations").remove({});
    });

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

    it("should insert a given location into the 'locations' collection", () =>
    {
        return db.insertLocation(entry1.name, entry1.address, entry1.type, entry1.openingTime, entry1.closingTime, entry1.requiresBooking).then(() =>
        {            
            return testdb.db(dbName).collection("locations").findOne({}, { projection :{ _id: false }});
        }).then((val) =>
        {
            return expect(JSON.stringify(val)).to.eql(JSON.stringify(entry1));
        });
    });

    it("should throw an error if the location has the same name as another entry", function()
    {
        return db.insertLocation(entry1.name, entry1.address, entry1.type, entry1.openingTime, entry1.closingTime, entry1.requiresBooking).then(() =>
        {
            return expect(db.insertLocation(entry1.name, entry2.address, entry2.type, entry2.openingTime, entry2.closingTime, entry2.requiresBooking)).to.eventually.be.rejectedWith("locations already contains entry");
        });
    });

    it("should throw an error if the location has the same address as another entry", function()
    {
        return db.insertLocation(entry1.name, entry1.address, entry1.type, entry1.openingTime, entry1.closingTime, entry1.requiresBooking).then(() =>
        {
            return expect(db.insertLocation(entry2.name, entry1.address, entry2.type, entry2.openingTime, entry2.closingTime, entry2.requiresBooking)).to.eventually.be.rejectedWith("locations already contains entry");
        });
    });

    it("should throw an error if the location has an address not tracked by the Distance Matrix API", function()
    {
        return expect(db.insertLocation(entry1.name, "Fake Address", entry1.type, entry1.openingTime, entry1.closingTime, entry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid Address");
    });
});