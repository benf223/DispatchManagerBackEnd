/**
 * Author: Neil Read
 */
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

// Then either:
const je = require('../journeyEstimator');
const expect = chai.expect;
var tomorrow;
var yesterday;

before(() =>
{
    let date = new Date();
    tomorrow = je.createDate(date.getDate() + 1, date.getMonth() + 1, date.getFullYear(), date.getHours(), date.getMinutes());
    yesterday = je.createDate(date.getDate() - 1, date.getMonth() + 1, date.getFullYear(), date.getHours(), date.getMinutes());
});

describe("getTravelTime()", () =>
{
    it("should return an estimated travel time (in minutes) between two locations", () =>
    {
        return expect(je.getTravelTime("55 Wellesley St, Auckland", "90 Akoranga Dr, Northcote", tomorrow)).to.eventually.be.a("number").and.be.greaterThan(je.travelOverheadTime).then(() =>
        {
            return expect(je.getTravelTime("Auckland", "Tauranga", tomorrow)).to.eventually.be.a("number").and.be.greaterThan(je.travelOverheadTime)
        });
    });

    it("should throw an error if an address is invalid", () =>
    {
        let expectedError = "Invalid address passed";
        return expect(je.getTravelTime("Invalid", "90 Akoranga Dr, Northcote", tomorrow)).to.eventually.be.rejectedWith("Invalid source address").then(() =>
        {
            return expect(je.getTravelTime("55 Wellesley St, Auckland", "Invalid", tomorrow)).to.eventually.be.rejectedWith("Invalid destination address");
        });
    });

    it("should throw an error if an argument is not passed", () =>
    {
        let expectedError = "Source, destination and departure date must be specified";
        return expect(je.getTravelTime(null, "90 Akoranga Dr, Northcote", tomorrow)).to.eventually.be.rejectedWith(expectedError).then(() =>
        {
            return expect(je.getTravelTime("55 Wellesley St, Auckland", null, tomorrow)).to.eventually.be.rejectedWith(expectedError);
        }).then(() =>
        {
            return expect(je.getTravelTime("55 Wellesley St, Auckland", "90 Akoranga Dr, Northcote", null)).to.eventually.be.rejectedWith(expectedError);
        });
    });

    it("should throw an error if the departure date is in the past", () =>
    {
        return expect(je.getTravelTime("55 Wellesley St, Auckland", "90 Akoranga Dr, Northcote", yesterday)).to.eventually.be.rejectedWith("Date cannot be in the past");
    });
});