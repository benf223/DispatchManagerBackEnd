const request = require("request-promise");
const travelOverheadTime = 30;
const APIKey = "AIzaSyDYgin8E87FEiZnPpzvQ6vqdPYpuEacKwI";

/**
 * Converts text representing travel time returned from a distance matrix API call to its
 * numerical value in minutes
 * 
 * @param {string} text: time text returned from distance matrix API call, in the form 'x min(s)' or 'x hour(s) y min(s)
 */
function timeTextToMinutes(text)
{
    try
    {
        let words = text.split(" ");
        let minutes = Number.NaN;
        if(words.length == 2)
        {
            minutes = Number.parseInt(words[0]);
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
    if(!source || !destination || !departDate)
    {
        throw new Error("Source, destination and departure date must be specified");
    }

    return await request.get("https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + source + "&destinations=" + destination + "&departure_time=" + (departDate.getTime() / 1000) + "&key=" + APIKey).then((body) =>
    {
        let res = JSON.parse(body);

        switch(res.status)
        {
            case "OK":
                if(res.origin_addresses[0] == "")
                {
                    throw new Error("Invalid source address");
                }
                else if(res.destination_addresses[0] == "")
                {
                    throw new Error("Invalid destination address");
                }

                return timeTextToMinutes(res.rows[0].elements[0].duration.text) + travelOverheadTime;
            case "INVALID_REQUEST":
                if(res.error_message == "departure_time is in the past. Traffic information is only available for future and current times.")
                {
                    throw new Error("Date cannot be in the past");
                }
            default:
                throw new Error(res.error_message);
        }
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
    travelOverheadTime,
    getTravelTime,
    createDate,
    validateAddress
}