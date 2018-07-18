const request = require("request-promise");
const travelOverheadTime = 30;
const APIKey = "AIzaSyDYgin8E87FEiZnPpzvQ6vqdPYpuEacKwI";

/**
 * Converts text representing travel time returned from a distance matrix API call to its
 * numerical value in minutes
 * 
 * @param {string} text: time text returned from distance matrix API call, in the form 'x min(s)' or 'x hour(s) y min(s)
 */
function hourMinutesToMinutes(text)
{
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

/**
 * Returns an estimated travel time between two locations at a specified departure time,
 * also incorporating an expected overhead time for a delivery.
 * 
 * @param {string} source: Address of starting location
 * @param {string} destination: Address of destination
 * @param {Date} departDate: Date and time of departure
 */
async function getTravelTime(source, destination, departDate)
{
    return await request.get("https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + source + "&destinations=" + destination + "&departure_time=" + (departDate.getTime() / 1000) + "&key=" + APIKey).then((body) =>
    {
        return hourMinutesToMinutes(JSON.parse(body).rows[0].elements[0].duration.text) + travelOverheadTime;
    });
}

/**
 * Returns a date object with corresponding parameters used to set departure time in distance matrix API
 * 
 * @param {number} day
 * @param {number} month 
 * @param {number} year 
 * @param {number} hour: Expressed in military time i.e. 0-23
 * @param {number} minutes 
 */
function createDate(day, month, year, hour, minutes)
{
    return new Date(year + "-" + month + "-" + day + " " + hour + ":" + minutes + ":00");
}

/**
 * Returns true if the passed address can be found by the Distance Matrix API
 * 
 * @param {string} address
 */
async function validateAddress(address)
{
    return await request.get("https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + address + "&destinations=" + address + "&key=" + APIKey).then((body) =>
    {
        return JSON.parse(body).rows[0].elements[0].status != "NOT_FOUND";
    }).catch((err) =>
    {
        return false;
    });
}

module.exports = {
    getTravelTime,
    createDate
}