const express = require("express");
const router = express.Router();

/* UNIVERSAL */
router.post("/test/:id", async function (req, res, next) {
  try {
    let result = {};
    switch (req.body.action) {
      case "create": // create
        createResource(
          req.body.resource,
          req.body.payload,
          function (err, result) {
            if (err) {
              res.status(400).json({ error: true, message: err.message });
              return;
            } else {
              result.error
                ? res.status(400).json(result)
                : res.status(200).json(result);
              return;
            }
          }
        );
        break;
      case "update": // update
        console.log(req.body.action);
        updateResource(
          req.body.resource,
          req.body.payload,
          function (err, result) {
            if (err) {
              res.status(400).json({ error: true, message: err.message });
              return;
            } else {
              result.error
                ? res.status(400).json(result)
                : res.status(200).json(result);
              return;
            }
          }
        );
        break;
      case "read": // read
        console.log(req.body.action);
        result = getResource(req.body.resource, resourcePayload);
        result.error
          ? res.status(400).json(result)
          : res.status(200).json(result);
        break;
      case "delete":
        console.log(req.body.action);
        result = deleteResource(req.body.resource, req.body.payload);
        result.error
          ? res.status(400).json(result)
          : res.status(200).json(result);
        break;
    }
    return;
    const request_format = {
      action: "",
      resource: "",
      payload: {},
      callback_url: "",
      user_id: "",
      task_id: "",
    };
  } catch (error) {
    console.error(`error while sending message `, error);
    next(error);
  }
});

function getResource(resourceName, resourcePayload) {
  // map key values with table columns
  let resourceKeyValuePairs = "";
  let resourceId = "";
  resourceFilter = "";
  Object.keys(resourcePayload).forEach(([key, value]) => {
    if (key === "id") {
      resourceId = value;
    } else {
      if (resourceKeyValuePairs === "") {
        resourceKeyValuePairs = `${key} = '${value}'`;
      } else {
        resourceKeyValuePairs += `, ${key} = '${value}'`;
      }
    }
  });

  const db = require("../../services/db").dbConnection();
  db.all(
    `SELECT * FROM ${resourceName} WHERE deleted = 0 ${resourceFilter} ORDER BY id`,
    [],
    function (err, rows) {
      if (err) {
        db.close();
        callback(null, []);
      } else {
        if (rows.length > 0) {
          const filtered = rows.filter((task) => {
            return task.date.split("-")[0] == selectedYear;
          });
          callback(null, filtered);
        } else {
          callback(null, []);
        }
      }
    }
  );
}

function updateResource(resourceName, resourcePayload, callback) {
  try {
    // map key values with table columns
    let resourceKeyValuePairs = "";
    let resourceId = "";
    Object.keys(resourcePayload).forEach((key) => {
      if (key === "id") {
        resourceId = resourcePayload[key];
      } else {
        resourceKeyValuePairs === ""
          ? (resourceKeyValuePairs = `${key} = '${resourcePayload[key]}'`)
          : (resourceKeyValuePairs += `, ${key} = '${resourcePayload[key]}'`);
      }
    });

    const db = require("../../services/db").dbConnection();
    const moment = require("moment");
    console.log(`UPDATE ${resourceName} SET ${resourceKeyValuePairs}, date_updated = '${moment().format()}' WHERE id = '${resourceId}'`);
    db.run(
      `UPDATE ${resourceName} SET ${resourceKeyValuePairs}, date_updated = '${moment().format()}' WHERE id = '${resourceId}'`,
      [],
      function (err) {
        if (err) {
          callback(null, {
            error: true,
            data: err.message,
          });
        }
        callback(null, {
          error: false,
          data: this,
        });
      }
    );
    db.close();
  } catch (error) {
    callback(null, {
      error: true,
      message: error,
    });
  }
}

function createResource(resourceName, resourcePayload, callback) {
  try {
    // map key values with table columns
    let resourceKeys = "";
    let resourceKeyPlaceHolders = "";
    let resourceValues = [];
    Object.keys(resourcePayload).forEach((key) => {
      if (resourceKeys === "") {
        resourceKeys = key;
        resourceKeyPlaceHolders = "?";
      } else {
        resourceKeys += ", " + key;
        resourceKeyPlaceHolders += ", ?";
      }
      resourceValues.push(resourcePayload[key]);
    });

    const db = require("../../services/db").dbConnection();
    db.run(
      `INSERT INTO ${resourceName} (${resourceKeys}) VALUES (${resourceKeyPlaceHolders})`,
      resourceValues,
      function (err) {
        if (err) {
          callback(null, {
            error: true,
            data: err.message,
          });
        }
        callback(null, {
          error: false,
          data: this,
        });
      }
    );
    db.close();
  } catch (error) {
    callback(null, {
      error: true,
      message: error,
    });
  }
}

function deleteResource(resourceName, resourcePayload) {
  // TODO : explore options to flag rows as deleted
  try {
    // map key values with table columns
    let resourceKeyValuePairs = "";
    let resourceId = "";
    Object.keys(resourcePayload).forEach(([key, value]) => {
      if (key === "id") {
        resourceId = value;
      } else {
        if (resourceKeyValuePairs === "") {
          resourceKeyValuePairs = `${key} = '${value}'`;
        } else {
          resourceKeyValuePairs += `, ${key} = '${value}'`;
        }
      }
    });

    const db = require("../../services/db").dbConnection();
    const moment = require("moment");
    db.run(
      `UPDATE ${resourceName} SET deleted = '1', date_updated = '${moment().format()}' WHERE id = '${resourceId}'`,
      [],
      function (err) {
        if (err) {
          // TODO : confirm if this is correct
          return {
            error: true,
            message: err.message,
          };
        }
        return {
          error: false,
          message: "row was deleted",
        };
      }
    );
    db.close();
  } catch (error) {
    res.status(400).json({
      error: true,
      message: error,
    });
    return;
  }
}

module.exports = router;
