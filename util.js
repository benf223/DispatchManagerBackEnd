function parseTimeOfDay(str)
{
    let words = str.split(":");
    let hours = Number.parseInt(words[0]);
    let minutes = Number.parseInt(words[1]);
    
    if(Number.isNaN(hours) || Number.isNaN(minutes))
    {
        throw new Error("'" + str + "' has invalid format");
    }
    else if(hours < 0 || hours > 23)
    {
        throw new Error("Invalid hours '" + hours + "' passed");
    }
    else if(minutes < 0 || minutes > 59)
    {
        throw new Error("Invalid minutes '" + minutes + "' passed");
    }

    return ("0" + hours).substr(hours.toString().length - 1) + ":" + ("0" + minutes).substr(minutes.toString().length - 1);
}

/**
 * Returns true if t1 is before t2
 * 
 * @param {string} t1: In form hh:mm
 * @param {string} t2: In form hh:mm
 */
function timeOfDayIsBefore(t1, t2)
{
    t1 = t1.split(":");
    t2 = t2.split(":");

    let t1Hours = Number.parseInt(t1[0]);
    let t2Hours = Number.parseInt(t2[0]);

    return t1Hours < t2Hours || (t1Hours == t2Hours && Number.parseInt(t1[1]) < Number.parseInt(t2[1]));
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
function createDate(day, month, year, hour = 0, minutes = 0)
{
    return new Date(year + "-" + month + "-" + day + " " + hour + ":" + minutes + ":00");
}

function parseDateString(date)
{
    return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
}

function getFirstProperty(obj)
{
    for(p in obj)
    {
        return obj[p];
    }
}

module.exports = {
    parseTimeOfDay,
    timeOfDayIsBefore,
    createDate,
    parseDateString,
    getFirstProperty
}