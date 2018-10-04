/**
 * Author: Neil Read
 */
const chai = require("chai");
chai.use(require("chai-as-promised"));

const db = require("../db");
const util = require("../util");
const expect = chai.expect;
const testDBPath = "mongodb://admin:admin123@ds113703.mlab.com:13703/recur_test_db";

const bcrypt = require("bcrypt");

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
    quantity20ft: 15,
    quantity40ft: 0,
    acceptanceDate: util.createDate(1, 2, 2018),
    cutoffDate: util.createDate(15, 3, 2018),
    from: location1.name,
    to: location2.name
}

const release2 = {
    number: 789123,
    client: "def inc.",
    quantity20ft: 25,
    quantity40ft: 10,
    acceptanceDate: util.createDate(2, 3, 2018),
    cutoffDate: util.createDate(1, 4, 2018),
    from: location2.name,
    to: location1.name
}

const truckRounds1 = {
    id: "1/10/2018",
    dayRounds:[[release1.number], [release1.number]],
    nightRounds:[[release1.number], [release2.number, release2.number]]
}

const truckRounds2 = {
    id: "12/10/2018",
    dayRounds:[[release2.number, release2.number]],
    nightRounds:[[release2.number]]
}

before(function ()
{
    return db.start(testDBPath).then(() => 
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
    this.timeout(10000);

    describe("truckRounds", function()
    {
        before(function()
        {
            return insertAll({locations: [location1, location2], releases: [release1, release2]})
        });

        after(function()
        {
            return removeAll(["truckRounds", "releases", "locations"]);
        });

        describe("update()", function()
        {
            let updatedEntry;

            beforeEach(function()
            {
                updatedEntry = Object.assign({}, truckRounds1);
            });

            it("should insert an entry if its ID does not already exist in the collection", function()
            {
                return db.truckRounds.update(updatedEntry).then(() => get("truckRounds", {id: truckRounds1.id})).then((res) =>
                {
                    return expectStringified(res, truckRounds1);
                });
            });

            it("should update an existing value if the ID already exists", function()
            {
                updatedEntry.dayRounds = truckRounds2.dayRounds;
                updatedEntry.nightRounds = truckRounds2.nightRounds;
                return insert("truckRounds", truckRounds1).then(() =>
                {
                    return db.truckRounds.update(updatedEntry);
                }).then(() => get("truckRounds", {id: truckRounds1.id})).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });
        });

        describe("get()", function()
        {
            before(function()
            {                
                return remove("truckRounds").then(() => insertAll({truckRounds: [truckRounds1, truckRounds2]}));
            });

            after(function()
            {
                return remove("truckRounds");
            });

            it("should return a single entry corresponding to the passed ID", function()
            {
                return db.truckRounds.get(truckRounds1.id).then((res) =>
                {
                    return expectStringified(res, truckRounds1);
                });
            });

            it("should return null if an entry cannot be found", function()
            {
                return expect(db.truckRounds.get("Hello")).to.eventually.be.null;
            });
        });
    });

    describe("users", function()
    {
        const user1 = {
            username: "JohnDoe",
            password: "password"
        }

        const user2 = {
            username: "user123",
            password: "123456"
        }

        describe("insert()", function()
        {
            beforeEach(function()
            {
                return remove("users");
            });

            after(function()
            {
                return remove("users");
            });

            it("should insert a given user with an encrypted password into the 'users' collection", () =>
            {
                return db.users.insert(user1.username, user1.password).then(() => get("users", {username: user1.username})).then((res) =>
                {       
                    expect(res.username).to.eql(user1.username);
                    return expect(bcrypt.compareSync(user1.password, res.password)).to.be.true;
                });
            });

            it("should throw an error if the user has the same username as another entry", function()
            {
                return insert("users", {username: user1.username, password: user1.password}).then(() =>
                {
                    return expect(db.users.insert(user1.username, user2.password)).to.eventually.be.rejectedWith("users already contains entry '" + user1.username + "'");
                });
            });
        });

        describe("update()", function()
        {
            let updateValue;
            let updatedEntry;

            beforeEach(function()
            {
                updatedEntry = Object.assign({}, user1);
                return remove("users").then(() => db.users.insert(user1.username, user1.password)).then(() => db.users.insert(user2.username, user2.password));
            });

            after(function()
            {
                return remove("users");
            });

            it("should update the username with the given input", function()
            {
                updateValue = "test";
                updatedEntry.username = updateValue;

                return db.users.update(user1.username, {username: updateValue}).then(() =>
                {
                    return get("users", {username: updateValue});
                }).then((res) =>
                {
                    expect(res.username).to.eql(updatedEntry.username);
                    return expect(bcrypt.compareSync(updatedEntry.password, res.password)).to.be.true;
                });
            });

            it("should throw an error if the username already exists", function()
            {
                return expect(db.users.update(user1.username, {username: user2.username})).to.eventually.be.rejectedWith("users already contains entry '" + user2.username + "'")
            });

            it("should update the password with the given input", function()
            {
                updateValue = "AnotherPassword";
                updatedEntry.password = updateValue;

                return db.users.update(user1.username, {password: updateValue}).then(() =>
                {
                    return get("users", {username: user1.username});
                }).then((res) =>
                {
                    expect(res.username).to.eql(updatedEntry.username);
                    return expect(bcrypt.compareSync(updatedEntry.password, res.password)).to.be.true;
                });
            });

            it("should throw an error if the entry does not exist", function()
            {
                return expect(db.users.update("Invalid", {username: "Test", password: "something"})).to.eventually.be.rejectedWith("No entry 'Invalid' found");
            });

            it("should throw an error if an invalid property is passed", function()
            {
                return expect(db.users.update(user1.username, {test: "test"})).to.eventually.be.rejectedWith("'test' is not a valid property");
            });
        });

        describe("remove()", function()
        {
            beforeEach(function()
            {
                return remove("users").then(() => db.users.insert(user1.username, user1.password));
            });

            after(function()
            {
                return remove("users");
            });

            it("should remove an entry with the corresponding username from the table", function()
            {
                return db.users.remove(user1.username).then(() =>
                {
                    return expect(get("users")).to.eventually.be.null;
                });
            });

            it("should throw an error if the name does not exist in the table", function()
            {
                return expect(db.users.remove(user2.username)).to.eventually.be.rejectedWith("No entry '" + user2.username + "' found");
            });
        });

        describe("get()", function()
        {
            before(function()
            {
                return remove("users").then(() =>
                {
                    return db.users.insert(user1.username, user1.password);
                });
            });

            after(function()
            {
                return remove("users");
            });

            it("should return a single entry corresponding to the passed username", function()
            {
                return db.users.get(user1.username).then((res) =>
                {
                    expect(res.username).to.eql(user1.username);
                    return expect(bcrypt.compareSync(user1.password, res.password)).to.be.true;
                });
            });

            it("should return null if an entry cannot be found", function()
            {
                return expect(db.users.get("Hello")).to.eventually.be.null;
            });
        });

        describe("validateAndGet()", function()
        {
            before(function()
            {
                return db.users.insert(user1.username, user1.password);
            });

            after(function()
            {
                return remove("users");
            });

            it("should return the user if the password matches the corresponding user's password", function()
            {
                return db.users.validateAndGet(user1.username, user1.password).then((res) =>
                {
                    expect(res.username).to.eql(user1.username);
                    return expect(bcrypt.compareSync(user1.password, res.password)).to.be.true;
                });
            });

            it("should throw an error if the password does not match the corresponding user's password", function()
            {
                return expect(db.users.validateAndGet(user1.username, "Wrong")).to.eventually.be.rejectedWith("Password does not match");
            });

            it("should throw an error if the user does not exist", function()
            {
                return expect(db.users.validateAndGet("Random", user1.password)).to.eventually.be.rejectedWith("No user 'Random' exists");
            });
        });

        describe("getAll()", function()
        {
            before(function()
            {
                return db.users.insert(user1.username, user1.password).then(() => db.users.insert(user2.username, user2.password));
            });

            after(function()
            {
                return remove("users");
            });

            it("should return all entries in the collection", function()
            {
                return db.users.getAll().then((res) =>
                {
                    expect(res[0].username).to.eql(user1.username);
                    expect(bcrypt.compareSync(user1.password, res[0].password)).to.be.true;

                    expect(res[1].username).to.eql(user2.username);
                    expect(bcrypt.compareSync(user2.password, res[1].password)).to.be.true;
                });
            });
        });
    });

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
                return db.locations.insert(location1.name, location1.address, location1.type, location1.openingTime, location1.closingTime, location1.requiresBooking).then(() => get("locations", {name: location1.name})).then((res) =>
                {       
                    return expectStringified(res, location1);
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
                return expect(db.locations.insert(location1.name, "Fake Address", location1.type, location1.openingTime, location1.closingTime, location1.requiresBooking)).to.eventually.be.rejectedWith("Address 'Fake Address' not found");
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

        describe("update()", function()
        {
            let updateValue;
            let updatedEntry;

            beforeEach(function()
            {
                updatedEntry = Object.assign({}, location1);
                return remove("locations").then(() => insertAll({locations: [location1, location2]}));
            });

            after(function()
            {
                return remove("locations");
            });

            it("should update an entry with the given name", () =>
            {
                updateValue = "test";
                updatedEntry.name = updateValue;

                return db.locations.update(location1.name, {name: updateValue}).then(() =>
                {
                    return get("locations", {name: updateValue});
                }).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if the location has the same name as another entry", function()
            {
                return expect(db.locations.update(location1.name, {name: location2.name})).to.eventually.be.rejectedWith("locations already contains entry '" + location2.name + "'");
            });

            it("should update an entry with the given address", function()
            {
                updateValue = "1 Queen Street, Auckland";
                updatedEntry.address = updateValue;

                return db.locations.update(location1.name, {address: updateValue}).then(() =>
                {
                    return get("locations", {name: location1.name});
                }).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if the location has the same address as another entry", function()
            {
                return expect(db.locations.update(location1.name, {address: location2.address})).to.eventually.be.rejectedWith("locations already contains entry with address '" + location2.address + "'");
            });

            it("should throw an error if the address is not tracked by the Distance Matrix API", function()
            {
                return expect(db.locations.update(location1.name, {address: "Fake Address"})).to.eventually.be.rejectedWith("Address 'Fake Address' not found");
            });

            it("should update an entry with the given opening time", function()
            {
                updateValue = location2.openingTime;
                updatedEntry.openingTime = updateValue;

                return db.locations.update(location1.name, {openingTime: updateValue}).then(() =>
                {
                    return get("locations", {name: location1.name});
                }).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if the opening time is after or the same as the location's closing time", function()
            {
                return expect(db.locations.update(location1.name, {openingTime: "23:00"})).to.eventually.be.rejectedWith("Opening time must be before closing time").then(() =>
                {
                    return expect(db.locations.update(location1.name, {openingTime: location1.closingTime})).to.eventually.be.rejectedWith("Opening time must be before closing time");
                }).then(() =>
                {
                    return expect(db.locations.update(location1.name, {openingTime: location2.closingTime, closingTime: location2.openingTime})).to.eventually.be.rejectedWith("Opening time must be before closing time");
                });
            });

            it("should throw an error if the opening time has an invalid format", function()
            {
                return expect(db.locations.update(location1.name, {openingTime: "25:00"})).to.eventually.be.rejectedWith("Invalid hours '25' passed").then(() =>
                {
                    return expect(db.locations.update(location1.name, {openingTime: "8:60"})).to.eventually.be.rejectedWith("Invalid minutes '60' passed");
                }).then(() =>
                {
                    return expect(db.locations.update(location1.name, {openingTime: "wrong"})).to.eventually.be.rejectedWith("'wrong' has invalid format");
                });
            });

            it("should update an entry with the given closing time", function()
            {
                updateValue = location2.closingTime;
                updatedEntry.closingTime = updateValue;

                return db.locations.update(location1.name, {closingTime: updateValue}).then(() =>
                {
                    return get("locations", {name: location1.name});
                }).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if the closing time has an invalid format", function()
            {
                return expect(db.locations.update(location1.name, {closingTime: "25:00"})).to.eventually.be.rejectedWith("Invalid hours '25' passed").then(() =>
                {
                    return expect(db.locations.update(location1.name, {closingTime: "8:60"})).to.eventually.be.rejectedWith("Invalid minutes '60' passed");
                }).then(() =>
                {
                    return expect(db.locations.update(location1.name, {closingTime: "wrong"})).to.eventually.be.rejectedWith("'wrong' has invalid format");
                });
            });

            it("should throw an error if the closing time is before or the same as the location's opening time", function()
            {
                return expect(db.locations.update(location1.name, {closingTime: "3:00"})).to.eventually.be.rejectedWith("Closing time must be after opening time").then(() =>
                {
                    return expect(db.locations.update(location1.name, {closingTime: location1.openingTime})).to.eventually.be.rejectedWith("Closing time must be after opening time");
                });
            });

            it("should update an entry with the given type", function()
            {
                updateValue = location2.type;
                updatedEntry.type = updateValue;

                return db.locations.update(location1.name, {type: updateValue}).then(() =>
                {
                    return get("locations", {name: location1.name});
                }).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if the type is not one of 'Yard', 'Port' or 'Rail'", function()
            {
                return expect(db.locations.update(location1.name, {type: "Place"})).to.eventually.be.rejectedWith("Location type 'Place' is not a valid type");
            });

            it("should throw an error if the name does not correspond to an entry", function()
            {
                return expect(db.locations.update("Invalid", {name: "Test", type: "Port"})).to.eventually.be.rejectedWith("No entry 'Invalid' found");
            });

            it("should throw an error if an invalid property is passed", function()
            {
                return expect(db.locations.update(location1.name, {test: "test"})).to.eventually.be.rejectedWith("'test' is not a valid property");
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
                    return expect(get("locations")).to.eventually.be.null;
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
                    return expectStringified(res, location1);
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
                    expectStringified(res[0], location1);
                    return expectStringified(res[1], location2);
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
                return db.releases.insert(release1.number, release1.client, release1.quantity20ft, release1.quantity40ft, release1.acceptanceDate, release1.cutoffDate, release1.from, release1.to).then(() =>
                {
                    return get("releases", {number: release1.number});
                }).then((res) =>
                {            
                    return expectStringified(res, release1);
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
                    return expect(db.releases.insert(release1.number, release2.client, release2.quantity20ft, release2.quantity40ft, release2.acceptanceDate, release2.cutoffDate, release2.from, release2.to)).to.eventually.be.rejectedWith("releases already contains entry '" + release1.number + "'");
                });
            });

            it("should throw an error if the client is not supplied", function()
            {
                return expect(db.releases.insert(release1.number)).to.eventually.be.rejectedWith("A client is required");
            });

            it("should throw an error if either quantity is not zero or a positive integer", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, -10, release1.quantity40ft, release1.acceptanceDate, release1.cutoffDate, release1.from, release1.to)).to.eventually.be.rejectedWith("20ft container quantity '-10' must be zero or a positive integer").then(() =>
                {
                    return expect(db.releases.insert(release1.number, release1.client, release1.quantity20ft, 25.6, release1.acceptanceDate, release1.cutoffDate, release1.from, release1.to)).to.eventually.be.rejectedWith("40ft container quantity '25.6' must be zero or a positive integer");
                }).then(() =>
                {
                    return expect(db.releases.insert(release1.number, release1.client, release1.quantity20ft, "quantity", release1.acceptanceDate, release1.cutoffDate, release1.from, release1.to)).to.eventually.be.rejectedWith("40ft container quantity 'quantity' must be zero or a positive integer");
                });
            });

            it("should throw an error if both quantities are 0", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, 0, 0, release1.acceptanceDate, release1.cutoffDate, release1.from, release1.to)).to.eventually.be.rejectedWith("At least one quantity must be positive");
            });

            it("should throw an error if a date is not a Date object", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, release1.quantity20ft, release1.quantity40ft, "35/6/2018", release1.cutoffDate, release1.from, release1.to)).to.eventually.be.rejectedWith("'35/6/2018' is not a valid date").then(() =>
                {
                    return expect(db.releases.insert(release1.number, release1.client, release1.quantity20ft, release1.quantity40ft, release1.acceptanceDate, 28, release1.from, release1.to)).to.eventually.be.rejectedWith("'28' is not a valid date");
                });
            });

            it("should throw an error if the acceptance date is not before the cutoff date", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, release1.quantity20ft, release1.quantity40ft, release1.cutoffDate, release1.acceptanceDate, release1.from, release1.to)).to.eventually.be.rejectedWith("Cutoff '1/2/2018' is before acceptance date '15/3/2018'");
            });

            it("should throw an error if both addresses are the same", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, release1.quantity20ft, release1.quantity40ft, release1.acceptanceDate, release1.cutoffDate, release1.from, release1.from)).to.eventually.be.rejectedWith("Source and destination addresses are identical");
            });

            it("should throw an error if either address is not stored in the database", function()
            {
                return expect(db.releases.insert(release1.number, release1.client, release1.quantity20ft, release1.quantity40ft, release1.acceptanceDate, release1.cutoffDate, "Invalid", release1.to)).to.eventually.be.rejectedWith("Cannot find address 'Invalid'").then(() =>
                {
                    return expect(db.releases.insert(release1.number, release1.client, release1.quantity20ft, release1.quantity40ft, release1.acceptanceDate, release1.cutoffDate, release1.from, "Fake")).to.eventually.be.rejectedWith("Cannot find address 'Fake'");
                });
            });
        });

        describe("update()", function()
        {
            let updateValue;
            let updatedEntry;
            const location3 = {
                name: "Some Place",
                address: "640 Great South Rd, Manukau, Auckland",
                type: "Port",
                openingTime: "07:45",
                closingTime: "21:30",
                requiresBooking: false
            };

            before(function()
            {
                return insertAll({locations: [location1, location2, location3]});
            });

            beforeEach(function()
            {
                updatedEntry = Object.assign({}, release1);
                return remove("releases").then(() => insertAll({releases: [release1, release2]}));
            });

            after(function()
            {
                return removeAll(["locations", "releases"]);
            });

            it("should update an entry with the given number", () =>
            {
                updateValue = "test";
                updatedEntry.number = updateValue;

                return db.releases.update(release1.number, {number: updateValue}).then(() =>
                {
                    return get("releases", {number: updateValue});
                }).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if the release has the same number as another entry", function()
            {
                return expect(db.locations.update(location1.name, {name: location2.name})).to.eventually.be.rejectedWith("locations already contains entry '" + location2.name + "'");
            });

            it("should update an entry with the given client", function()
            {
                updateValue = "test";
                updatedEntry.client = updateValue;

                return db.releases.update(release1.number, {client: updateValue}).then(() => get("releases", {number: release1.number})).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should update an entry with the given 20ft container quantity", function()
            {
                updateValue = release2.quantity20ft;
                updatedEntry.quantity20ft = updateValue;

                return db.releases.update(release1.number, {quantity20ft: updateValue}).then(() => get("releases", {number: release1.number})).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if either quantity is not zero or a positive integer", function()
            {
                return expect(db.releases.update(release1.number, {quantity20ft: -10})).to.eventually.be.rejectedWith("20ft container quantity '-10' must be a positive integer").then(() =>
                {
                    return expect(db.releases.update(release1.number, {quantity40ft: 25.6})).to.eventually.be.rejectedWith("40ft container quantity '25.6' must be a positive integer");
                }).then(() =>
                {
                    return expect(db.releases.update(release1.number, {quantity40ft: "quantity"})).to.eventually.be.rejectedWith("40ft container quantity 'quantity' must be a positive integer");
                });
            });

            it("should throw an error if both quantities are zero", function()
            {
                return expect(db.releases.update(release1.number, {quantity20ft: 0})).to.eventually.be.rejectedWith("At least one quantity must be positive").then(() =>
                {
                    return expect(db.releases.update(release2.number, {quantity20ft: 0, quantity40ft: 0})).to.eventually.be.rejectedWith("At least one quantity must be positive");
                });
            });

            it("should update an entry with the given acceptance date", function()
            {
                updateValue = release2.acceptanceDate;
                updatedEntry.acceptanceDate = updateValue;

                return db.releases.update(release1.number, {acceptanceDate: updateValue}).then(() => get("releases", {number: release1.number})).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if the acceptance date is not before the cutoff date", function()
            {
                return expect(db.releases.update(release1.number, {acceptanceDate: release1.cutoffDate})).to.eventually.be.rejectedWith("Acceptance date '" + util.parseDateString(release1.cutoffDate) + "' is after or on cut-off '" + util.parseDateString(release1.cutoffDate) + "'").then(() =>
                {
                    return expect(db.releases.update(release1.number, {cutoffDate: release1.acceptanceDate})).to.eventually.be.rejectedWith("Acceptance date '" + util.parseDateString(release1.acceptanceDate) + "' is after or on cut-off '" + util.parseDateString(release1.acceptanceDate) + "'");
                }).then(() =>
                {
                    return expect(db.releases.update(release1.number, {acceptanceDate: release2.cutoffDate, cutoffDate: release2.acceptanceDate})).to.eventually.be.rejectedWith("Acceptance date '" + util.parseDateString(release2.cutoffDate) + "' is after or on cut-off '" + util.parseDateString(release2.acceptanceDate) + "'");
                });
            });

            it("should update an entry with the given cut-off date", function()
            {
                updateValue = release2.cutoffDate;
                updatedEntry.cutoffDate = updateValue;

                return db.releases.update(release1.number, {cutoffDate: updateValue}).then(() => get("releases", {number: release1.number})).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if a date is not a Date object", function()
            {
                return expect(db.releases.update(release1.number, {acceptanceDate: "35/6/2018"})).to.eventually.be.rejectedWith("'35/6/2018' is not a valid date").then(() =>
                {
                    return expect(db.releases.update(release1.number, {cutoffDate: 28})).to.eventually.be.rejectedWith("'28' is not a valid date");
                });
            });

            it("should throw an error if the acceptance date is not before the cutoff date", function()
            {
                return expect(db.releases.update(release1.number, {acceptanceDate: release1.cutoffDate})).to.eventually.be.rejectedWith("Acceptance date '" + util.parseDateString(release1.cutoffDate) + "' is after or on cut-off '" + util.parseDateString(release1.cutoffDate) + "'").then(() =>
                {
                    return expect(db.releases.update(release1.number, {cutoffDate: release1.acceptanceDate})).to.eventually.be.rejectedWith("Acceptance date '" + util.parseDateString(release1.acceptanceDate) + "' is after or on cut-off '" + util.parseDateString(release1.acceptanceDate) + "'");
                }).then(() =>
                {
                    return expect(db.releases.update(release1.number, {acceptanceDate: release2.cutoffDate, cutoffDate: release2.acceptanceDate})).to.eventually.be.rejectedWith("Acceptance date '" + util.parseDateString(release2.cutoffDate) + "' is after or on cut-off '" + util.parseDateString(release2.acceptanceDate) + "'");
                });
            });

            it("should update an entry with the given start location", function()
            {
                updateValue = location3.name;
                updatedEntry.from = updateValue;

                return db.releases.update(release1.number, {from: updateValue}).then(() => get("releases", {number: release1.number})).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should update an entry with the given end location", function()
            {
                updateValue = location3.name;
                updatedEntry.to = updateValue;

                return db.releases.update(release1.number, {to: updateValue}).then(() => get("releases", {number: release1.number})).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if the update will result in identical addresses", function()
            {
                return expect(db.releases.update(release1.number, {from: release1.to})).to.eventually.be.rejectedWith("Start and end location are identical").then(() =>
                {
                    return expect(db.releases.update(release1.number, {to: release1.from})).to.eventually.be.rejectedWith("Start and end location are identical");
                }).then(() =>
                {
                    return expect(db.releases.update(release1.number, {from: release2.from, to: release2.from})).to.eventually.be.rejectedWith("Start and end location are identical");
                });
            });

            it("should throw an error if a location is not stored in the database", function()
            {
                return expect(db.releases.update(release1.number, {from: "Invalid"})).to.eventually.be.rejectedWith("Cannot find address 'Invalid'").then(() =>
                {
                    return expect(db.releases.update(release1.number, {to: "Invalid"})).to.eventually.be.rejectedWith("Cannot find address 'Invalid'")  
                });

            });

            it("should throw an error if the name does not correspond to an entry", function()
            {
                return expect(db.releases.update("Invalid", {number: "Test", quantity20ft: 20})).to.eventually.be.rejectedWith("No entry 'Invalid' found");
            });

            it("should throw an error if an invalid property is passed", function()
            {
                return expect(db.releases.update(release1.number, {test: "test"})).to.eventually.be.rejectedWith("'test' is not a valid property");
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
                    return expectStringified(res, release1);
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
                    expectStringified(res[0], release1);
                    return expectStringified(res[1], release2);
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
                return db.trucks.insert(entry1.name, entry1.type).then(() => get("trucks")).then((res) =>
                {
                    return expectStringified(res, entry1);
                });
            });

            it("should throw an error if the truck has the same name as another entry", function()
            {
                return db.trucks.insert(entry1.name, entry1.type).then(() =>
                {
                    return expect(db.trucks.insert(entry1.name, entry2.type)).to.eventually.be.rejectedWith("trucks already contains entry '" + entry1.name + "'");
                });
            });

            it("should throw an error if the truck type is not 'Tribox' or 'Skeletal'", function()
            {
                return expect(db.trucks.insert(entry1.name, "invalid type")).to.eventually.be.rejectedWith("Truck type 'invalid type' is not a valid type");
            });
        });

        describe("update()", function()
        {
            let updateValue;
            let updatedEntry;

            beforeEach(function()
            {
                updatedEntry = Object.assign({}, entry1);
                return remove("trucks").then(() => insertAll({trucks: [entry1, entry2]}));
            });

            after(function()
            {
                return remove("trucks");
            });

            it("should update the name with the given input", function()
            {
                updateValue = "test";
                updatedEntry.name = updateValue;

                return db.trucks.update(entry1.name, {name: updateValue}).then(() =>
                {
                    return get("trucks", {name: updateValue});
                }).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if the name already exists", function()
            {
                return expect(db.trucks.update(entry1.name, {name: entry2.name})).to.eventually.be.rejectedWith("trucks already contains entry '" + entry2.name + "'")
            });

            it("should update the type with the given input", function()
            {
                updateValue = db.TruckTypeEnum.skeletal;
                updatedEntry.type = updateValue;

                return db.trucks.update(entry1.name, {type: updateValue}).then(() =>
                {
                    return get("trucks", {name: entry1.name});
                }).then((res) =>
                {
                    return expectStringified(res, updatedEntry);
                });
            });

            it("should throw an error if the type is invalid", function()
            {
                return expect(db.trucks.update(entry1.name, {type: "Invalid"})).to.eventually.be.rejectedWith("Truck type 'Invalid' is not a valid type");
            });

            it("should throw an error if the entry does not exist", function()
            {
                return expect(db.trucks.update("Invalid", {name: "Test", type: "tribox"})).to.eventually.be.rejectedWith("No entry 'Invalid' found");
            });

            it("should throw an error if an invalid property is passed", function()
            {
                return expect(db.trucks.update(entry1.name, {test: "test"})).to.eventually.be.rejectedWith("'test' is not a valid property");
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
                    return expectStringified(res, entry1);
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
                    expectStringified(res[0], entry1);
                    return expectStringified(res[1], entry2);
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
    return res;
}

function expectStringified(actual, expected)
{
    return expect(JSON.stringify(actual)).to.eql(JSON.stringify(expected));
}