const { v4: uuidv4 } = require('uuid');
const contentful = require('contentful-management');
const express = require("express");
const router = express.Router();
const resource_register = require("../../store/resource_register");

/* purge resources */
router.get("/purge/:resource", async function (req, res, next) {
	try {
		const db = require("../../services/db");
		const resourceSchema = global.API_CONFIGS[0].resourceSchema;
		if (req.params.resource === "all") {
			resourceSchema.map((resource) => {
				console.log('purge -> ', resource.table);
				db.purgeSingleTable(resource.table, "DELETE");
			});
		} else {
			if (resourceSchema.some(item => item.table === req.params.resource)) {
				db.purgeSingleTable(req.params.resource, "DELETE");
			} else {
				console.error(`${req.params.resource} does not exist`);
				res.status(400).json({
					error: true,
					message: `${req.params.resource} does not exist`,
				});
				return;
			}
		}

		/* log incident */
		db.createIncidentLog({
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

/* purge resources */
router.get("/drop/:resource", async function (req, res, next) {
	try {
		const db = require("../../services/db");
		if (req.params.resource === "all") {
			for (const r of resource_register) {
				db.purgeSingleTable(r, "DROP");
			}
		} else {
			if (resource_register.includes(req.params.resource)) {
				db.purgeSingleTable(req.params.resource, "DROP");
			} else {
				console.error(`${req.params.resource} does not exist`);
				res.status(400).json({
					error: true,
					message: `${req.params.resource} does not exist`,
				});
				return;
			}
		}

		/* recreate the table */
		db.createDatabase();

		/* log incident */
		db.createIncidentLog({
			description: `resource purge -> ${req.params.resource}`,
			source: "system",
			severity: "HIGH",
		});

		res.status(200).json({
			error: false,
			message: `resource recreated -> ${req.params.resource}`,
		});
		return;
	} catch (error) {
		console.error(`error while recreating the database`, error);
		res.status(400).json({ error: true, message: error });
		next(error);
	}
});

/* purge resources */
router.get("/apikey/set", async function (req, res, next) {
	try {
		const db = require("../../services/db");
		const newApiKey = uuidv4();
		const client = contentful.createClient({
			accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN
		})

		client.getSpace(process.env.CONTENTFUL_SPACE)
			.then((space) => space.getEnvironment('master'))
			.then((environment) => environment.getEntry('41VlUnLymaEcNxt2OofsBo'))
			.then((entry) => entry.patch([
				{
					op: 'replace',
					path: '/fields/apiKey/en-US',
					value: newApiKey
				}
			]))
			.then((entry) => {
				console.log(`Entry ${entry.sys.id} updated.`);
				/* log incident */
				global.API_KEY = newApiKey;
				db.createIncidentLog({
					description: `apikey regen-> success`,
					source: "system",
					severity: "HIGH",
				});
				return res.status(200).json({
					error: false,
					message: `apikey regen success`,
				});
			})
			.catch(() => {
				/* log incident */
				db.createIncidentLog({
					description: `apikey regen-> failed`,
					source: "system",
					severity: "HIGH",
				});
				return res.status(400).json({
					error: true,
					message: `apikey regen-> ${error}`,
				})
			})
	} catch (error) {
		console.error(`error setting new api key`, error);
		res.status(400).json({ error: true, message: error });
		next(error);
	}
});

module.exports = router;
