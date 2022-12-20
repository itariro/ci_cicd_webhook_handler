const { Sequelize, DataTypes } = require("sequelize");
const sqlite3 = require("sqlite3").verbose();
const moment = require("moment");
const { processPendingTasks } = require("./task_manager");
let sequelizeInstance = dbConnectionSequelize();
let currentModels = [];

async function createDatabase() {
	try {
		/* create database + tables */
		const resourceSchema = global.API_CONFIGS[0].resourceSchema;
		resourceSchema.map((resource) => {
			console.log("creating -> ", resource.table);
			const schemaColumns = resource.schema.split(",");
			var fields = new Object();
			schemaColumns.forEach((element) => {
				fields[fieldName(element)] = fieldEntry(element);
			});
			// register model
			currentModels.push({
				table_name: resource.table,
				model_name: registerModel(resource.table, resource.table, fields),
			});
		});
		// db.close();
		await sequelizeInstance.sync({ force: true });
		/* start cron job for all tasks in task queue */
		var CronJob = require("cron").CronJob;
		var job = new CronJob(
			"* * * * * *",
			function () {
				console.log("You will see this message every 10 seconds");
				console.log("pending tasks -> ", processPendingTasks());
			},
			null,
			false,
			"America/Los_Angeles"
		);
		// Use this if the 4th param is default value(false)
		console.log("All models were synchronized successfully.");
		console.log("models -> ", currentModels);
		job.start()
	} catch (error) {
		console.log(error);
	}
}

function fieldName(item) {
	const spacerPosition = item.trim().indexOf(" ");
	return item.substr(0, spacerPosition + 1).trim();
}

function fieldEntry(item) {
	const spacerPosition = item.trim().indexOf(" ");
	let columnName = item.substr(0, spacerPosition + 1).trim();
	let columnType = item.substr(spacerPosition + 1).trim();

	if (columnName == "id") {
		return {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		};
	} else {
		return setDataType(columnType);
	}
}

function registerModel(tableName, modelName, fields) {
	const model = sequelizeInstance.define(
		modelName,
		{
			...fields,
		},
		{
			tableName: tableName,
		}
	);
	return model;
}

function setDataType(colType) {
	if (colType === "DEFAULT 0") {
		return {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		};
	}
	if (colType === "TEXT") {
		return {
			type: DataTypes.STRING,
			defaultValue: "",
		};
	}
	if (colType === "DEFAULT 0.00") {
		return {
			type: DataTypes.DECIMAL,
			defaultValue: 0.0,
		};
	}
	if (colType === "DATE") {
		return {
			type: DataTypes.DATE,
		};
	}
}

async function dbTest() {
	sequelizeInstance
		.authenticate()
		.then(() => {
			console.log("Connection has been established successfully.");
		})
		.catch((error) => {
			console.error("Unable to connect to the database: ", error);
		});
}

async function purgeSingleTable(tableName, tableAction) {
	/* purge the whole database */
	let db = dbConnection();
	tableAction === "DELETE"
		? db.run(`DELETE FROM ${tableName};`)
		: db.run(`DROP TABLE ${tableName};`);
	db.close();
}

/* ---------- TASK LOGS ---------- */
async function updateTaskLog(actionLog) {
	/* update single log entry */

	let db = dbConnection();
	db.run(
		`UPDATE task SET status = '${actionLog.status}', attempts = attempts + 1 WHERE uuid = '${actionLog.uuid}'`,
		[],
		function (err) {
			if (err) {
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
}

/* ---------- INCIDENT LOGS ---------- */
async function createIncidentLog(incidentLog) {
	/* create new single log entry */
	try {
		let tableModel = currentModels.find(
			(tableProperties) => tableProperties.table_name === "incident"
		);
		if (tableModel != null) {
			const newRecord = await tableModel.create({
				date: moment().format(),
				description: incidentLog.description,
				source: incidentLog.source,
				severity: incidentLog.severity,
			});
			if (newRecord) {
				return {
					error: false,
					data: newRecord,
				};
			} else {
				return {
					error: true,
					message: "resource does not exist",
				};
			}
		} else {
			return {
				error: true,
				message: "resource does not exist",
			};
		}
	} catch (error) {
		return {
			error: true,
			message: error.message,
		};
	}
}

/* ---------- AUXILIARY FUNCTIONS ---------- */
function dbConnection() {
	return new sqlite3.Database(
		"./db/ci_cicd_webhook.db",
		sqlite3.OPEN_READWRITE,
		(err) => {
			if (err) {
				console.error(erro.message);
			}
			console.log("Connected to the logs database.");
		}
	);
}

function dbConnectionSequelize() {
	return new Sequelize(
		"postgres://majestic_admin:8DVa3SBu38PLYosK87D8E@majestic-apps-db.cropenlgdxvr.us-east-1.rds.amazonaws.com:5432/kuchando_auto"
	);
}

const searchInArray = (haystack, criteria, needle) => {
	return haystack.filter((hay) => {
		return criteria.some(
			(newItem) =>
				hay[newItem].toString().toLowerCase().indexOf(needle.toLowerCase()) > -1
		);
	});
};

module.exports = {
	processPendingTasks,
	createIncidentLog,
	createDatabase,
	purgeSingleTable,
	dbConnection,
	dbConnectionSequelize,
	dbTest,
	currentModels,
};
