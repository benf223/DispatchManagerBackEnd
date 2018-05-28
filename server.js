var express = require('express');
var app = express();

function sample(a, b)
{
	return a + b;
}

module.exports = sample;

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

var tmp = [
	{ value: 'hello' },
	{ value: 'test' }
];

app.get('/test', (req, res) => {
	res.json(tmp);
});

app.get('/planning', (res, req) => {
	res.send('hello there');
});

app.get('/planning/:date', (res, req) => {
	res.send('general kenobi');
});

app.listen(62176);