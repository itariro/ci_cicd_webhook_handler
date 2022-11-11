const sqlite3 = require("sqlite3").verbose();
const moment = require("moment");
var shell = require("shelljs");

async function createDatabase() {
	/* create database + tables */

	let db = dbConnection();
	db.run("CREATE TABLE IF NOT EXISTS task (id INTEGER PRIMARY KEY, date TEXT, systemid TEXT, uuid TEXT, previous_point_marker TEXT, current_point_marker TEXT, status TEXT, attempts INTEGER);");
	db.run("CREATE TABLE IF NOT EXISTS incident (id INTEGER PRIMARY KEY, date TEXT, description TEXT, source TEXT, severity TEXT);");

	/* users */
	db.run("CREATE TABLE IF NOT EXISTS user_mobile (id INTEGER PRIMARY KEY, name TEXT, group TEXT, status TEXT, balance TEXT, auth_token TEXT, auth_token_expiry TEXT, date_created TEXT, date_updated TEXT);");
	db.run("CREATE TABLE IF NOT EXISTS user_admin (id INTEGER PRIMARY KEY, name TEXT, email_address TEXT, user_type TEXT, password TEXT, status TEXT, auth_token TEXT, auth_token_expiry TEXT, date_created TEXT, date_updated TEXT);");
	db.run("CREATE TABLE IF NOT EXISTS user_partner (id INTEGER PRIMARY KEY, name TEXT, email_address TEXT, partner_type TEXT, password TEXT, status TEXT, auth_token TEXT, auth_token_expiry TEXT, date_created TEXT, date_updated TEXT);");

	/* fields */
	db.run("CREATE TABLE IF NOT EXISTS field (id INTEGER PRIMARY KEY, farmer_id TEXT, name TEXT, size TEXT, polygon TEXT, centre TEXT, date_created TEXT, date_updated TEXT);");
	
	/* field_insights */
	db.run("CREATE TABLE IF NOT EXISTS field_insights (id INTEGER PRIMARY KEY, field_id TEXT, summary TEXT, insight_request_date TEXT, insight_request_payload TEXT, insight_source TEXT, insight_response TEXT, date_created TEXT, date_updated TEXT);");

	/* transactions */
	db.run("CREATE TABLE IF NOT EXISTS transactions_mobile (id INTEGER PRIMARY KEY, mobile_user_id INTEGER, description TEXT, date TEXT, direction TEXT, amount TEXT, new_balance TEXT, date_created TEXT, date_updated TEXT);");
	db.run("CREATE TABLE IF NOT EXISTS transactions_partner (id INTEGER PRIMARY KEY, partner_id INTEGER, description TEXT, date TEXT, direction TEXT, amount TEXT, new_balance TEXT, date_created TEXT, date_updated TEXT);");

	/* subscriptions */
	db.run("CREATE TABLE IF NOT EXISTS subscription (id INTEGER PRIMARY KEY, title TEXT, description TEXT, premium_amount TEXT, frequency TEXT, new_balance TEXT, date_created TEXT, date_updated TEXT);");
	db.run("CREATE TABLE IF NOT EXISTS subscriber (id INTEGER PRIMARY KEY, user_type TEXT, user_id INTEGER, subscription_id INTEGER, status TEXT, date_created TEXT, date_updated TEXT);");

	/* auxilliary */
	db.run("CREATE TABLE IF NOT EXISTS user_type (id INTEGER PRIMARY KEY, type TEXT, description TEXT, date_created TEXT, date_updated TEXT);");
	db.run("CREATE TABLE IF NOT EXISTS status (id INTEGER PRIMARY KEY, type TEXT, description TEXT, date_created TEXT, date_updated TEXT);");
	db.run("CREATE TABLE IF NOT EXISTS partner_type (id INTEGER PRIMARY KEY, type TEXT, description TEXT, date_created TEXT, date_updated TEXT);");
	
	db.close();
}

async function deleteDatabase() {
	/* purge the whole database */
	let db = dbConnection();
	db.run("DROP TABLE task;");
	db.run("DROP TABLE incident;");
	db.run("DROP TABLE user_mobile;");
	db.run("DROP TABLE user_admin;");
	db.run("DROP TABLE user_partner;");
	db.run("DROP TABLE field;");
	db.run("DROP TABLE field_insights;");
	db.run("DROP TABLE transactions_mobile;");
	db.run("DROP TABLE transactions_partner;");
	db.run("DROP TABLE subscription;");
	db.run("DROP TABLE subscriber;");
	db.run("DROP TABLE user_type;");
	db.run("DROP TABLE status;");
	db.run("DROP TABLE partner_type;");
	db.close();
}

/* ---------- TASK LOGS ---------- */
async function updateTaskLog (actionLog) {
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

/* ---------- AUXILARY FUNCTIONS ---------- */
function dbConnection() {
	return new sqlite3.Database(
		"./db/ci_cicd_webhook.db",
		sqlite3.OPEN_READWRITE,
		(err) => {
			if (err) {
				console.error(err.message);
			}
			console.log("Connected to the logs database.");
		}
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
	deleteDatabase,
	dbConnection,
};
