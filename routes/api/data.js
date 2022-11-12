const express = require("express");
const router = express.Router();
const resource_register = require("../../store/resource_register");

/* purge resources */
router.get("/purge/:resource", async function (req, res, next) {
  try {
    const db = require("../../services/db");
    if (req.params.resource === "all") {
      for (const r of resource_register) {
        db.purgeSingleTable(r, "DELETE");
      }
    } else {
      if (resource_register.includes(req.params.resource)) {
        db.purgeSingleTable(req.params.resource, "DELETE");
      } else {
        console.error(`${req.params.resource} does not exist`);
        res.status(400).json({
          error: true,
          message: `${req.params.resource} does not exist`,
        });
        return;
      }
    }

    /* log incident */
    db.createIncidentLog({
      description: `resource purge -> ${req.params.resource}`,
      source: "system",
      severity: "HIGH",
    });

    res.status(200).json({
      error: false,
      message: `resource purged -> ${req.params.resource}`,
    });
    return;
  } catch (error) {
    console.error(`error while recreating the database`, error);
    res.status(400).json({ error: true, message: error });
    next(error);
  }
});

/* purge resources */
router.get("/drop/:resource", async function (req, res, next) {
  try {
    const db = require("../../services/db");
    if (req.params.resource === "all") {
      for (const r of resource_register) {
        db.purgeSingleTable(r, "DROP");
      }
    } else {
      if (resource_register.includes(req.params.resource)) {
        db.purgeSingleTable(req.params.resource, "DROP");
      } else {
        console.error(`${req.params.resource} does not exist`);
        res.status(400).json({
          error: true,
          message: `${req.params.resource} does not exist`,
        });
        return;
      }
    }

    /* recreate the table */
    db.createDatabase();

    /* log incident */
    db.createIncidentLog({
      description: `resource purge -> ${req.params.resource}`,
      source: "system",
      severity: "HIGH",
    });

    res.status(200).json({
      error: false,
      message: `resource recreated -> ${req.params.resource}`,
    });
    return;
  } catch (error) {
    console.error(`error while recreating the database`, error);
    res.status(400).json({ error: true, message: error });
    next(error);
  }
});

module.exports = router;
