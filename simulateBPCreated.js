const https = require('https');
const cron = require('node-cron');
const { CloudEvent } = require('cloudevents');

// Assuming the data items are in an array
// const items = Array.from({length: 1000}, (_, i) => `item_${i}`);
let currentItemIndex = 0;

const post_data = (url, auth, item) => {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(auth.username + ':' + auth.password).toString('base64')
        }
    };

    bp = item['item']
    bpId = bp['BusinessPartner']

    const event = new CloudEvent({
        type: 'sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1',
        specversion: '1.0',
        source: '/default/sap.s4.beh/244572008',
        datacontenttype: 'application/json',
        data: {
            BusinessPartner: bpId
        }
    });

    console.log(`Posting event for Business Partner ${bpId}`);

    const req = https.request(url, options, (res) => {
        res.on('data', (d) => {
            process.stdout.write(d);
        });
    });

    req.on('error', (error) => {
        console.error(error);
    });

    req.write(event.toString());
    req.end();
};

const startPosting = (cronSchedule, url, auth, data) => {
    cron.schedule(cronSchedule, () => {
        console.log('Running cron job');
        console.log(`Current item index: ${currentItemIndex} and data.length: ${data.length}`);
        if (currentItemIndex < data.length) {
            const item = data[currentItemIndex++];
            post_data(url, auth, { item });
        } else if (process.env.SIMULATE_BP_CREATED_REPEAT_LOOP === 'true') {
            // Restarting the loop
            currentItemIndex = 0;
        }
    });
};

module.exports = startPosting;