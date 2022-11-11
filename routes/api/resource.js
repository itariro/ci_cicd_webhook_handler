const express = require("express");
const router = express.Router();

/* UNIVERSAL */
router.post("/:systemid", async function (req, res, next) {
	try {
		const db = require("../../services/db").dbConnection();
		const moment = require("moment");

		switch (req.body.action) {
			case "create": // create
				createResource(req.body.resource, req.body.payload);
				break;
			case "update": // update
				updateResource(req.body.resource, req.body.payload);
				break;
			case "read": // read
				getResource(req.body.resource, resourcePayload);
				break;
		}

				const request_format = {
					action: "",
					resource: "",
					payload: {

					},
					callback_url: "",
					user_id: "",
					task_id: ""
				}






			// db.run(
			// 	`INSERT INTO task (date, systemid, uuid, previous_point_marker, current_point_marker, status, attempts) VALUES(?,?,?,?,?,?,?)`,
			// 	[
			// 		moment().format(),
			// 		req.params.systemid,
			// 		req.params.systemid + "." + req.body.after,
			// 		req.body.before,
			// 		req.body.after,
			// 		"pending",
			// 		0,
			// 	],
			// 	function (err) {
			// 		if (err) {
			// 			res.status(400).json({
			// 				error: true,
			// 				message: err.message,
			// 			});
			// 			return;
			// 		}
			// 		res.status(200).json({
			// 			error: false,
			// 			data: this.lastID,
			// 		});
			// 		return;
			// 	}
			// );
			// db.close();


		} catch (err) {
			console.error(`Error while sending message `, err.message);
			next(err);
		}
	});

function getResource (resourceName, resourcePayload) {
	
	// map key values with table columns
	let resourceKeyValuePairs = ""; let resourceId = ""; resourceFilter = "";
	Object.keys(resourcePayload).forEach(([key, value]) => {
		if (key === "id") {
			resourceId = value;
		} else {
			if (resourceKeyValuePairs === "") {
				resourceKeyValuePairs = `${key} = '${value}'`;
			} else {
				resourceKeyValuePairs += `, ${key} = '${value}'`;
			}
		}
	});

	const db = require("../../services/db").dbConnection();
	db.all(
		`SELECT * FROM ${resourceName} WHERE deleted = 0 ${resourceFilter} ORDER BY id`,
		[],
		function (err, rows) {
			if (err) {
				db.close();
				callback(null, []);
			} else {
				if (rows.length > 0) {
					const filtered = rows.filter((task) => {
						return task.date.split("-")[0] == selectedYear;
					});
					callback(null, filtered);
				} else {
					callback(null, []);
				}
			}
		}
	);
}

function updateResource (resourceName, resourcePayload) {
	try {
		// map key values with table columns
		let resourceKeyValuePairs = ""; let resourceId = "";
		Object.keys(resourcePayload).forEach(([key, value]) => {
			if (key === "id") {
				resourceId = value;
			} else {
				if (resourceKeyValuePairs === "") {
					resourceKeyValuePairs = `${key} = '${value}'`;
				} else {
					resourceKeyValuePairs += `, ${key} = '${value}'`;
				}
			}
		});

		const db = require("../../services/db").dbConnection();
		const moment = require("moment");
		db.run(
			`UPDATE ${resourceName} SET ${resourceKeyValuePairs}, date_updated = '${moment().format()}' WHERE id = '${resourceId}'`,
			[],
			function (err) {
				if (err) { // TODO : confirm if this is correct
					return {
						error: true,
						message: err.message,
					};
				}
				return {
					error: false,
					data: this.lastID,
				};
			}
		);
		db.close();
	} catch (error) {
		res.status(400).json({
			error: true,
			message: err.message,
		});
		return;
	}
}

function createResource(resourceName, resourcePayload, callback) {
	try {
		// map key values with table columns
		let resourceKeys = ""; let resourceKeyPlaceHolders = ""; let resourceValues = [];
		Object.keys(resourcePayload).forEach(([key, value]) => {
			if (resourceKeys === "") {
				resourceKeys = key;
				resourceKeyPlaceHolders = "?";
			} else {
				resourceKeys += ", " + key;
				resourceKeyPlaceHolders += ", ?";
			}
			resourceValues.push(value);
		});

		// insert timestamp
		resourceKeys += ", date_created";
		resourceKeyPlaceHolders += ", ?";
		resourceValues.push(moment().format());

		const db = require("../../services/db").dbConnection();
		const moment = require("moment");
		db.run(
			`INSERT INTO ${resourceName} (${resourceKeys}) VALUES (${resourceKeyPlaceHolders})`, resourceValues,
			function (err) {
				if (err) {
					return {
						error: false,
						data: this.lastID,
					};
				}
				res.status(200).json({
					error: false,
					data: this.lastID,
				});
				return;
			}
		);
		db.close();
	} catch (error) {
		res.status(400).json({
			error: true,
			message: err.message,
		});
		return;
	}
}

function deleteResource(selectedYear, callback) { // TODO : explore options to flag rows as deleted
	const db = require("../../services/db").dbConnection();
	db.all(
		`SELECT date, systemid, uuid, previous_point_marker, current_point_marker, status FROM task ORDER BY id`,
		[],
		function (err, rows) {
			if (err) {
				db.close();
				callback(null, []);
			} else {
				if (rows.length > 0) {
					const filtered = rows.filter((task) => {
						return task.date.split("-")[0] == selectedYear;
					});
					callback(null, filtered);
				} else {
					callback(null, []);
				}
			}
		}
	);
}

module.exports = router;
