const express = require("express");
const {
  tableActionGeneric,
  createResourceGeneric,
} = require("../../services/db_client");
const router = express.Router();
const moment = require("moment");

/* LIST all tasks */
router.get("/:systemid", async function (req, res, next) {
  try {
    const db = require("../../services/db").dbConnection();
    db.all(
      `SELECT date, systemid, uuid, previous_point_marker, current_point_marker, status FROM task WHERE systemid = '${req.params.systemid}' ORDER BY id`,
      [],
      (err, rows) => {
        if (err) {
          res.status(400).json({
            error: true,
            message: err.message,
          });
          db.close();
          return;
        }
        if (rows.length > 0) {
          console.log("some rows");
          res.status(200).json({
            error: false,
            data: rows,
          });
          db.close();
          return;
        } else {
          console.log("no rows");
          res.status(400).json({
            error: true,
            message: "no tasks found",
          });
          db.close();
          return;
        }
      }
    );
  } catch (error) {
    console.error(`error while fetching task list`, error);
    res.status(400).json({ error: true, message: error });
    next(error);
  }
});

/* POST NEW task */
router.post("/:systemid", async function (req, res, next) {
  try {
    createResourceGeneric(
      "task",
      {
        systemid: req.params.systemid,
        uuid: "uuid-000-000-001",
        user_mobile: req.body.user,
        query: req.body.query,
        created_on: moment().format(),
        updated_on: moment().format(),
      },
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
  } catch (error) {
    console.error(`error while sending message `, error);
    next(error);
  }
});

module.exports = router;
