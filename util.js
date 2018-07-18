function parseTimeOfDay(str)
{
    let words = str.split(":");
    let hours = "0" + Number.parseInt(words[0]);
    let minutes = "0" + Number.parseInt(words[1]);

    if(hours < 0 || hours > 23)
    {
        throw new Error("Invalid hours passed");
    }
    else if(minutes < 0 || minutes > 59)
    {
        throw new Error("Invalid minutes passed");
    }

    return hours.substr(hours.length - 2) + ":" + minutes.substr(minutes.length - 2);
}

function objEql(obj1, obj2)
{
    obj1.foreach((prop) =>
    {
        if(obj1[prop] != obj2[prop]) return false;
    });

    return true;
}

module.exports = {
    parseTimeOfDay,
    objEql
}