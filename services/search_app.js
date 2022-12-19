const sqlite3 = require("sqlite3").verbose();
const moment = require("moment");
const config = require("../utils/config");

const {
	interactiveList,
	resultListForWooCommerce,
	plainText,
} = require("../utils/message_formats");
const {
	createProductsList,
	createProductsForWooCommerceList,
	sendWhatsAppMessage,
} = require("../utils/message_helper");
const { tableAction } = require("./db_client");

/* ---------- TASK LOGS ---------- */
async function updateTaskLog(actionLog) {
	/* update single log entry */
	// tableAction({action:"update", resource:"", payload:})
	try {
		let tableModel = currentModels.find((tableProperties) => tableProperties.table_name === "task");
		if (tableModel != null) {
			const updatedRecord = await tableModel.update({
				result: JSON.stringify(
					actionLog.result
				), status: actionLog.status
			}, {
				where: {
					uuid: actionLog.uuid
				}
			});
			if (updatedRecord) {
				await tableModel.increment({attempts: 1}, { where: { uuid: actionLog.uuid } });
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
			message: err.message
		};
	}
}

async function createBroadcastLog(broadcastPackage) {
	/* create new single log entry */

	let db = dbConnection();
	db.run(
		`INSERT INTO task_result_cast (date, payload, user, uuid, status, attempts) VALUES(?,?,?,?,?,?)`,
		[
			moment().format(),
			JSON.stringify(broadcastPackage.payload),
			broadcastPackage.user,
			broadcastPackage.uuid,
			"pending",
			0,
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
async function updateBroadcastLog(actionLog) {
	/* update single log entry */

	let db = dbConnection();
	db.run(
		`UPDATE task_result_cast SET status = '${actionLog.status}', attempts = attempts + 1 WHERE uuid = '${actionLog.uuid}'`,
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

async function scrapOnBeforward(task) {
	let partNumber = task.query.replace(/\s/g, "");
	if (partNumber.length > 3) {
		try {
			const tabletojson = require("tabletojson").Tabletojson;
			tabletojson
				.convertUrl(
					`https://autoparts.beforward.jp/search?search=${partNumber.toUpperCase()}`
				)
				.then(async (tablesAsJson) => {
					if (tablesAsJson[0] == undefined) {
						console.log("there were no results...");
						updateTaskLog({
							status: "completed",
							uuid: task.uuid,
							result: {
								error: true,
								message: "part not found/invalid OEM part number",
							},
						});
						await sendPlainTextMessage(
							task.user,
							"part not found/invalid OEM part number"
						);
					} else {
						let results = tablesAsJson[0];
						console.log("there were results...");
						results.forEach((element) => {
							Object.keys(element).forEach((key) => {
								if (
									key === "9" ||
									key === "10" ||
									key === "11" ||
									key === "Local Place"
								) {
									delete element[key];
								}
								if (key === "Price" || key === "Ref NoGenuine No") {
									let priceComponent = JSON.stringify(element[key]);
									const displayPrice =
										priceComponent.search(/n/) > 0
											? priceComponent.substring(
												1,
												priceComponent.search(/n/) - 1
											)
											: priceComponent;
									// console.log(displayPrice);
									delete element[key]; // drop this key
									element[key] = displayPrice; // replace with this one
								}
							});
						});

						Object.keys(results).forEach((key) => {
							const row = results[key];
							Object.keys(row).forEach((row_key) => {
								var replacedKey = row_key
									.trim()
									.replace(/\s/g, "_")
									.toLowerCase();
								if (row_key !== replacedKey) {
									// id
									if (replacedKey == "ref_nogenuine_no") {
										let newSKU =
											task.user + "-" + row[row_key].replace("-", "");
										newSKU = newSKU.replace('"', "");
										row["sku"] = newSKU;
									}

									// price
									if (replacedKey == "price") {
										row["clean_price"] = parseFloat(
											row[row_key].replace("$", "")
										);
									}

									// name
									if (replacedKey == "name") {
										row["condition"] = "Used";
										row["thumbnail"] = "Used";
									}
									row[replacedKey] =
										replacedKey == "name"
											? row[row_key].replace("Used", "")
											: row[row_key];

									delete row[row_key];
								}
							});
						});

						// console.log('results -> ', results);

						try {
							// compile products to add to WooCommerce
							const objForWooCommerce = results.map(
								createProductsForWooCommerceList
							);
							let productsForAdditionToWooCommerce = resultListForWooCommerce;
							productsForAdditionToWooCommerce.create = objForWooCommerce;

							// console.log('objForWooCommerce -> ', objForWooCommerce);

							// add products to WooCommerce
							await addProductToWooCommerce(
								productsForAdditionToWooCommerce,
								task
							);
							updateTaskLog({
								status: "completed",
								uuid: task.uuid,
								result: { error: false, message: "products sent to user" },
							});
						} catch (error) {
							updateTaskLog({
								status: "completed",
								uuid: task.uuid,
								result: { error: true, message: error.message },
							});
							console.log(error.message);
							await sendPlainTextMessage(
								task.user,
								"internal error, please again"
							);
						}
					}
				})
				.catch(async (error) => {
					// interpret error and maybe display something on the UI
					console.log(error);
					updateTaskLog({
						status: "completed",
						uuid: task.uuid,
						result: { error: true, message: "Invalid OEM part number" },
					});
					await sendPlainTextMessage(
						task.user,
						"part not found/invalid OEM part number"
					);
				});
		} catch (error) {
			updateTaskLog({
				status: "completed",
				uuid: task.uuid,
				result: { error: true, message: error.message },
			});
		}
	} else {
		updateTaskLog({
			status: "completed",
			uuid: task.uuid,
			result: { error: true, message: "invalid OEM part number" },
		});
		await sendPlainTextMessage(
			task.user,
			"part not found/invalid OEM part number"
		);
	}
}

async function addProductToWooCommerce(objProduct, task) {
	const WooCommerceRestApi =
		require("@woocommerce/woocommerce-rest-api").default;
	const api = new WooCommerceRestApi({
		url: "https://parts.kuchando.co.uk",
		consumerKey: "ck_4806622cacd9a49e32ed6f29787c7e6f0836b3bb",
		consumerSecret: "cs_cacb5dd089b7c84981162190b55615f6cd20f543",
		version: "wc/v3",
	});

	// Create a product see more in https://woocommerce.github.io/woocommerce-rest-api-docs/#product-properties
	api
		.post("products/batch", objProduct)
		.then(async (response) => {
			// Successful request
			console.log("Response Status:", response.status);
			//console.log("Response Headers:", response.headers);
			//console.log("Response Data:", response.data);

			if (response.data.create) {
				try {
					let modifiedArr = [];
					response.data.create.map(function (product) {
						if (product.id > 0) {
							modifiedArr.push(createProductsList(product));
						}
					});

					// save results to broadcast scheduler
					createBroadcastLog({
						user: task.user,
						payload: modifiedArr,
						uuid: task.uuid,
					});
					await sendPlainTextMessage(
						task.user,
						"We found this item in our partner/supplier stock. We are now negotiating for the best price, give us 5 minutes to get back to you. Meanwhile, Is there anything else we can help with? "
					);
				} catch (error) {
					console.log(error);
				}
			}
		})
		.catch(async (error) => {
			// Invalid request, for 4xx and 5xx statuses
			console.log("Response Status:", error.response.status);
			console.log("Response Headers:", error.response.headers);
			console.log("Response Data:", error.response.data);
			await sendPlainTextMessage(
				task.user,
				"internal error, please try again later"
			);
			return error.response;
		})
		.finally(() => {
			// Always executed.
		});
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
				status: "completed",
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
	scrapOnBeforward,
};
