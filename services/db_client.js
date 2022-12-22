const { dbConnectionSequelize } = require("./db");
let sequelizeInstance = dbConnectionSequelize;
const { QueryTypes } = require("sequelize");

/* ENTRY POINT */
function tableActionGeneric(actionPackage) {
	switch (actionPackage.action) {
		case "create": // create
			createResource(
				actionPackage.resource,
				actionPackage.payload,
				function (err, result) {
					if (err) {
						return { error: true, message: err.message };
					} else {
						return result;
					}
				}
			);
			break;
		case "update": // update
			updateResource(
				actionPackage.resource,
				actionPackage.payload,
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
				actionPackage.resource,
				actionPackage.filter,
				actionPackage.children,
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
				actionPackage.resource,
				actionPackage.payload,
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
}

async function updateResource(resourceName, resourcePayload, callback) {
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

		const moment = require("moment");
		const [metadata] = await sequelizeInstance.query(
			`UPDATE ${resourceName} SET ${resourceKeyValuePairs}, date_updated = '${moment().format()}' WHERE id = '${resourceId}'`
		);
		if (metadata > 0) {
			// updated
			callback(null, {
				error: false,
				message: "record was updated", // TODO : add method to pull and display updated record
			});
		} else {
			// maybe not, let's explore this
			callback(null, {
				error: true,
				message: "record was not updated due to an unspecified error",
			});
		}
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

async function createResource(resourceName, resourcePayload, callback) {
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
		console.log(
			`INSERT INTO ${resourceName} (${resourceKeys}) VALUES (${resourceKeyPlaceHolders})`
		);
		await sequelizeInstance
			.query(
				`INSERT INTO ${resourceName} (${resourceKeys}) VALUES (${resourceKeyPlaceHolders})`,
				{
					type: QueryTypes.INSERT,
				}
			)
			.then((res) => {
				console.log(res);
				callback(null, {
					error: false,
					data: res,
				});
			})
			.catch((error) => {
				console.error("Failed to create a new record : ", error);
				callback(null, {
					error: true,
					data: error,
				});
			});
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

		const moment = require("moment");
		const [metadata] = await sequelizeInstance.query(
			`UPDATE ${resourceName} SET deleted = '1', date_updated = '${moment().format()}' WHERE id = '${resourceId}'`
		);
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
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

async function readResource(
	resourceName,
	resourceFilter,
	resourceChildren,
	callback
) {
	try {
		// get table column display options
		const resourceSchema = global.API_CONFIGS[0].resourceSchema;
		if (resourceSchema.some((item) => item.table === resourceName)) {
			// map key values with table columns
			let resourceFilterKeyValues = "";
			Object.keys(resourceFilter).forEach((key) => {
				resourceFilterKeyValues += ` AND ${key} = '${resourceFilterKeyValues[key]}'`;
			});

			const [results, metadata] = await sequelizeInstance.query(
				`SELECT * FROM ${resourceName} WHERE deleted = 0 ${resourceFilterKeyValues} ORDER BY id`
			);
			if (results) {
				// map key values with table columns
				// TODO : fix resourceChildren &
				let resourceFilter = "";
				let childrenResources = [];
				Object.keys(resourceChildren).forEach(async (key) => {
					if (resourceSchema.some((item) => item.table === resourceName)) {
						const [results, metadata] = await sequelizeInstance.query(
							`SELECT * FROM ${resourceChildren[key]} WHERE deleted = 0 ${resourceFilter} ORDER BY id`
						);
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

async function createResourceGeneric(resourceName, resourceChildren, callback) {
	try {
		let tableModel = global.CURRENT_MODELS.find((tableProperties) => tableProperties.table_name === resourceName);
		if (tableModel != null) {
			const newRecord = await tableModel.model_name.create(resourceChildren);
			console.log(" [*] new record auto-generated ID:", newRecord.id);
			callback(null, {
				error: false,
				data: newRecord,
			});
		} else {
			callback(null, {
				error: true,
				message: "resource does not exist",
			});
		}
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

async function readSingleResourceGeneric(resourceName, resourceFilter, callback) {
	try {
		let tableModel = global.CURRENT_MODELS.find((tableProperties) => tableProperties.table_name === resourceName);
		if (tableModel != null) {
			const singleRecord = await tableModel.model_name.findOne({ where: resourceFilter });
			if (singleRecord === null) {
				console.log(' [*] Not found!');
				callback(null, {
					error: true,
					message: "record not found",
				});
			} else {
				console.log(singleRecord instanceof tableModel); // true
				console.log(" [*] found -> ", singleRecord);
				callback(null, {
					error: false,
					data: singleRecord,
				});
			}
		} else {
			callback(null, {
				error: true,
				message: "resource does not exist",
			});
		}
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

async function readMultipleAllResourceGeneric(resourceName, callback) {
	try {
		let tableModel = global.CURRENT_MODELS.find((tableProperties) => tableProperties.table_name === resourceName);
		if (tableModel != null) {
			const multipleRecords = await tableModel.model_name.findAll();
			if (multipleRecords === null) {
				console.log('Not found!');
				callback(null, {
					error: true,
					message: "records not found",
				});
			} else {
				console.log("found -> ", multipleRecords); // 'My Title'
				callback(null, {
					error: false,
					data: multipleRecords,
				});
			}
		} else {
			callback(null, {
				error: true,
				message: "resource does not exist",
			});
		}
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

async function readMultipleResourceGeneric(resourceName, resourceFilter, callback) {
	try {
		let tableModel = global.CURRENT_MODELS.find((tableProperties) => tableProperties.table_name === resourceName);
		if (tableModel != null) {
			const multipleRecords = await tableModel.model_name.findAll({ where: resourceFilter });
			if (multipleRecords === null) {
				console.log('Not found!');
				callback(null, {
					error: true,
					message: "records not found",
				});
			} else {
				console.log(multipleRecords instanceof tableModel); // true
				console.log("found -> ", multipleRecords); // 'My Title'
				callback(null, {
					error: false,
					data: multipleRecords,
				});
			}
		} else {
			callback(null, {
				error: true,
				message: "resource does not exist",
			});
		}
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

module.exports = {
	tableActionGeneric,
	createResourceGeneric,
	readMultipleAllResourceGeneric,
	readMultipleResourceGeneric
};
