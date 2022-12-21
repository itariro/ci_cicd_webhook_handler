const db = require("./db");
const { Op } = require("sequelize");
const { scrapOnBeforward } = require("./search_app");
const { sendWhatsAppMessage } = require("../utils/message_helper");
const { interactiveList } = require("../utils/message_formats");

async function processPendingBroadcastTasks() {
	try {
		let tableModel = global.CURRENT_MODELS.find(
			(tableProperties) => tableProperties.table_name === "result_cast"
		);
		if (tableModel != null) {
			const pendingTasks = await tableModel.model_name.findAll({
				where: {
					[Op.and]: [{ attempts: [0, 1, 2] }, { status: 0 }],
				},
			});
			// process the outstanding TASKS HERE
			console.log("pendingTasks -> ", pendingTasks);
		} else {
			console.log("resource does not exist");
		}
	} catch (error) {
		console.log(error);
	}

	// let sql = `SELECT uuid, user, payload FROM task_result_cast WHERE status = 'pending' AND attempts < 3 ORDER BY id`;
	// let db = dbConnection();
	// db.all(sql, [], (err, rows) => {
	// 	if (err) {
	// 		throw err.message;
	// 		return false;
	// 	}

	// 	if (rows.length > 0) {
	// 		rows.forEach(async (task) => {
	// 			console.log("task => ", task);
	// 			sendInteractiveMessage(task.uuid, task.user, JSON.parse(task.payload));
	// 		});
	// 		return true;
	// 	}
	// });

	// console.log("done -> test()");
	// db.close();
	// setTimeout(processPendingTasks, 300000); // 10 second intervals
}

async function processPendingTasks() {
	try {
		const pendingTasks = await getAllPendingTasks();
		if (!pendingTasks.error) {
			global.PENDING_TASKS_CRON_JOB.stop();
			// instead of awaiting this call, create an array of Promises
			const promises = pendingTasks.data.map(async (task) => {
				return await scrapOnBeforward(task).then(async function (response) {
					// console.log(`${task.uuid} -> `, response);
					await updateTaskLog(response);
					return response;
				});
			});
			// use await on Promise.all so the Promises execute in parallel
			const searchTasks = await Promise.all(promises);
			if (searchTasks.length > 0) {
				console.log(searchTasks);
			}
		}
	} catch (error) {
		console.log(error);
	} finally {
		global.PENDING_TASKS_CRON_JOB.start();
	}
}

async function getAllPendingTasks() {
	try {
		let tableModel = global.CURRENT_MODELS.find(
			(tableProperties) => tableProperties.table_name === "task"
		);
		if (tableModel != null) {
			const pendingTasks = await tableModel.model_name.findAll({
				logging: false,
				where: {
					[Op.and]: [{ attempts: [0, 1, 2] }, { status: 0 }],
				},
			});
			// process the outstanding TASKS HERE
			return {
				error: false,
				data: pendingTasks,
			};
		} else {
			console.log("resource does not exist");
			return {
				error: true,
				message: "resource does not exist",
			};
		}
	} catch (error) {
		console.log(error);
		return {
			error: true,
			message: error,
		};
	}
}

async function getAllTasks() {
	try {
		let tableModel = global.CURRENT_MODELS.find(
			(tableProperties) => tableProperties.table_name === "task"
		);
		if (tableModel != null) {
			const pendingTasks = await tableModel.model_name.findAll();
			// process the outstanding TASKS HERE
			return {
				error: false,
				data: pendingTasks,
			};
		} else {
			console.log("resource does not exist");
			return {
				error: true,
				message: "resource does not exist",
			};
		}
	} catch (error) {
		console.log(error);
		return {
			error: true,
			message: error,
		};
	}
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

async function updateTaskLog(actionLog) {
	/* update single log entry */
	// tableAction({action:"update", resource:"", payload:})
	try {
		let tableModel = global.CURRENT_MODELS.find((tableProperties) => tableProperties.table_name === "task");
		if (tableModel != null) {
			const updatedRecord = await tableModel.model_name.update({
				result: actionLog.result,
				status: actionLog.status,
				attempts: actionLog.attempts
			}, {
				where: {
					uuid: actionLog.uuid
				}
			});
			if (updatedRecord) {
				// await tableModel.model_name.increment({ attempts: 1 }, { where: { uuid: actionLog.uuid } }); // TODO: this is a point of failure, set this under one action
				return {
					error: false,
					data: updatedRecord
				};
			} else {
				return {
					error: true,
					message: "resource does not exist"
				};
			}
		} else {
			return {
				error: true,
				message: "resource does not exist"
			};
		}
	} catch (error) {
		return {
			error: true,
			message: error.message
		};
	}
}

async function sendInteractiveMessage(uuid, userNumber, messageToSend) {
	let productsList = interactiveList;
	productsList.to = userNumber;
	productsList.interactive.action.sections[0].product_items = messageToSend;
	if (messageToSend.length > 5) {
		productsList.interactive.action.sections[0].product_items.length = 5; // max is 10
	}

	await sendWhatsAppMessage(productsList)
		.then(function (response) {
			console.log(response);
			updateBroadcastLog({
				status: 1,
				uuid: task.uuid
			});
		})
		.catch(function (error) {
			console.log(error);
			updateBroadcastLog({
				status: "pending",
				uuid: task.uuid
			});
		});
}

async function sendPlainTextMessage(userNumber, messageToSend) {
	let plainTextMessage = plainText;
	plainTextMessage.to = userNumber;
	plainTextMessage.text.body = messageToSend;
	await sendWhatsAppMessage(plainTextMessage)
		.then(function (response) {
			console.log(response);
		})
		.catch(function (error) {
			console.log(error);
		});
}

module.exports = {
	processPendingBroadcastTasks,
	processPendingTasks,
	createIncidentLog,
	getAllTasks
};
