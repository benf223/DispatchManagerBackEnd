var express = require("express");
var app = express();

// Binding express app to port 3000, view application on http://localhost:3000
app.listen(3000,() =>
{
    console.log('Node server running @ http://localhost:3000')
});

// Define static folder paths
app.use("/node_modules", express.static("node_modules"));
app.use("/style", express.static("style"));

// Process http get request (application opened on browser)
app.get("/", (req, res) =>
{
    res.sendFile("index.html",{"root": "templates"});
    console.log("Get request success!");
});

app.get("/showSignInPage", (req, res) =>
{
    res.sendFile("signin.html",{"root": "templates"});
});

app.get("/showSignUpPage", (req, res) =>
{
  res.sendFile("signup.html",{'root':"templates"});
});