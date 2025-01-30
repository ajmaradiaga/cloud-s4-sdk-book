const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();

const odata = require("../odata-helpers.js");
const bupaModel = require("./business-partner-model.js");

const {
  raiseBPCreatedEvent,
  raiseCustomBPCreatedEvent,
} = require("../bpEvents.js");

const checkAuthorization = function (req, res, next) {
  if (process.env.BP_API_AUTHORIZATION_REQUIRED === "true") {
    console.log("Authorization is required");
    // Check for authentication in the request header
    if (req.headers.authorization) {
      const encoded = req.headers.authorization.split(" ")[1];
      console.log(`Encoded authorization header: ${encoded}`);
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      console.log(`Authorization header: ${decoded}`);

      if (decoded === `${process.env.BP_API_USERNAME}:${process.env.BP_API_PASSWORD}`) {
        console.log("Authorization successful");
        return true;
      } else {
        console.log("Incorrect authorization details");
        res.sendStatus(401);
      }
    } else {
      console.log("Authorization header not found");
      res.sendStatus(401);
    }

    return false;
  }

  return true;
};

const retrieveAllBusinessPartners = function (req, res, next) {
  console.log("Reading business partner entity set");

  if (!checkAuthorization(req, res, next)) {
    return;
  }

  skip = parseInt(req.query.$skip) || 0;
  top = parseInt(req.query.$top) || 100;

  res.result = bupaModel.getBusinessPartners(skip, top);
  next();
};

const retrieveSingleBusinessPartner = function (req, res, next) {
  console.log(`Reading business partner ${req.params.id}`);

  if (!checkAuthorization(req, res, next)) {
    return;
  }
  
  res.result = bupaModel.findBusinessPartner(req.params.id);
  next();
};

const retrieveAllAddresses = function (req, res, next) {
  console.log("Reading address entity set");
  res.result = bupaModel.getAddresses();
  next();
};

const retrieveSingleAddress = function (req, res, next) {
  console.log(`Reading address (${req.params.bupaId},${req.params.addressId})`);
  res.result = bupaModel.findAddress(req.params.bupaId, req.params.addressId);
  next();
};

const createBusinessPartner = function (req, res, next) {
  console.log("Creating business partner");

  if (!checkAuthorization(req, res, next)) {
    return;
  }

  res.result = bupaModel.createAndAddBusinessPartner(req.body);
  console.log(`Created business partner ${res.result.BusinessPartner}`);

  if (process.env.TRIGGER_BP_CREATED_EVENT) {
    raiseBPCreatedEvent(
      process.env.EVENT_BROKER_URL,
      process.env.BP_CREATED_TOPIC,
      {
        username: process.env.EVENT_BROKER_USERNAME,
        password: process.env.EVENT_BROKER_PASSWORD,
      },
      { item: res.result }
    );
    console.log(`Created business partner sent to event broker`);
  }

  if (process.env.TRIGGER_CUSTOM_BP_CREATED_EVENT) {
    raiseCustomBPCreatedEvent(
      process.env.EVENT_BROKER_URL,
      process.env.CUSTOM_BP_CREATED_TOPIC,
      {
        username: process.env.EVENT_BROKER_USERNAME,
        password: process.env.EVENT_BROKER_PASSWORD,
      },
      { item: res.result }
    );
    console.log(`Created business partner sent to event broker`);
  }

  next();
};

const createAddress = function (req, res, next) {
  console.log("Creating address");
  res.result = bupaModel.createAndAddAddress(req.body);
  console.log(
    `Created address (${res.result.BusinessPartner},${res.result.AddressID})`
  );
  next();
};

const deleteBusinessPartner = function (req, res, next) {
  console.log(`Deleting business partner ${req.params.id}`);
  bupaModel.deleteBusinessPartner(req.params.id);
  next();
};

const deleteAddress = function (req, res, next) {
  console.log(
    `Deleting address (${req.params.bupaId},${req.params.addressId})`
  );
  bupaModel.deleteAddress(req.params.bupaId, req.params.addressId);
  next();
};

const modifyBusinessPartner = function (req, res, next) {
  console.log(`Modifying business partner ${req.params.id}`);
  bupaModel.modifyBusinessPartner(req.params.id, req.body);
  next();
};

const modifyAddress = function (req, res, next) {
  console.log(
    `Modifying address (${req.params.bupaId},${req.params.addressId})`
  );
  bupaModel.modifyAddress(req.params.bupaId, req.params.addressId, req.body);
  next();
};

// Serve EDMX file for /$metadata
router.get("/([$])metadata", function (req, res) {
  const options = {
    root: __dirname + "/",
    headers: {
      "Content-Type": "application/xml",
    },
  };
  console.log("Serving metadata for Business Partner API");
  res.sendFile("API_BUSINESS_PARTNER.edmx", options, function (err) {
    if (err) {
      console.error(
        "No metadata file found at business-partner/API_BUSINESS_PARTNER.edmx. Please check the documentation on how to retrieve and where to store this file."
      );
      res.sendStatus(404);
    }
  });
});

router.post(
  "/([$])batch",
  bodyParser.text({ type: () => true }),
  odata.batch,
  odata.set201Created
);

const handlersForBusinessPartnerUpdate = odata.middlewareForUpdate(
  retrieveSingleBusinessPartner,
  modifyBusinessPartner
);
const handlersForAddressUpdate = odata.middlewareForUpdate(
  retrieveSingleAddress,
  modifyAddress
);

router
  .route("/A_BusinessPartner")
  .get(retrieveAllBusinessPartners, odata.middlewareForSet())
  .post(odata.middlewareForCreate(createBusinessPartner));

router
  .route("/A_BusinessPartner\\((BusinessPartner=)?(':id'|%27:id%27)\\)")
  .get(retrieveSingleBusinessPartner, odata.middlewareForEntity())
  .delete(
    retrieveSingleBusinessPartner,
    odata.send404IfNotFound,
    deleteBusinessPartner,
    odata.send204NoContent
  )
  .patch(handlersForBusinessPartnerUpdate)
  .put(handlersForBusinessPartnerUpdate);

router
  .route("/A_BusinessPartnerAddress")
  .get(retrieveAllAddresses, odata.middlewareForSet())
  .post(odata.middlewareForCreate(createAddress));

router
  .route(
    "/A_BusinessPartnerAddress\\((BusinessPartner=)?(':bupaId'|%27:bupaId%27),(AddressID=)?(':addressId'|%27:addressId%27)\\)"
  )
  .get(retrieveSingleAddress, odata.middlewareForEntity())
  .delete(
    retrieveSingleAddress,
    odata.send404IfNotFound,
    deleteAddress,
    odata.send204NoContent
  )
  .patch(handlersForAddressUpdate)
  .put(handlersForAddressUpdate);

router.get("/", function (req, res) {
  res.json({
    d: {
      EntitySets: ["A_BusinessPartner", "A_BusinessPartnerAddress"],
    },
  });
});

module.exports = router;
