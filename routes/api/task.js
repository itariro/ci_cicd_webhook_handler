const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const moment = require("moment");
const {
	tableActionGeneric,
	createResourceGeneric,
	readMultipleResourceGeneric,
	readMultipleAllResourceGeneric,
} = require("../../services/db_client");
const { getAllTasks } = require("../../services/task_manager");

/* LIST all tasks */
router.get("/:systemid", async function (req, res, next) {
	try {

		const pendingTasks = await getAllTasks();
		pendingTasks.error
			? res.status(400).json(pendingTasks)
			: res.status(200).json(pendingTasks);
		return;

		// readMultipleAllResourceGeneric(
		// 	"task",
		// 	function (err, result) {
		// 		if (err) {
		// 			res.status(400).json({ error: true, message: err.message });
		// 			return;
		// 		} else {
		// 			result.error
		// 				? res.status(400).json(result)
		// 				: res.status(200).json(result);
		// 			return;
		// 		}
		// 	}
		// );
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
				uuid: uuidv4(),
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
