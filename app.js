const express = require('express');
const path = require('path');
const app = express();

const bupaApi = require('./business-partner/business-partner-api.js');
const socialMediaApi = require('./social-media-accounts/social-media-accounts-api.js');
const timeSheetApi = require('./timeSheetEntryCollection/timeSheetEntryCollection-api.js');
const timeOff = require('./time-off/api.js');

const logRequests = function(req, res, next) {
    console.log(`Request: ${req.method} ${req.originalUrl}`)
    next();
};

const sendFakeCsrfToken = function(req, res, next) {
    res.header('x-csrf-token', 'dummyToken123')
    res.header('set-cookie', ['cookie'])
    next()
}

app.use(logRequests);
app.use(sendFakeCsrfToken)

app.use('/sap/opu/odata/sap/API_BUSINESS_PARTNER', bupaApi);
app.use('/sap/opu/odata/sap/YY1_BPSOCIALMEDIA_CDS', socialMediaApi);
app.use('/sap/opu/odata/sap/API_MANAGE_WORKFORCE_TIMESHEET', timeSheetApi);
app.use('/odata/v2', timeOff);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/create-bp', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'create-bp.html'));
});

module.exports = app;
