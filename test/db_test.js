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

describe("Database Collections", function()
{
    describe("locations", function()
    {
        describe("insert()", function()
        {
            this.timeout(10000);

            beforeEach(function()
            {
                testdb.db(dbName).collection("locations").remove({});
            });

            const entry1 = {
                name: "Place",
                address: "55 Wellesley St E, Auckland",
                type: "Port",
                openingTime: "06:30",
                closingTime: "20:00",
                requiresBooking: true
            };

            const entry2 = {
                name: "Another Place",
                address: "90 Akoranga Dr, Northcote",
                type: "Rail",
                openingTime: "07:45",
                closingTime: "21:30",
                requiresBooking: false
            };

            it("should insert a given location into the 'locations' collection", () =>
            {
                return db.locations.insert(entry1.name, entry1.address, entry1.type, entry1.openingTime, entry1.closingTime, entry1.requiresBooking).then(() =>
                {            
                    return testdb.db(dbName).collection("locations").findOne({}, { projection :{ _id: false }});
                }).then((val) =>
                {
                    return expect(JSON.stringify(val)).to.eql(JSON.stringify(entry1));
                });
            });

            it("should throw an error if the location has the same name as another entry", function()
            {
                return db.locations.insert(entry1.name, entry1.address, entry1.type, entry1.openingTime, entry1.closingTime, entry1.requiresBooking).then(() =>
                {
                    return expect(db.locations.insert(entry1.name, entry2.address, entry2.type, entry2.openingTime, entry2.closingTime, entry2.requiresBooking)).to.eventually.be.rejectedWith("locations already contains entry");
                });
            });

            it("should throw an error if the location has the same address as another entry", function()
            {
                return db.locations.insert(entry1.name, entry1.address, entry1.type, entry1.openingTime, entry1.closingTime, entry1.requiresBooking).then(() =>
                {
                    return expect(db.locations.insert(entry2.name, entry1.address, entry2.type, entry2.openingTime, entry2.closingTime, entry2.requiresBooking)).to.eventually.be.rejectedWith("locations already contains entry");
                });
            });

            it("should throw an error if the location has an address not tracked by the Distance Matrix API", function()
            {
                return expect(db.locations.insert(entry1.name, "Fake Address", entry1.type, entry1.openingTime, entry1.closingTime, entry1.requiresBooking)).to.eventually.be.rejectedWith("Address not found");
            });

            it("should throw an error if the location has an opening time with an invalid format", function()
            {
                return expect(db.locations.insert(entry1.name, entry1.address, entry1.type, "25:00", entry1.closingTime, entry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid opening time: Invalid hours '25' passed").then(() =>
                {
                    return expect(db.locations.insert(entry1.name, entry1.address, entry1.type, "23:60", entry1.closingTime, entry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid opening time: Invalid minutes '60' passed");
                }).then(() =>
                {
                    return expect(db.locations.insert(entry1.name, entry1.address, entry1.type, "wrong", entry1.closingTime, entry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid opening time: 'wrong' has invalid format");
                });
            });

            it("should throw an error if the location has a closing time with an invalid format", function()
            {
                return expect(db.locations.insert(entry1.name, entry1.address, entry1.type, entry1.openingTime, "24:00", entry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid closing time: Invalid hours '24' passed").then(() =>
                {
                    return expect(db.locations.insert(entry1.name, entry1.address, entry1.type, entry1.openingTime, "23:72", entry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid closing time: Invalid minutes '72' passed");
                }).then(() =>
                {
                    return expect(db.locations.insert(entry1.name, entry1.address, entry1.type, entry1.openingTime, "incorrect", entry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid closing time: 'incorrect' has invalid format");
                });
            });

            it("should throw an error if the location's closing time is before or the same as the opening time", function()
            {
                return expect(db.locations.insert(entry1.name, entry1.address, entry1.type, "18:00", "06:00", entry1.requiresBooking)).to.eventually.be.rejectedWith("Opening time must be before closing time").then(() =>
                {
                    return expect(db.locations.insert(entry1.name, entry1.address, entry1.type, "8:00", "8:00", entry1.requiresBooking)).to.eventually.be.rejectedWith("Opening time must be before closing time");
                });
            });

            it("should throw an error if the location's type is not one of 'Yard', 'Port' or 'Rail'", function()
            {
                return expect(db.locations.insert(entry1.name, entry1.address, "Place", entry1.openingTime, entry1.closingTime, entry1.requiresBooking)).to.eventually.be.rejectedWith("Location type 'Place' is not a valid type");
            });

            it("should throw an error if a name or address is not supplied", function()
            {
                return expect(db.locations.insert()).to.eventually.be.rejectedWith("A name must be supplied").then(() =>
                {
                    return expect(db.locations.insert(entry1.name)).to.eventually.be.rejectedWith("An address must be supplied")
                });
            });
        });
    });

    describe("releases", function()
    {
        describe("insert()", function()
        {
            beforeEach(function()
            {
                testdb.db(dbName).collection("releases").remove({});
            });

            let entry1 = {
                number: 123456,
                client: "abc inc.",
                containerType: "20ft",
                quantity: 50,
                acceptanceDate: "1/2/2018",
                cutoffDate: "15/3/2018",
                from: "55 Wellesley St E, Auckland",
                to: "90 Akoranga Dr, Northcote"
            }
            it("should insert a given release into the 'releases' collection", function()
            {
                return db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.to).then(() =>
                {            
                    return testdb.db(dbName).collection("releases").findOne({}, { projection :{ _id: false }});
                }).then((val) =>
                {
                    return expect(JSON.stringify(val)).to.eql(JSON.stringify(entry1));
                });
            });

            it("should throw an error if the release number is not supplied", function()
            {
                return expect(db.releases.insert()).to.eventually.be.rejectedWith("A release number is required");
            });

            it("should throw an error if the client is not supplied", function()
            {
                return expect(db.releases.insert(entry1.number)).to.eventually.be.rejectedWith("A client is required");
            });

            it("should throw an error if the quantity is not a positive integer", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, -10, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("Quantity must be a positive integer").then(() =>
                {
                    return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, 25.6, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("Quantity must be a positive integer");
                });
            });

            it("should throw an error if the release number is already in the collection", function()
            {
                return db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.to).then(() =>
                {
                    return expect(db.releases.insert(entry1.number, entry2.client, entry2.containerType, entry2.quantity, entry2.acceptanceDate, entry2.cutoffDate, entry2.from, entry2.to)).to.eventually.be.rejectedWith("Release '123456' already exists in releases");
                });
            });

            it("should throw an error if the container type is not '40ft' or '60ft'", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, "50ft", entry1.quantity, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("Container type is not '20ft' or '40ft'");
            });

            it("should throw an error if a date has an invalid format", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, "35/6/2018", entry1.cutoffDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("'35/6/2018' has an invalid format").then(() =>
                {
                    return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, 28, entry1.from, entry1.to)).to.eventually.be.rejectedWith("'28' has an invalid format");
                });
            });

            it("should throw an error if the acceptance date is not before the cutoff date", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.cutoffDate, entry1.acceptanceDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("Cutoff date is on or before acceptance date");
            });

            it("should throw an error if either date is in the past", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, "15/6/2016", entry1.cutoffDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("'55/6/2016' is in the past").then(() =>
                {
                    return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, "9/12/1996", entry1.from, entry1.to)).to.eventually.be.rejectedWith("'9/12/1996' is in the past");
                });
            });

            it("should throw an error if either address cannot be found by the distance matrix API", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, entry1.cutoffDate, "Invalid", entry1.to)).to.eventually.be.rejectedWith("'Invalid' is an invalid address").then(() =>
                {
                    return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, "Fake")).to.eventually.be.rejectedWith("'Fake' is an invalid address");
                });
            });
        });
    });
});