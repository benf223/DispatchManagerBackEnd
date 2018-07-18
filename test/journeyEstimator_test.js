/**
 * Author: Neil Read
 */
const je = require('../journeyEstimator');
const expect = require('chai').expect;

describe("getTravelTime()", () =>
{
    it("should return an estimated travel time (in minutes) between two locations", (done) =>
    {
        let date = new Date();
        console.log(date);
        date = je.createDate(date.getDate() + 1, date.getMonth(), date.getYear(), date.getHours(), date.getMinutes());
        je.getTravelTime("55 Wellesley St, Auckland", "90 Akoranga Dr, Northcote", date).then((time) =>
        {
            expect(time).to.be.a("number").and.be.greaterThan(30);
        });
    });
});
