/**
 * Author: Neil Read
 */
const chai = require("chai");
chai.use(require("chai-as-promised"));

const db = require("../db");
const util = require("../util");
const expect = chai.expect;
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = "test_db";

let testdb = null;

const lEntry1 = {
    name: "Place",
    address: "55 Wellesley St E, Auckland",
    type: "Port",
    openingTime: "06:30",
    closingTime: "20:00",
    requiresBooking: true
};

const lEntry2 = {
    name: "Another Place",
    address: "90 Akoranga Dr, Northcote",
    type: "Rail",
    openingTime: "07:45",
    closingTime: "21:30",
    requiresBooking: false
};

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

            it("should insert a given location into the 'locations' collection", () =>
            {
                return db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, lEntry1.openingTime, lEntry1.closingTime, lEntry1.requiresBooking).then(() =>
                {            
                    return testdb.db(dbName).collection("locations").findOne({}, { projection :{ _id: false }});
                }).then((val) =>
                {
                    return expect(JSON.stringify(val)).to.eql(JSON.stringify(lEntry1));
                });
            });

            it("should throw an error if the location has the same name as another entry", function()
            {
                return db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, lEntry1.openingTime, lEntry1.closingTime, lEntry1.requiresBooking).then(() =>
                {
                    return expect(db.locations.insert(lEntry1.name, lEntry2.address, lEntry2.type, lEntry2.openingTime, lEntry2.closingTime, lEntry2.requiresBooking)).to.eventually.be.rejectedWith("locations already contains entry");
                });
            });

            it("should throw an error if the location has the same address as another entry", function()
            {
                return db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, lEntry1.openingTime, lEntry1.closingTime, lEntry1.requiresBooking).then(() =>
                {
                    return expect(db.locations.insert(lEntry2.name, lEntry1.address, lEntry2.type, lEntry2.openingTime, lEntry2.closingTime, lEntry2.requiresBooking)).to.eventually.be.rejectedWith("locations already contains entry");
                });
            });

            it("should throw an error if the location has an address not tracked by the Distance Matrix API", function()
            {
                return expect(db.locations.insert(lEntry1.name, "Fake Address", lEntry1.type, lEntry1.openingTime, lEntry1.closingTime, lEntry1.requiresBooking)).to.eventually.be.rejectedWith("Address not found");
            });

            it("should throw an error if the location has an opening time with an invalid format", function()
            {
                return expect(db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, "25:00", lEntry1.closingTime, lEntry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid opening time: Invalid hours '25' passed").then(() =>
                {
                    return expect(db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, "23:60", lEntry1.closingTime, lEntry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid opening time: Invalid minutes '60' passed");
                }).then(() =>
                {
                    return expect(db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, "wrong", lEntry1.closingTime, lEntry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid opening time: 'wrong' has invalid format");
                });
            });

            it("should throw an error if the location has a closing time with an invalid format", function()
            {
                return expect(db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, lEntry1.openingTime, "24:00", lEntry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid closing time: Invalid hours '24' passed").then(() =>
                {
                    return expect(db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, lEntry1.openingTime, "23:72", lEntry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid closing time: Invalid minutes '72' passed");
                }).then(() =>
                {
                    return expect(db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, lEntry1.openingTime, "incorrect", lEntry1.requiresBooking)).to.eventually.be.rejectedWith("Invalid closing time: 'incorrect' has invalid format");
                });
            });

            it("should throw an error if the location's closing time is before or the same as the opening time", function()
            {
                return expect(db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, "18:00", "06:00", lEntry1.requiresBooking)).to.eventually.be.rejectedWith("Opening time must be before closing time").then(() =>
                {
                    return expect(db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, "8:00", "8:00", lEntry1.requiresBooking)).to.eventually.be.rejectedWith("Opening time must be before closing time");
                });
            });

            it("should throw an error if the location's type is not one of 'Yard', 'Port' or 'Rail'", function()
            {
                return expect(db.locations.insert(lEntry1.name, lEntry1.address, "Place", lEntry1.openingTime, lEntry1.closingTime, lEntry1.requiresBooking)).to.eventually.be.rejectedWith("Location type 'Place' is not a valid type");
            });

            it("should throw an error if a name or address is not supplied", function()
            {
                return expect(db.locations.insert()).to.eventually.be.rejectedWith("A name must be supplied").then(() =>
                {
                    return expect(db.locations.insert(lEntry1.name)).to.eventually.be.rejectedWith("An address must be supplied")
                });
            });
        });
    });

    describe("releases", function()
    {
        describe("insert()", function()
        {
            this.timeout(10000);

            before(function()
            {
                return db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, lEntry1.openingTime, lEntry1.closingTime, lEntry1.requiresBooking).then(() =>
                {
                    return db.locations.insert(lEntry2.name, lEntry2.address, lEntry2.type, lEntry2.openingTime, lEntry2.closingTime, lEntry2.requiresBooking);
                });
            });

            beforeEach(function()
            {
                testdb.db(dbName).collection("releases").remove({});
            });

            let entry1 = {
                number: 123456,
                client: "abc inc.",
                containerType: "20ft",
                quantity: 50,
                acceptanceDate: util.createDate(1, 2, 2018),
                cutoffDate: util.createDate(15, 3, 2018),
                from: lEntry1.name,
                to: lEntry2.name
            }

            let entry2 = {
                number: 789123,
                client: "def inc.",
                containerType: "40ft",
                quantity: 35,
                acceptanceDate: util.createDate(2, 3, 2018),
                cutoffDate: util.createDate(1, 4, 2018),
                from: lEntry2.name,
                to: lEntry1.name
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

            it("should throw an error if the release number is already in the collection", function()
            {
                return db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.to).then(() =>
                {
                    return expect(db.releases.insert(entry1.number, entry2.client, entry2.containerType, entry2.quantity, entry2.acceptanceDate, entry2.cutoffDate, entry2.from, entry2.to)).to.eventually.be.rejectedWith("releases already contains entry");
                });
            });

            it("should throw an error if the client is not supplied", function()
            {
                return expect(db.releases.insert(entry1.number)).to.eventually.be.rejectedWith("A client is required");
            });

            it("should throw an error if the quantity is not a positive integer", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, -10, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("Quantity '-10' must be a positive integer").then(() =>
                {
                    return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, 25.6, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("Quantity '25.6' must be a positive integer");
                }).then(() =>
                {
                    return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, "quantity", entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("Quantity 'quantity' must be a positive integer");
                });
            });

            it("should throw an error if the container type is not '40ft' or '60ft'", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, "50ft", entry1.quantity, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("Container type '50ft' is not a valid type");
            });

            it("should throw an error if a date is not a Date object", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, "35/6/2018", entry1.cutoffDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("'35/6/2018' is not a valid date").then(() =>
                {
                    return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, 28, entry1.from, entry1.to)).to.eventually.be.rejectedWith("'28' is not a valid date");
                });
            });

            it("should throw an error if the acceptance date is not before the cutoff date", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.cutoffDate, entry1.acceptanceDate, entry1.from, entry1.to)).to.eventually.be.rejectedWith("Cutoff '1/2/2018' is before acceptance date '15/3/2018'");
            });

            it("should throw an error if both addresses are the same", function()
            {
                return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, entry1.from)).to.eventually.be.rejectedWith("Source and destination addresses are identical");
            });

            it("should throw an error if either address is not stored in the database", function()
            {
                testdb.db(dbName).collection("locations").remove({});

                return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, entry1.cutoffDate, "Invalid", entry1.to)).to.eventually.be.rejectedWith("Cannot find address 'Invalid'").then(() =>
                {
                    return db.locations.insert(lEntry1.name, lEntry1.address, lEntry1.type, lEntry1.openingTime, lEntry1.closingTime, lEntry1.requiresBooking);
                }).then(() =>
                {
                    return expect(db.releases.insert(entry1.number, entry1.client, entry1.containerType, entry1.quantity, entry1.acceptanceDate, entry1.cutoffDate, entry1.from, "Fake")).to.eventually.be.rejectedWith("Cannot find address 'Fake'");
                }).then(() =>
                {
                    return db.locations.insert(lEntry2.name, lEntry2.address, lEntry2.type, lEntry2.openingTime, lEntry2.closingTime, lEntry2.requiresBooking);
                });
            });
        });
    });
});