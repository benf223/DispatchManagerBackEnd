/**
 * Author: Neil Read
 */
const je = require('../journeyEstimator');
const expect = require('chai').expect;
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
        return je.getTravelTime("55 Wellesley St, Auckland", "90 Akoranga Dr, Northcote", tomorrow).then((time) =>
        {
            expect(time).to.be.a("number").and.be.greaterThan(je.travelOverheadTime);
        });
    });

    it("should throw an error if an address is invalid", () =>
    {
        expect(() => je.getTravelTime("Invalid", "90 Akoranga Dr, Northcote", tomorrow)).to.be.rejectedWith(Error);
    });
});
