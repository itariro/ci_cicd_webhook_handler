const express = require("express");
const {
	tableActionGeneric,
	createResourceGeneric,
	readMultipleResourceGeneric,
	readMultipleAllResourceGeneric,
} = require("../../services/db_client");
const router = express.Router();
const moment = require("moment");

/* LIST all tasks */
router.get("/:systemid", async function (req, res, next) {
	try {
		readMultipleAllResourceGeneric(
			"task",
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
