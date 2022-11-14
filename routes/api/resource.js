const express = require("express");
const { dbConnectionSequelize } = require("../../services/db");
const router = express.Router();
let sequelizeInstance = dbConnectionSequelize();

/* UNIVERSAL */
router.post("/test/:id", async function (req, res, next) {
	try {
		let result = {};
		switch (req.body.action) {
			case "create": // create
				createResource(
					req.body.resource,
					req.body.payload,
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
				break;
			case "update": // update
				updateResource(
					req.body.resource,
					req.body.payload,
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
				break;
			case "read": // read
				readResource(
					req.body.resource,
					req.body.filter,
					req.body.children,
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
				break;
			case "delete":
				deleteResource(
					req.body.resource,
					req.body.payload,
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
				break;
		}
		return;
	} catch (error) {
		console.error(`error while sending message `, error);
		next(error);
	}
});

function getResource(resourceName, resourceFilter, resourceChildren, callback) {
	// map key values with table columns
	let resourceFilter = "";
	Object.keys(resourceFilter).forEach((key) => {
		resourceFilter += ` AND ${key} = '${resourceFilter[key]}'`;
	});

	// const db = require("../../services/db").dbConnection();
	console.log(`SELECT * FROM ${resourceName} WHERE deleted = 0 ${resourceFilter} ORDER BY id`);

	// db.all(
	// 	`SELECT * FROM ${resourceName} WHERE deleted = 0 ${resourceFilter} ORDER BY id`,
	// 	[],
	// 	function (err, rows) {
	// 		if (err) {
	// 			db.close();
	// 			callback(null, {
	// 				error: true,
	// 				message: "no record found",
	// 			});
	// 		} else {
	// 			if (rows.length > 0) {
	// 				callback(null, {
	// 					error: false,
	// 					data: rows,
	// 				});
	// 			} else {
	// 				callback(null, {
	// 					error: true,
	// 					message: "no record found",
	// 				});
	// 			}
	// 		}
	// 	}
	// );
}

function updateResource(resourceName, resourcePayload, callback) {
	try {
		// map key values with table columns
		let resourceKeyValuePairs = "";
		let resourceId = "";
		Object.keys(resourcePayload).forEach((key) => {
			if (key === "id") {
				resourceId = resourcePayload[key];
			} else {
				resourceKeyValuePairs === ""
					? (resourceKeyValuePairs = `${key} = '${resourcePayload[key]}'`)
					: (resourceKeyValuePairs += `, ${key} = '${resourcePayload[key]}'`);
			}
		});

		const db = require("../../services/db").dbConnection();
		const moment = require("moment");
		console.log(
			`UPDATE ${resourceName} SET ${resourceKeyValuePairs}, date_updated = '${moment().format()}' WHERE id = '${resourceId}'`
		);
		db.run(
			`UPDATE ${resourceName} SET ${resourceKeyValuePairs}, date_updated = '${moment().format()}' WHERE id = '${resourceId}'`,
			[],
			function (err) {
				if (err) {
					callback(null, {
						error: true,
						data: err.message,
					});
				}
				callback(null, {
					error: false,
					data: this, // TODO : add method to pull and display updated record
				});
			}
		);
		db.close();
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

function createResource(resourceName, resourcePayload, callback) {
	try {
		// map key values with table columns
		let resourceKeys = "";
		let resourceKeyPlaceHolders = "";
		let resourceValues = [];
		Object.keys(resourcePayload).forEach((key) => {
			if (resourceKeys === "") {
				resourceKeys = key;
				resourceKeyPlaceHolders = "?";
			} else {
				resourceKeys += ", " + key;
				resourceKeyPlaceHolders += ", ?";
			}
			resourceValues.push(resourcePayload[key]);
		});

		const db = require("../../services/db").dbConnection();
		db.run(
			`INSERT INTO ${resourceName} (${resourceKeys}) VALUES (${resourceKeyPlaceHolders})`,
			resourceValues,
			function (err) {
				if (err) {
					callback(null, {
						error: true,
						data: err.message,
					});
				}
				callback(null, {
					error: false,
					data: this,
				});
			}
		);
		db.close();
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

async function deleteResource(resourceName, resourcePayload, callback) {
	try {
		// map key values with table columns
		let resourceId = "";
		Object.keys(resourcePayload).forEach((key) => {
			if (key === "id") {
				resourceId = resourcePayload[key];
			}
		});

		// const db = require("../../services/db").dbConnection();
		const moment = require("moment");
		const [metadata] = await sequelize.query(`UPDATE ${resourceName} SET deleted = '1', date_updated = '${moment().format()}' WHERE id = '${resourceId}'`);
		if (metadata > 0) {
			// updated
			callback(null, {
				error: false,
				message: "record was deleted", // TODO : add method to pull and display updated record
			});
		} else {
			// maybe not, let's explore this
			callback(null, {
				error: true,
				message: "record was not deleted due to an unspecified error",
			});
		}
		// db.run(
		//   `UPDATE ${resourceName} SET deleted = '1', date_updated = '${moment().format()}' WHERE id = '${resourceId}'`,
		//   [],
		//   function (err) {
		//     if (err) {
		//       callback(null, {
		//         error: true,
		//         data: err.message,
		//       });
		//     }
		//     callback(null, {
		//       error: false,
		//       message: "record was deleted", // TODO : add method to pull and display updated record
		//     });
		//   }
		// );
		// db.close();
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

async function readResource(resourceName, resourceFilter, resourceChildren, callback) {
	try {
		// get table column display options
		const resourceSchema = global.API_CONFIGS[0].resourceSchema;
		if (resourceSchema.some(item => item.table === resourceName)) {

			// map key values with table columns
			let resourceFilter = "";
			Object.keys(resourceFilter).forEach((key) => {
				resourceFilter += ` AND ${key} = '${resourceFilter[key]}'`;
			});

			const [results, metadata] = await sequelizeInstance.query(`SELECT * FROM ${resourceName} WHERE deleted = 0 ${resourceFilter} ORDER BY id`);
			if (results) {
				// map key values with table columns
				// TODO : fix resourceChildren & 
				let resourceFilter = ""; let childrenResources = [];
				Object.keys(resourceChildren).forEach(async (key) => {
					if (resourceSchema.some(item => item.table === resourceName)) {
						const [results, metadata] = await sequelizeInstance.query(`SELECT * FROM ${resourceChildren[key]} WHERE deleted = 0 ${resourceFilter} ORDER BY id`);
						childrenResources.push({ [resourceChildren[key]]: results });
					}
				});
				callback(null, {
					error: false,
					data: results,
					children: childrenResources,
				});
			} else {
				callback(null, {
					error: true,
					data: "no data found",
				});
			}
			return;
		} else {
			console.error(`${resourceName} does not exist`);
			callback(null, {
				error: true,
				message: `${resourceName} does not exist`,
			});
			return;
		}
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

module.exports = router;

