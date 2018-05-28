var sample = require('../test');
var expect = require('chai').expect;

describe('sample()', function () {
	it('should add two numbers', function ()
	{
		var x = 3;
		var y = 3;
		var sum = x + y;

		var sum2 = sample(x, y);

		expect(sum2).to.be.equal(sum);
	});
})
