const express = require("express");
const router = express.Router();
const {
	createResourceGeneric,
} = require("../../services/db_client");
const { getAllTasks } = require("../../services/task_manager");
const { registerUserGeneric } = require("../../services/user_manager");

/* LIST all tasks */
router.get("/:systemid", async function (req, res, next) {
	try {
		const pendingTasks = await getAllTasks();
		pendingTasks.error
			? res.status(400).json(pendingTasks)
			: res.status(200).json(pendingTasks);
		return;
	} catch (error) {
		console.error(`error while fetching task list`, error);
		res.status(400).json({ error: true, message: error });
		next(error);
	}
});

/* POST NEW task */
router.post("/:systemid", async function (req, res, next) {
	try {
		const { v4: uuidv4 } = require('uuid');
		registerUserGeneric({ mobile_number: req.body.user, status: 1, balance: 2.00 }, // each new user gets £2 worth of points : CAC
			function (user_err, user_result) {
				if (user_err) {
					res.status(400).json({ error: true, message: user_err.message });
					return;
				} else {
					user_result.error
						? res.status(400).json(user_result)
						: createResourceGeneric(
							"task",
							{
								systemid: req.params.systemid,
								uuid: uuidv4(),
								user_mobile: req.body.user,
								query: req.body.query,
							},
							function (task_err, task_result) {
								if (task_err) {
									res.status(400).json({ error: true, message: task_err.message });
									return;
								} else {
									res.status(task_result.error ? 400 : 200).json({ user: user_result, task: task_result });
									return;
								}
							}
						);
					return;
				}
			});
	} catch (error) {
		console.error(`error while sending message `, error);
		next(error);
	}
});

module.exports = router;
