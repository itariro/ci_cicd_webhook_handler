const { Sequelize } = require('sequelize');
const sqlite3 = require("sqlite3").verbose();
const moment = require("moment");
var shell = require("shelljs");

async function createDatabase() {
	/* create database + tables */
	let db = dbConnection();
	const resourceSchema = global.API_CONFIGS[0].resourceSchema;
	resourceSchema.map((resource) => {
		console.log('creating -> ', resource.table);
		db.run(resource.schema);
	});
	db.close();
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

async function processPendingTasks() {
	let sql = `SELECT date, systemid, uuid, previous_point_marker, current_point_marker, status FROM task WHERE status = 'pending' AND attempts < 3 ORDER BY id`;
	let db = dbConnection();
	db.all(sql, [], (err, rows) => {
		if (err) {
			throw err.message;
			return false;
		}

		if (rows.length > 0) {
			const system_register = require("../store/system_register");
			rows.forEach((task) => {
				console.log("task => ", task);
				const system_detail = searchInArray(
					system_register,
					["id"],
					task.systemid
				);

				console.log("system => ", system_detail[0].name);

				if (
					shell.exec(
						`cd ${system_detail[0].path} && ${system_detail[0].deploy.pull}`
					).code == 0
				) {
					// no errors - let's update the table
					updateTaskLog({ status: "completed", uuid: task.uuid });
				} else {
					// errors - gonna have to try again
					updateTaskLog({ status: "pending", uuid: task.uuid });
				}
			});

			return true;
		}
	});

	console.log("done -> test()");
	db.close();
	setTimeout(processPendingTasks, 5000);
}

/* ---------- INCIDENT LOGS ---------- */
async function createIncidentLog(incidentLog) {
	/* create new single log entry */

	let db = dbConnection();
	db.run(
		`INSERT INTO incident (date, description, source, severity) VALUES(?,?,?,?)`,
		[
			moment().format(),
			incidentLog.description,
			incidentLog.source,
			incidentLog.severity,
		],
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

function dbConnectionS() {
	return new Sequelize({
		dialect: 'sqlite',
		storage: "./db/ci_cicd_webhook.db"
	});
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
};
