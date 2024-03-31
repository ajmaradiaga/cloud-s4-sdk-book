const app = require('./app');

require('dotenv').config()

const nodeAppStarted = Date.now();
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Mock server started on port ${port} after ${Date.now() - nodeAppStarted} ms, running - stop with CTRL+C (or CMD+C)...`))

console.log(`Simulating Business Partner Created events -> ${process.env.SIMULATE_BP_CREATED}`);

if (process.env.SIMULATE_BP_CREATED === 'true') {
    const simulateBPCreated = require('./simulateBPCreated');
    const data = require('./business-partner/business-partner-data.js').data;

    const url = process.env.SIMULATE_EVENTS_URL;  // replace your endpoint
    const auth = { username: process.env.SIMULATE_EVENTS_USERNAME, password: process.env.SIMULATE_EVENTS_PASSWORD };  // replace with your credentials

    const cronSchedule = process.env.SIMULATE_BP_CREATED_CRON || '*/30 * * * * *';  // default is every 30 seconds

    console.log(`Events will be generated on the following schedule: ${cronSchedule}\n`);

    simulateBPCreated(cronSchedule, url, auth, data);
}