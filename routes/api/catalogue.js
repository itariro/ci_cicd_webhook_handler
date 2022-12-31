const express = require("express");
const router = express.Router();

/* LIST all from a specific user */
router.get("/user/:user_mobile", async function (req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	try {
		const resourceList = await getAllCatalogueItems({ user_mobile: req.params.user_mobile });
		resourceList.error
			? res.status(400).json(resourceList)
			: res.status(200).json(resourceList);
		return;
	} catch (error) {
		console.error(`error while fetching task list`, error);
		res.status(400).json({ error: true, message: error });
		next(error);
	}
});

/* LIST all based on a task */
router.get("/task/:task_uuid", async function (req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	try {
		const resourceList = await getAllCatalogueItems({ task_uuid: req.params.task_uuid });
		resourceList.error
			? res.status(400).json(resourceList)
			: res.status(200).json(resourceList);
		return;
	} catch (error) {
		console.error(`error while fetching task list`, error);
		res.status(400).json({ error: true, message: error });
		next(error);
	}
});

async function getAllCatalogueItems(searchFilter) {
	try {
		let tableModel = global.CURRENT_MODELS.find(
			(tableProperties) => tableProperties.table_name === "user_mobile_catalogue"
		);
		if (tableModel != null) {
			const resourceList = await tableModel.model_name.findAll({
				logging: false,
				where: searchFilter,
			});
			// process the outstanding TASKS HERE
			return {
				error: false,
				data: resourceList,
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
