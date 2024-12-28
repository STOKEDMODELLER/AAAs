const express = require("express");
const Client = require("../models/Client");
const router = express.Router();

// Add a new client with duplicate checks
router.post("/", async (req, res, next) => {
  try {
    const { clientID, email, passport } = req.body;

    // Check for duplicates
    const duplicate = await Client.findOne({
      $or: [{ clientID }, { email }, { passport }],
    });

    if (duplicate) {
      let duplicateField = "details";
      if (duplicate.clientID === clientID) duplicateField = "Client ID";
      else if (duplicate.email === email) duplicateField = "Email";
      else if (duplicate.passport === passport) duplicateField = "Passport";

      return res.status(400).json({
        success: false,
        message: `Duplicate entry detected: ${duplicateField} already exists.`,
      });
    }

    // Create a new client
    const newClient = new Client(req.body);
    await newClient.save();

    return res.status(201).json({
      success: true,
      message: "Client added successfully.",
      data: newClient,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update an existing client by ID with duplicate checks
 * Example: PUT /api/clients/12345
 */
router.put("/:id", async (req, res, next) => {
  try {
    const clientID = req.params.id;
    const { clientID: newClientID, email: newEmail, passport: newPassport } = req.body;

    // 1) Check if the client exists
    const existingClient = await Client.findById(clientID);
    if (!existingClient) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    // 2) Optional: Check for duplicates if any fields have changed
    //    For example, if the user updated the clientID, email, or passport
    if (
      (newClientID && newClientID !== existingClient.clientID) ||
      (newEmail && newEmail !== existingClient.email) ||
      (newPassport && newPassport !== existingClient.passport)
    ) {
      const duplicate = await Client.findOne({
        $or: [
          { clientID: newClientID || "" },
          { email: newEmail || "" },
          { passport: newPassport || "" },
        ],
      });

      if (duplicate && duplicate._id.toString() !== clientID) {
        // We found a different client with the same info
        let duplicateField = "details";
        if (duplicate.clientID === newClientID) duplicateField = "Client ID";
        else if (duplicate.email === newEmail) duplicateField = "Email";
        else if (duplicate.passport === newPassport) duplicateField = "Passport";

        return res.status(400).json({
          success: false,
          message: `Duplicate entry detected: ${duplicateField} already exists.`,
        });
      }
    }

    // 3) Update the client fields
    //    (We only update the fields sent in the request body; if none are sent, fallback to existing)
    existingClient.clientID = newClientID ?? existingClient.clientID;
    existingClient.name = req.body.name ?? existingClient.name;
    existingClient.address = req.body.address ?? existingClient.address;
    existingClient.email = newEmail ?? existingClient.email;
    existingClient.contactNumber = req.body.contactNumber ?? existingClient.contactNumber;
    existingClient.saID = req.body.saID ?? existingClient.saID;
    existingClient.passport = newPassport ?? existingClient.passport;

    await existingClient.save();

    return res.status(200).json({
      success: true,
      message: "Client updated successfully.",
      data: existingClient,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
/**
 * Get all clients
 * Example: GET /api/clients
 */
router.get("/", async (req, res, next) => {
  try {
    const clients = await Client.find({});
    // Return your clients array as JSON
    return res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    next(error);
  }
});
