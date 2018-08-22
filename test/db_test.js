/**
 * Author: Neil Read
 */
const chai = require("chai");
chai.use(require("chai-as-promised"));

const db = require("../db");
const util = require("../util");
const expect = chai.expect;
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/test_db";
const dbName = "test_db";

let testdb = null;

const location1 = {
    name: "Place",
    address: "55 Wellesley St E, Auckland",
    type: "Port",
    openingTime: "06:30",
    closingTime: "20:00",
    requiresBooking: true
};

const location2 = {
    name: "Somewhere else",
    address: "90 Akoranga Dr, Northcote",
    type: "Rail",
    openingTime: "07:45",
    closingTime: "21:30",
    requiresBooking: false
};

const release1 = {
    number: "123456",
    client: "abc inc.",
    containerType: db.ContainerTypeEnum.twenty,
    quantity: 50,
    acceptanceDate: util.createDate(1, 2, 2018),
    cutoffDate: util.createDate(15, 3, 2018),
    from: location1.name,
    to: location2.name
}

const release2 = {
    number: 789123,
    client: "def inc.",
    containerType: db.ContainerTypeEnum.forty,
    quantity: 35,
    acceptanceDate: util.createDate(2, 3, 2018),
    cutoffDate: util.createDate(1, 4, 2018),
    from: location2.name,
    to: location1.name
}

before(function ()
{
    return db.start(dbName).then(() => 
    {
        testdb = db.getDB();
    });
});

after(function()
{
    db.close();
});

describe("Database Collections", function()
{
    this.timeout(4000);

    describe("locations", function()
    {
        describe("insert()", function()
        {
            beforeEach(function()
            {
                return remove("locations");
            });

            after(function()
            {
                return remove("locations");
            });

            it("should insert a given location into the 'locations' collection", () =>
            {
                return insert("locations", location1).then(() =>
                {       
                    return expect(get("locations", {name: location1.name})).to.eventually.eql(JSON.stringify(location1));     
                });
            });

            it("should throw an error if the location has the same name as another entry", function()
            {
                return db.locations.insert(location1.name, location1.address, location1.type, location1.openingTime, location1.closingTime, location1.requiresBooking).then(() =>
                {
                    return expect(db.locations.insert(location1.name, location2.address, location2.type, location2.openingTime, location2.closingTime, location2.requiresBooking)).to.eventually.be.rejectedWith("locations already contains entry");
                });
            });

            it("should throw an error if the location has the same address as another entry", function()
            {
                return db.locations.insert(location1.name, location1.address, location1.type, location1.openingTime, location1.closingTime, location1.requiresBooking).then(() =>
                {
                    return expect(db.locations.insert(location2.name, location1.address, location2.type, location2.openingTime, location2.closingTime, location2.requiresBooking)).to.eventually.be.rejectedWith("locations already contains entry");
                });
            });

            it("should throw an error if the location has an address not tracked by the Distance Matrix API", function()
            {
                return expect(db.locations.insert(location1.name, "Fake Address", location1.type, location1.openingTime, location1.closingTime, location1.requiresBooking)).to.eventually.be.rejectedWith("Address not found");
            });

            it("should throw an error if the location has an opening time with an invalid format", function()
            {
                return expect(db.locations.insert(location1.name, location1.address, location1.type, "25:00", location1.closingTime, location1.requiresBooking)).to.eventually.be.rejectedWith("Invalid opening time: Invalid hours '25' passed").then(() =>
                {
                    return expect(db.locations.insert(location1.name, location1.address, location1.type, "23:60", location1.closingTime, location1.requiresBooking)).to.eventually.be.rejectedWith("Invalid opening time: Invalid minutes '60' passed");
                }).then(() =>
                {
                    return expect(db.locations.insert(location1.name, location1.address, location1.type, "wrong", location1.closingTime, location1.requiresBooking)).to.eventually.be.rejectedWith("Invalid opening time: 'wrong' has invalid format");
                });
            });

            it("should throw an error if the location has a closing time with an invalid format", function()
            {
                return expect(db.locations.insert(location1.name, location1.address, location1.type, location1.openingTime, "24:00", location1.requiresBooking)).to.eventually.be.rejectedWith("Invalid closing time: Invalid hours '24' passed").then(() =>
                {
                    return expect(db.locations.insert(location1.name, location1.address, location1.type, location1.openingTime, "23:72", location1.requiresBooking)).to.eventually.be.rejectedWith("Invalid closing time: Invalid minutes '72' passed");
                }).then(() =>
                {
                    return expect(db.locations.insert(location1.name, location1.address, location1.type, location1.openingTime, "incorrect", location1.requiresBooking)).to.eventually.be.rejectedWith("Invalid closing time: 'incorrect' has invalid format");
                });
            });

            it("should throw an error if the location's closing time is before or the same as the opening time", function()
            {
                return expect(db.locations.insert(location1.name, location1.address, location1.type, "18:00", "06:00", location1.requiresBooking)).to.eventually.be.rejectedWith("Opening time must be before closing time").then(() =>
                {
                    return expect(db.locations.insert(location1.name, location1.address, location1.type, "8:00", "8:00", location1.requiresBooking)).to.eventually.be.rejectedWith("Opening time must be before closing time");
                });
            });

            it("should throw an error if the location's type is not one of 'Yard', 'Port' or 'Rail'", function()
            {
                return expect(db.locations.insert(location1.name, location1.address, "Place", location1.openingTime, location1.closingTime, location1.requiresBooking)).to.eventually.be.rejectedWith("Location type 'Place' is not a valid type");
            });

            it("should throw an error if a name or address is not supplied", function()
            {
                return expect(db.locations.insert()).to.eventually.be.rejectedWith("A name must be supplied").then(() =>
                {
                    return expect(db.locations.insert(location1.name)).to.eventually.be.rejectedWith("An address must be supplied")
                });
            });
        });

        describe("remove()", function()
        {
            beforeEach(function()
            {
                return removeAll(["locations", "releases"]);
            });

            after(function()
            {
                return removeAll(["locations", "releases"]);
            });

            it("should remove an entry with the corresponding name from the table", function()
            {
                return insert("locations", location1).then(() =>
                {
                    return db.locations.remove(location1.name);
                }).then(() =>
                {
                    return expect(db.locations.get(location1.name)).to.eventually.be.null;
                });
            });

            it("should throw an error if the name does not exist in the table", function()
            {
                return expect(db.locations.remove(location1.name)).to.eventually.be.rejectedWith("No entry '" + location1.name + "' found");
            });

            it("should throw an error if a release depends on the entry", function() 
            {
                return insertAll({locations: [location1, location2], releases: [release1]}).then(() =>
                {
                   return expect(db.locations.remove(location1.name)).to.eventually.be.rejectedWith("Release '" + release1.number + "' depends on entry '" + location1.name + "'"); 
                }).then(() => removeAll(["locations", "releases"]));
            });
        });

        describe("get()", function ()
        {
            before(function()
            {                
                return remove("locations").then(() => insertAll({locations: [location1, location2]}));
            });

            after(function()
            {
                return remove("locations");
            });

            it("should return a single entry corresponding to the passed name", function()
            {
                return db.locations.get(location1.name).then((res) =>
                {
                    return expect(JSON.stringify(res)).to.eql(JSON.stringify(location1));
                });
            });

            it("should return null if an entry cannot be found", function()
            {
                return expect(db.locations.get("Hello")).to.eventually.be.null;
            });
        });

        describe("getAll()", function()
        {
            before(function()
            {
                return remove("locations").then(() => insertAll({locations: [location1, location2]}));
            });

            after(function()
            {
                return remove("locations");
            });

            it("should return all entries in the database", function()
            {
                return db.locations.getAll().then((res) =>
                {
                    expect(JSON.stringify(res[0])).to.eql(JSON.stringify(location1));
                    return expect(JSON.stringify(res[1])).to.eql(JSON.stringify(location2));
                });
            });
        });
    });

    describe("releases", function()
    {
        describe("insert()", function()
        {
            before(function()
            {
                return insertAll({locations: [location1, location2]});
            });

            beforeEach(function()
            {
                return remove("releases");
            });

            after(function()
            {
                return removeAll("locations", "releases");
            });

            it("should insert a given release into the 'releases' collection", function()
            {
                return db.releases.insert(release1.number, release1.client, release1.containerType, release1.quantity, release1.acceptanceDate, release1.cutoffDate, release1.from, release1.to).then(() =>
                {            
                    return expect(get("releases", {number: release1.number})).to.eventually.eql(JSON.stringify(release1));
                });
            });

            it("should throw an error if the release number is not supplied", function()
            {
                return expect(db.releases.insert()).to.eventually.be.rejectedWith("A release number is required");
            });

            it("should throw an error if the release number is already in the collection", function()
            {
                return insert("releases", release1).then(() =>
                {
                    return expect(db.releases.insert(release1.number, release2.client, release2.containerType, release2.quantity, release2.acceptanceDate, release2.cutoffDate, release2.from, release2.to)).to.eventually.be.rejectedWith("releases already contains entry");
                });
            });

            it("should throw an error if the client is not supplied", function()
            {
                return expect(db.releases.insert(release1.number)).to.eventually.be.rejectedWith("A client is required");
            });

            it("should throw an error if the quantity is not a positive integer", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, release1.containerType, -10, release1.acceptanceDate, release1.cutoffDate, release1.from, release1.to)).to.eventually.be.rejectedWith("Quantity '-10' must be a positive integer").then(() =>
                {
                    return expect(db.releases.insert(release1.number, release1.client, release1.containerType, 25.6, release1.acceptanceDate, release1.cutoffDate, release1.from, release1.to)).to.eventually.be.rejectedWith("Quantity '25.6' must be a positive integer");
                }).then(() =>
                {
                    return expect(db.releases.insert(release1.number, release1.client, release1.containerType, "quantity", release1.acceptanceDate, release1.cutoffDate, release1.from, release1.to)).to.eventually.be.rejectedWith("Quantity 'quantity' must be a positive integer");
                });
            });

            it("should throw an error if the container type is not '40ft' or '60ft'", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, "50ft", release1.quantity, release1.acceptanceDate, release1.cutoffDate, release1.from, release1.to)).to.eventually.be.rejectedWith("Container type '50ft' is not a valid type");
            });

            it("should throw an error if a date is not a Date object", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, release1.containerType, release1.quantity, "35/6/2018", release1.cutoffDate, release1.from, release1.to)).to.eventually.be.rejectedWith("'35/6/2018' is not a valid date").then(() =>
                {
                    return expect(db.releases.insert(release1.number, release1.client, release1.containerType, release1.quantity, release1.acceptanceDate, 28, release1.from, release1.to)).to.eventually.be.rejectedWith("'28' is not a valid date");
                });
            });

            it("should throw an error if the acceptance date is not before the cutoff date", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, release1.containerType, release1.quantity, release1.cutoffDate, release1.acceptanceDate, release1.from, release1.to)).to.eventually.be.rejectedWith("Cutoff '1/2/2018' is before acceptance date '15/3/2018'");
            });

            it("should throw an error if both addresses are the same", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, release1.containerType, release1.quantity, release1.acceptanceDate, release1.cutoffDate, release1.from, release1.from)).to.eventually.be.rejectedWith("Source and destination addresses are identical");
            });

            it("should throw an error if either address is not stored in the database", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, release1.containerType, release1.quantity, release1.acceptanceDate, release1.cutoffDate, "Invalid", release1.to)).to.eventually.be.rejectedWith("Cannot find address 'Invalid'").then(() =>
                {
                    return expect(db.releases.insert(release1.number, release1.client, release1.containerType, release1.quantity, release1.acceptanceDate, release1.cutoffDate, release1.from, "Fake")).to.eventually.be.rejectedWith("Cannot find address 'Fake'");
                });
            });
        });

        describe("remove()", function()
        {
            beforeEach(function()
            {
                return removeAll(["releases", "locations"]);
            });

            it("should remove an entry with the corresponding name from the table", function()
            {
                return insertAll({locations: [location1, location2], releases: [release1]}).then(() =>
                {
                    return db.releases.remove(release1.number);
                }).then(() =>
                {
                    return expect(get("releases")).to.eventually.be.null;
                });
            });

            it("should throw an error if the name does not exist in the table", function()
            {
                return expect(db.releases.remove(release1.number)).to.eventually.be.rejectedWith("No entry '" + release1.number + "' found");
            });
        });

        describe("get()", function ()
        {
            before(function()
            {   
                return removeAll(["releases", "locations"]).then(() => 
                {
                    return insertAll({locations: [location1, location2], releases: [release1, release2]});
                });
            });

            after(function()
            {
                return removeAll("locations", "releases");
            });

            it("should return a single entry corresponding to the passed number", function()
            {
                return db.releases.get(release1.number).then((res) =>
                {
                    return expect(JSON.stringify(res)).to.eql(JSON.stringify(release1));
                });
            });

            it("should return null if an entry cannot be found", function()
            {
                return expect(db.releases.get("Hello")).to.eventually.be.null;
            });
        });

        describe("getAll()", function()
        {
            before(function()
            {
                return removeAll("releases", "locations").then(() =>
                {
                    return insertAll({locations: [location1, location2], releases: [release1, release2]});
                });
            });

            after(function()
            {
                return removeAll("locations", "releases");
            });

            it("should return all entries in the database", function()
            {
                return db.releases.getAll().then((res) =>
                {
                    expect(JSON.stringify(res[0])).to.eql(JSON.stringify(release1));
                    return expect(JSON.stringify(res[1])).to.eql(JSON.stringify(release2));
                });
            });
        });
    });

    describe("trucks", function()
    {
        let entry1 = {
            name: "Truck1",
            type: db.TruckTypeEnum.tribox
        }

        let entry2 = {
            name: "Truck2",
            type: db.TruckTypeEnum.skeletal
        }

        describe("insert()", function()
        {
            beforeEach(function()
            {
                return remove("trucks");
            });
    
            after(function()
            {
                return remove("trucks");
            });

            it("should insert a given truck into the 'trucks' collection", function()
            {
                return db.trucks.insert(entry1.name, entry1.type).then(() =>
                {
                    return expect(get("trucks")).to.eventually.eql(JSON.stringify(entry1));
                });
            });

            it("should throw an error if the truck has the same name as another entry", function()
            {
                return db.trucks.insert(entry1.name, entry1.type).then(() =>
                {
                    return expect(db.trucks.insert(entry1.name, entry2.type)).to.eventually.be.rejectedWith("trucks already contains entry");
                });
            });

            it("should throw an error if the truck type is not 'Tribox' or 'Skeletal'", function()
            {
                return expect(db.trucks.insert(entry1.name, "invalid type")).to.eventually.be.rejectedWith("Truck type 'invalid type' is not a valid type");
            });
        });

        describe("remove()", function()
        {
            beforeEach(function()
            {
                return remove("trucks");
            });

            it("should remove an entry with the corresponding name from the table", function()
            {
                return insert("trucks", entry1).then(() =>
                {
                    return db.trucks.remove(entry1.name);
                }).then(() =>
                {
                    return expect(get("trucks")).to.eventually.be.null;
                });
            });

            it("should throw an error if the name does not exist in the table", function()
            {
                return expect(db.trucks.remove(entry1.name)).to.eventually.be.rejectedWith("No entry '" + entry1.name + "' found");
            });
        });

        describe("get()", function ()
        {
            before(function()
            {
                return remove("trucks").then(() =>
                {
                    return insertAll({trucks: [entry1, entry2]});
                });
            });

            after(function()
            {
                return remove("trucks");
            });

            it("should return a single entry corresponding to the passed name", function()
            {
                return db.trucks.get(entry1.name).then((res) =>
                {
                    return expect(JSON.stringify(res)).to.eql(JSON.stringify(entry1));
                });
            });

            it("should return null if an entry cannot be found", function()
            {
                return expect(db.trucks.get("Hello")).to.eventually.be.null;
            });
        });

        describe("getAll()", function()
        {
            before(function()
            {
                return remove("trucks").then(() =>
                {
                    return insertAll({trucks: [entry1, entry2]});
                });
            });

            after(function()
            {
                return remove("trucks");
            });

            it("should return all entries in the database", function()
            {
                return db.trucks.getAll().then((res) =>
                {
                    expect(JSON.stringify(res[0])).to.eql(JSON.stringify(entry1));
                    return expect(JSON.stringify(res[1])).to.eql(JSON.stringify(entry2));
                });
            });
        });
    });
});

async function insert(collection, entry)
{
    return await testdb.collection(collection).insertOne(entry).then(() => delete entry._id);
}

async function insertAll(entries)
{
    let collections = Object.keys(entries);
    for(i = 0; i < collections.length; i++)
    {
        for(j = 0; j < entries[collections[i]].length; j++)
        {
            await insert(collections[i], entries[collections[i]][j]);
        }
    }
}

async function remove(collection, entry = {})
{
    return testdb.collection(collection).remove(entry);
}

async function removeAll(collections)
{
    for(let i = 0; i < collections.length; i++)
    {
        await remove(collections[i]);
    }
}

async function get(collection, query = {})
{
    let res = await testdb.collection(collection).findOne(query, {_id: 0});
    if(!res) return null;
    delete res._id;
    return JSON.stringify(res);
}