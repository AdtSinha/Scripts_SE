const http = require('http');
const { getBaseCountry } = require('./country')
const { getProfiles } = require('./profiles')
const { getAof } = require('./aof');
const { getTiles } = require('./tiles');
const { getAdditionalServices } = require('./additionalServices');
const { getBusinessHours } = require('./businessHours');
const { getPhoneNumbers } = require('./phoneNumber')
const { getRetailers } = require('./retailer');
const { additionalServicesKeyMapper } = require('./additionalServicesMapper');
const { readFromFile } = require('./readFromFile');


const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text\/plain');
    res.end('Hello, this is a basic Node.js server!');
});

const PORT = 3000;
server.listen(PORT, async () => {
    const result = await getProfiles(); 
    console.log(result);
    console.log(`Server is running on port ${PORT}`);
});