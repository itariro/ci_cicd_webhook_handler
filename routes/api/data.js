
const express = require("express");
const router = express.Router();

/* purge all data */
router.get("/purgeall", async function (req, res, next) {
	try {
		const db = require("../../services/db");

		/* purge event */
		db.deleteDatabase();
		console.log(`purged database...`);

		db.createDatabase();
		console.log(`recreated database...`);

		/* log incident */
		db.createIncidentLog({
			description: "Database purge",
			source: "System",
			severity: "HIGH",
		});

		res.status(200).json({
			error: false,
			data: this.lastID,
		});
		return;
	} catch (err) {
		console.error(`Error while recreating the database`, err.message);
		res.status(400).json({ error: true, message: err.message });
		next(err);
	}
});

module.exports = router;
