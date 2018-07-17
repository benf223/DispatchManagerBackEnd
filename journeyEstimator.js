const request = require("request-promise");
const travelOverheadTime = 30;
const APIKey = "AIzaSyDYgin8E87FEiZnPpzvQ6vqdPYpuEacKwI";

function hourMinutesToMinutes(text)
{
    console.log(text);
    try
    {
        let words = text.split(" ");
        let minutes = Number.NaN;
        if(words.length == 2)
        {
            minutes = Number.parseInt(words[1]);
        }
        else if(words.length == 4)
        {
            minutes = Number.parseInt(words[0]) * 60 + Number.parseInt(words[2]);
        }

        if(Number.isNaN(minutes))
        {
            throw new Error();
        }

        return minutes;
    }
    catch(err)
    {
        throw new Error("'" + text + "' is invalid");
    }
}

function dateTimeToUTCSeconds(date, time)
{
    date = date.split("/");
    time = time.split(":");
    date = new Date(date[0], date[1], date[2], time[0], time[1]).getTime();
    console.log(date);
    return date.getTime();
}

async function getTravelTime(source, destination, departDate, departTime)
{
    return await request.get("https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + source + "&destinations=" + destination + "&departure_time=" + dateTimeToUTCSeconds(departDate, departTime) + "&key=" + APIKey).then((body) =>
    {
        console.log(body);
        return hourMinutesToMinutes(JSON.parse(body).rows[0].elements[0].duration.text) + travelOverheadTime;
    });
}

getTravelTime("55 Wellesley St E, Auckland", "Wellington", "18/07/2018", "17:00").then((val) =>
{
    console.log(val);
});