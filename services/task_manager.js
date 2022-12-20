const {currentModels} = require('./db');
const { Op } = require("sequelize");

async function processPendingBroadcastTasks() {
	let sql = `SELECT uuid, user, payload FROM task_result_cast WHERE status = 'pending' AND attempts < 3 ORDER BY id`;
	let db = dbConnection();
	db.all(sql, [], (err, rows) => {
		if (err) {
			throw err.message;
			return false;
		}

		if (rows.length > 0) {
			rows.forEach(async (task) => {
				console.log("task => ", task);
				sendInteractiveMessage(task.uuid, task.user, JSON.parse(task.payload));
			});
			return true;
		}
	});

	console.log("done -> test()");
	db.close();
	setTimeout(processPendingTasks, 300000); // 10 second intervals
}

async function processPendingTasks() {
	

	try {
		let tableModel = currentModels.find((tableProperties) => tableProperties.table_name === "task");
		if (tableModel != null) {
			const pendingTasks = tableModel.findAll({
				where: {
				  [Op.and]: [
					{ attempts: [0,1,2]},
					{ status: 0 }
				  ]
				}
			  });
			
			
			
			
			const newRecord = await tableModel.model_name.create(resourceChildren);
			console.log("new record auto-generated ID:", newRecord.id);
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


	
	
	
	
	
	
	
	let sql = `SELECT date, systemid, uuid, query, user, status FROM task WHERE status = 'pending' AND attempts < 3 ORDER BY id`;
	let db = dbConnection();
	db.all(sql, [], (err, rows) => {
		if (err) {
			throw err.message;
			return false;
		}

		if (rows.length > 0) {
			rows.forEach(async (task) => {
				console.log("task => ", task);
				await scrapOnBeforward(task);
				// errors - gonna have to try again
				//   updateTaskLog({ status: "pending", uuid: task.uuid });
				//      errors - not gonna to try again
				//   updateTaskLog({ status: "cancelled", uuid: task.uuid });
				// }
			});
			return true;
		}
	});

	console.log("done -> test()");
	db.close();
	setTimeout(processPendingTasks, 5000); // 10 second intervals
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

const searchInArray = (haystack, criteria, needle) => {
	return haystack.filter((hay) => {
		return criteria.some(
			(newItem) =>
				hay[newItem].toString().toLowerCase().indexOf(needle.toLowerCase()) > -1
		);
	});
};

async function 

module.exports = {
	processPendingBroadcastTasks,
	processPendingTasks,
	createIncidentLog
};