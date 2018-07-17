var sample = require('../test');
var expect = require('chai').expect;
var journeyEstimator = require("../journeyEstimator");

describe("getTravelTime()", () =>
{
	it("should return an estimated time between two inputted destinations", () =>
	{
		journeyEstimator.getTravelTime("55 Wellesley St").then((travelTime) =>
		{
			expect(travelTime).to.be.a("number").and.be.greaterThan(30);
		});
	});
});
