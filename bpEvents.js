const https = require('https');
const { CloudEvent } = require('cloudevents');
const { lastIndexOf } = require('./time-off/employee-time');

const raiseBPCreatedEvent = (url, topic, auth, item) => {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(auth.username + ':' + auth.password).toString('base64')
        }
    };

    bp = item['item'];
    bpId = bp['BusinessPartner'];

    const event = new CloudEvent({
        type: 'sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1',
        specversion: '1.0',
        source: '/default/sap.s4.beh/244572008',
        datacontenttype: 'application/json',
        data: {
            BusinessPartner: bpId
        }
    });

    // Including topic in URL
    url += `${topic}`

    console.log(`Posting event for Business Partner ${bpId} to ${topic}`);

    const req = https.request(url, options, (res) => {
        res.on('data', (d) => {
            process.stdout.write(d);
        });
    });

    req.on('error', (error) => {
        console.error(error);
    });

    req.write(JSON.stringify(event, null, 3));
    req.end();
};

const raiseCustomBPCreatedEvent = (url, topic, auth, item) => {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(auth.username + ':' + auth.password).toString('base64')
        }
    };

    bp = item['item'];
    bpId = bp['BusinessPartner'];

    sapCommunityDisplayName = bp['YY1_SAPCommunityDisplayName'];

    // Including topic in URL
    url += `${topic}/${sapCommunityDisplayName}`;

    const event = new CloudEvent({
        type: 'cust.ext.codejam.ZBUSINESSPARTNER.Created.v1',
        specversion: '1.0',
        source: '/default/sap.s4.beh/244572008',
        sapcommunitydispname: sapCommunityDisplayName,
        datacontenttype: 'application/json',
        data: {
            BusinessPartner: bpId,
            FirstName: bp['FirstName'],
            LastName: bp['LastName'],
            YY1_SAPCommunityDisplayName: sapCommunityDisplayName
        }
    });

    console.log(`Posting event for Business Partner ${bpId} to ${topic}/${sapCommunityDisplayName}`);

    const req = https.request(url, options, (res) => {
        res.on('data', (d) => {
            process.stdout.write(d);
        });
    });

    req.on('error', (error) => {
        console.error(error);
    });

    req.write(JSON.stringify(event, null, 3));
    req.end();
};

module.exports = { raiseBPCreatedEvent, raiseCustomBPCreatedEvent};