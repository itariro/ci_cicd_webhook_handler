const express = require("express");
const { getAllIncidents } = require("../../services/task_manager");
const router = express.Router();

/* LIST all incidents */
router.get("/all", async function (req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	try {
		const recordedIncidents = await getAllIncidents();
		recordedIncidents.error
			? res.status(400).json(recordedIncidents)
			: res.status(200).json(recordedIncidents);
		return;
	} catch (error) {
		console.error(`error while fetching incident list`, error);
		res.status(400).json({ error: true, message: error });
		next(error);
	}
});

module.exports = router;
