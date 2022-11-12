const express = require("express");
const router = express.Router();

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
    const db = require("../../services/db").dbConnection();
    const moment = require("moment");
    db.run(
      `INSERT INTO task (date, systemid, uuid, previous_point_marker, current_point_marker, status, attempts) VALUES(?,?,?,?,?,?,?)`,
      [
        moment().format(),
        req.params.systemid,
        req.params.systemid + "." + req.body.after,
        req.body.before,
        req.body.after,
        "pending",
        0,
      ],
      function (err) {
        if (err) {
          res.status(400).json({
            error: true,
            message: err.message,
          });
          return;
        }
        res.status(200).json({
          error: false,
          data: this.lastID,
        });
        return;
      }
    );
    db.close();
  } catch (error) {
    console.error(`error while sending message `, error);
    next(error);
  }
});

module.exports = router;
