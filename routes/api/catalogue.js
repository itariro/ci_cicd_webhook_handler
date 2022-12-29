const express = require("express");
const router = express.Router();
const {
	createResourceGeneric,
} = require("../../services/db_client");
const { getAllTasks } = require("../../services/task_manager");

/* LIST all from a specific user */
router.get("/user/:user_mobile", async function (req, res, next) {
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

/* LIST all based on a task */
router.get("/task/:task_uuid", async function (req, res, next) {
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

async function getAllCatalogueItems(siftFilter) {
	try {
		let tableModel = global.CURRENT_MODELS.find(
			(tableProperties) => tableProperties.table_name === "user_mobile_catalogue"
		);
		if (tableModel != null) {
			const pendingTasks = await tableModel.model_name.findAll({
				logging: false,
				where: {
					[Op.and]: [{ attempts: [0, 1, 2] }, { status: 0 }, { in_queue: 0 }],
				},
			});
			// process the outstanding TASKS HERE
			return {
				error: false,
				data: pendingTasks,
			};
		} else {
			console.log("resource does not exist");
			return {
				error: true,
				message: "resource does not exist",
			};
		}
	} catch (error) {
		console.log(error);
		return {
			error: true,
			message: error,
		};
	}
}

module.exports = router;
