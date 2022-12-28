const { v4: uuidv4 } = require('uuid');
const contentful = require('contentful-management');
const express = require("express");
const router = express.Router();
const { createIncidentLog } = require('../../services/task_manager');

/* purge resources */
router.get("/drop/:resource", async function (req, res, next) {
	try {
		/* TODO: add logic for use-case */
		
		/* log incident */
		createIncidentLog({
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

module.exports = router;
