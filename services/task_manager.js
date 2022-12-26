const db = require("./db");
const { Op } = require("sequelize");
const { scrapOnBeforward } = require("./search_app");
const { sendWhatsAppMessage } = require("../utils/message_helper");
const { interactiveList, plainText } = require("../utils/message_formats");
const { createResourceGeneric } = require("./db_client");

/* ---------- TASK LOGS ---------- */
async function processPendingTasks() {
	try {
		const pendingTasks = await getAllPendingTasks();
		if (!pendingTasks.error) {
			global.PENDING_TASKS_CRON_JOB.stop();
			// instead of awaiting this call, create an array of Promises
			const promises = pendingTasks.data.map(async (task) => {
				// mark record as processing
				lockUnlockTask("task", { uuid: task.uuid, lock: 1 });
				return await scrapOnBeforward(task).then(async function (response) {
					// console.log(`${task.uuid} -> `, response);
					return response;
				});
			});
			// use await on Promise.all so the Promises execute in parallel
			const searchTasks = await Promise.all(promises);
			if (searchTasks.length > 0) {
				console.log(searchTasks);
				searchTasks.map(async (task) => {
					const updatedTask = await updateTaskLog("task", task);
					console.log(`${task.uuid}  -> `, updatedTask);
				});
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
					[Op.and]: [{ attempts: [0, 1, 2] }, { status: 0 }, { in_queue: 0 }],
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

/* ---------- INCIDENT LOG ---------- */
async function createIncidentLog(incidentLog) {
	/* create new single log entry */
	createResourceGeneric(
		"incident",
		{
			description: incidentLog.description,
			source: incidentLog.source,
			severity: incidentLog.severity,
		},
		function (err, result) {
			if (err) {
				return {
					error: true,
					message: err.message,
				};
			}
			return result;
		}
	);
}

async function getAllIncidents() {
	try {
		let tableModel = global.CURRENT_MODELS.find(
			(tableProperties) => tableProperties.table_name === "incident"
		);
		if (tableModel != null) {
			const foundIncidents = await tableModel.model_name.findAll();
			return {
				error: false,
				data: foundIncidents,
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

/* ---------- BROADCAST LOG ---------- */
async function processPendingBroadcastTasks() {
	try {
		const pendingTasks = await getAllPendingBroadcastTasks();
		if (!pendingTasks.error) {
			global.QUEUED_TASKS_CRON_JOB.stop();
			// instead of awaiting this call, create an array of Promises
			const promises = pendingTasks.data.map(async (task) => {
				// mark record as processing
				lockUnlockTask("result_cast", { uuid: task.uuid, lock: 1 });
				return await processWhatsAppMessage(task).then(async function (response) { // Facebook Send Message
					// console.log(`${task.uuid} -> `, response);
					return response;
				});
			});
			// use await on Promise.all so the Promises execute in parallel
			const broadcastTasks = await Promise.all(promises);
			if (broadcastTasks.length > 0) {
				console.log(broadcastTasks);
				broadcastTasks.map(async (task) => {
					const updatedTask = await updateTaskLog("result_cast", task);
					console.log(`${task.uuid}  -> `, updatedTask);
				});
			}
		}
	} catch (error) {
		console.log(error);
	} finally {
		global.QUEUED_TASKS_CRON_JOB.start();
	}
}

async function getAllPendingBroadcastTasks() {
	try {
		let tableModel = global.CURRENT_MODELS.find(
			(tableProperties) => tableProperties.table_name === "result_cast"
		);
		if (tableModel != null) {
			const pendingTasks = await tableModel.model_name.findAll({
				where: {
					[Op.and]: [{ attempts: [0, 1, 2, 3, 4] }, { status: 0 }, { in_queue: 0 }], //TODO: we should fix this, ideally x>=0 AND <=4
				},
			});
			// process the outstanding TASKS HERE
			console.log("pendingTasks -> ", pendingTasks);
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

/* ---------- AUXILARY FUNCTIONS ---------- */
const searchInArray = (haystack, criteria, needle) => {
	return haystack.filter((hay) => {
		return criteria.some(
			(newItem) =>
				hay[newItem].toString().toLowerCase().indexOf(needle.toLowerCase()) > -1
		);
	});
};

async function updateTaskLog(resourceName, actionLog) {
	/* update single log entry */
	try {
		let tableModel = global.CURRENT_MODELS.find((tableProperties) => tableProperties.table_name === resourceName);
		if (tableModel != null) {
			const updatedRecord = await tableModel.model_name.update({
				result: actionLog.result,
				status: actionLog.status,
				attempts: actionLog.attempts,
				in_queue: 0,
			}, {
				where: {
					uuid: actionLog.uuid
				}
			});
			if (updatedRecord) {
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

async function lockUnlockTask(resourceName, actionLog) {
	/* update single log entry */
	try {
		let tableModel = global.CURRENT_MODELS.find((tableProperties) => tableProperties.table_name === resourceName);
		if (tableModel != null) {
			const updatedRecord = await tableModel.model_name.update({
				in_queue: actionLog.lock
			}, {
				where: {
					uuid: actionLog.uuid
				}
			});
			if (updatedRecord) {
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

/* ---------- WHATSAPP MESSAGING FUNCTIONS ---------- */
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
				status: 0,
				uuid: task.uuid
			});
		});
}

async function sendPlainTextMessage(userNumber, messageToSend) {
	return new Promise(async function (resolve, reject) {
		try {
			let plainTextMessage = plainText;
			plainTextMessage.to = userNumber;
			plainTextMessage.text.body = messageToSend;
			await sendWhatsAppMessage(plainTextMessage)
				.then(function (response) {
					console.log(response); // success
					resolve({
						status: 1,
						uuid: task.uuid,
						in_queue: 0,
						attempts: task.attempts + 1,
						result: JSON.stringify({
							error: true,
							message: "part not found/invalid OEM part number",
						})
					});
				})
				.catch(function (error) {
					console.log(error);
					resolve({
						status: 1,
						uuid: task.uuid,
						in_queue: 0,
						attempts: task.attempts + 1,
						result: JSON.stringify({
							error: true,
							message: "part not found/invalid OEM part number",
						})
					});
				});
		} catch (error) {
			resolve({
				status: 1,
				uuid: task.uuid,
				in_queue: 0,
				attempts: task.attempts + 1,
				result: JSON.stringify({
					error: true,
					message: "part not found/invalid OEM part number",
				})
			});
		}
	});
}

async function processWhatsAppMessage(task) {
	return new Promise(async function (resolve, reject) {
		try {
			if (task.payload_type == 0) { // plain text
				let plainTextMessage = plainText;
				plainTextMessage.to = task.user_mobile;
				plainTextMessage.text.body = task.payload;
				await sendWhatsAppMessage(plainTextMessage)
					.then(function (response) {
						console.log(response); // success
						resolve({
							status: 1,
							uuid: task.uuid,
							in_queue: 0,
							attempts: task.attempts + 1,
							result: JSON.stringify({
								error: false,
								message: response,
							})
						});
					})
					.catch(function (error) {
						console.log(error);
						resolve({
							status: 0,
							uuid: task.uuid,
							in_queue: 0,
							attempts: task.attempts + 1,
							result: JSON.stringify({
								error: true,
								message: error,
							})
						});
					});
			}

			if (task.payload_type == 1) { // interactive message
				let productsList = interactiveList;
				productsList.to = task.user_mobile; //
				productsList.interactive.action.sections[0].product_items = task.payload;
				if (task.payload.length > 5) {
					productsList.interactive.action.sections[0].product_items.length = 5; // TODO: SERIOUS BUG : max is 10, but need better logic to handle this
				}

				await sendWhatsAppMessage(productsList)
					.then(function (response) {
						console.log(response);
						resolve({
							status: 1,
							uuid: task.uuid,
							in_queue: 0,
							attempts: task.attempts + 1,
							result: JSON.stringify({
								error: false,
								message: response,
							})
						});
					})
					.catch(function (error) {
						console.log(error);
						resolve({
							status: 0,
							uuid: task.uuid,
							in_queue: 0,
							attempts: task.attempts + 1,
							result: JSON.stringify({
								error: true,
								message: error,
							})
						});
					});
			}
		} catch (error) {
			resolve({
				status: 2,
				uuid: task.uuid,
				in_queue: 0,
				attempts: task.attempts + 1,
				result: JSON.stringify({
					error: true,
					message: error,
				})
			});
		}
	});


}

module.exports = {
	processPendingBroadcastTasks,
	processPendingTasks,
	createIncidentLog,
	getAllTasks,
	getAllIncidents,
	lockUnlockTask
};
