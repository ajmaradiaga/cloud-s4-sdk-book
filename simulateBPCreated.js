const cron = require('node-cron');
const { raiseBPCreatedEvent } = require('./bpEvents');

// Assuming the data items are in an array
// const items = Array.from({length: 1000}, (_, i) => `item_${i}`);
let currentItemIndex = 0;

const startPosting = (cronSchedule, url, topic, auth, data) => {
    cron.schedule(cronSchedule, () => {
        console.log('Running cron job');
        console.log(`Current item index: ${currentItemIndex} and data.length: ${data.length}`);
        if (currentItemIndex < data.length) {
            const item = data[currentItemIndex++];
            raiseBPCreatedEvent(url, topic, auth, { item });
        } else if (process.env.SIMULATE_BP_CREATED_REPEAT_LOOP === 'true') {
            // Restarting the loop
            currentItemIndex = 0;
        }
    });
};

module.exports = startPosting;