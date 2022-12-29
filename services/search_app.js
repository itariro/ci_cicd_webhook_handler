const moment = require("moment");
var axios = require("axios");
const { v4: uuidv4 } = require('uuid');
const {
	resultListForWooCommerce,
	facebookBatchAPIObj,
} = require("../utils/message_formats");
const {
	createProductsList,
	createProductsForWooCommerceList,
	createProductsListForCatalogue,
	createProductsForFacebookCommerceList,
	createProductsForCatalogueList,
} = require("../utils/message_helper");
const { createResourceBulkGeneric } = require("./db_client");

async function scrapOnBeforward(task) {
	let partNumber = task.query.replace(/\s/g, "");
	const attempts = task.attempts + 1;
	return new Promise(async function (resolve, reject) {
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
							let taskLog = (task.log === "") ? [] : JSON.parse(task.log);
							resolve({
								status: 1,
								uuid: task.uuid,
								user_mobile: task.user_mobile,
								in_queue: 0,
								attempts: task.attempts + 1,
								result: JSON.stringify({
									error: true,
									message: "part not found/invalid OEM part number",
								}),
								log: JSON.stringify(taskLog.push({
									date: moment().format(), attempt: task.attempts + 1, result: {
										error: true,
										message: "part not found/invalid OEM part number",
									}
								}))
							});
						} else {
							let results = tablesAsJson[0];
							console.log(" [*] there were results...");
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
											row["custom_label_0"] = task.user_mobile + "-" + row[row_key].replace(/\W/g, "");
											row["retailer_product_group_id"] = `${task.user_mobile}-${partNumber}`;
											row["sku"] = uuidv4();
										}

										// price
										if (replacedKey == "price") {
											row["clean_price"] = parseInt(
												row[row_key].replace("$", "")
											) * 100;
										}

										// name
										if (replacedKey == "name") {
											row["condition"] = "used";
											row["thumbnail"] = "used";
										}
										row[replacedKey] =
											replacedKey == "name"
												? row[row_key].replace("Used", "")
												: row[row_key];

										delete row[row_key];
									}
								});
							});

							//console.log('results -> ', results);
							try {

								// TODO: WE STILL NEED WOOCOMMERCE?
								// compile products to add to WooCommerce
								//const objForWooCommerce = results.map(
								//	createProductsForWooCommerceList
								//);
								//let productsForAdditionToWooCommerce = resultListForWooCommerce;
								//productsForAdditionToWooCommerce.create = objForWooCommerce;

								//console.log('objForWooCommerce -> ', objForWooCommerce);
								// TODO: IMPORTANT: DETERMINE WHATS RELEVANT HERE

								let payload = {
									modifiedArr: results.map(
										createProductsList
									), catalogArr: results.map(
										createProductsListForCatalogue
									)
								};

								// to be sent to the catalogue(user)
								const objForCatalogueBulkCreate = results.map(
									createProductsForCatalogueList
								);

								// to be sent to the catalogue(facebook)
								// const objForFacebookBatchAPI = results.map(
								// 	createProductsForFacebookCommerceList
								// );
								// let productsForAdditionToFacebookCommerce = facebookBatchAPIObj;
								// productsForAdditionToFacebookCommerce.requests =
								// 	objForFacebookBatchAPI;

								await addProductToUserCatalogue(
									[objForCatalogueBulkCreate],
									payload
								).then(function (response) {
									// console.log("woo => ", response);
									let taskLog = (task.log === "") ? [] : JSON.parse(task.log);
									resolve({
										status: 1,
										uuid: task.uuid,
										user_mobile: task.user_mobile,
										in_queue: 0,
										attempts: task.attempts + 1,
										expiry_date: moment().add(12, "h").format(), // TODO: let's start with 12 hours
										result: JSON.stringify(response),
										log: JSON.stringify(taskLog.push({ date: moment().format(), attempt: task.attempts + 1, result: response }))
									});
								});
							} catch (error) {
								console.log(error.message);
								let taskLog = (task.log === "") ? [] : JSON.parse(task.log);
								resolve({
									status: 0,
									uuid: task.uuid,
									user_mobile: task.user_mobile,
									in_queue: 0,
									attempts: task.attempts + 1,
									result: JSON.stringify({ error: true, message: "internal error occured" }),
									log: JSON.stringify(taskLog.push({ date: moment().format(), attempt: task.attempts + 1, result: error }))
								});
							}
						}
					})
					.catch(async (error) => {
						// interpret error and maybe display something on the UI
						console.log(error);
						let taskLog = (task.log === "") ? [] : JSON.parse(task.log);
						resolve({
							status: 1,
							uuid: task.uuid,
							user_mobile: task.user_mobile,
							in_queue: 0,
							attempts: task.attempts + 1,
							result: JSON.stringify({ error: true, message: "part not found/invalid OEM part number" }),
							log: JSON.stringify(taskLog.push({ date: moment().format(), attempt: task.attempts + 1, result: error }))
						});
					});
			} catch (error) {
				let taskLog = (task.log === "") ? [] : JSON.parse(task.log);
				resolve({
					status: 0,
					uuid: task.uuid,
					user_mobile: task.user_mobile,
					in_queue: 0,
					attempts: task.attempts + 1,
					result: JSON.stringify({ error: true, message: error.message }),
					log: JSON.stringify(taskLog.push({ date: moment().format(), attempt: task.attempts + 1, result: error }))
				});
			}
		} else {
			let taskLog = (task.log === "") ? [] : JSON.parse(task.log);
			resolve({
				status: 1,
				uuid: task.uuid,
				user_mobile: task.user_mobile,
				in_queue: 0,
				attempts: task.attempts + 1,
				result: JSON.stringify({ error: true, message: "invalid OEM part number" }),
				log: JSON.stringify(taskLog.push({ date: moment().format(), attempt: task.attempts + 1, result: { error: true, message: "invalid OEM part number" } }))
			});
		}
	});
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
	let resultObj = { error: true, message: "this is a generic message", catalogue: [] };

	return new Promise(async function (resolve, reject) {
		// Create a product see more in https://woocommerce.github.io/woocommerce-rest-api-docs/#product-properties
		api
			.post("products/batch", objProduct)
			.then(async (response) => {
				// Successful request
				console.log("Response Status:", response.status);
				if (response.data.create) {
					try {
						let modifiedArr = []; let catalogArr = [];
						response.data.create.map(function (product) {
							if (product.id > 0) {
								modifiedArr.push(createProductsList(product));
								catalogArr.push(createProductsListForCatalogue(product));
							}
						});

						resultObj.error = false;
						resultObj.message = modifiedArr; // for sending to user
						resultObj.catalogue = catalogArr; // for cataloging - this is unnecessary, this already exists in WooCommerce
						resolve(resultObj);
					} catch (error) {
						resultObj.error = true;
						resultObj.message = error;
						resolve(resultObj);
						console.log(error);
					}
				}
			})
			.catch(async (error) => {
				// Invalid request, for 4xx and 5xx statuses
				await sendPlainTextMessage(
					task.user_mobile,
					"internal error, please try again later"
				);
				resultObj.error = true;
				resultObj.message = error.response;
				resolve(resultObj);
			});
	});
}

async function addProductToFacebookCommerce(objProduct, objPayload) {
	let resultObj = { error: true, message: "this is a generic message", catalogue: [] };
	return new Promise(async function (resolve, reject) {
		// Create a product see more in https://woocommerce.github.io/woocommerce-rest-api-docs/#product-properties
		var data = JSON.stringify(objProduct);
		var config = {
			method: "post",
			url: "https://graph.facebook.com/v15.0/1154340098851255/batch",
			headers: {
				"Content-Type": "application/json",
			},
			data: data,
		};
		axios(config)
			.then(async (response) => {
				// Successful request
				console.log("Response Status:", response.status);
				if (Array.isArray(response.data.handles)) {
					try {
						const { modifiedArr, catalogArr } = objPayload;
						// TODO: IMPORTANT : NARROW DOWN THE OPTIONS TO ONLY WHATS NECESSARY & RELEVANT
						resultObj.error = false;
						resultObj.message = modifiedArr; // for sending to user
						resultObj.catalogue = catalogArr; // for cataloging - this is unnecessary, this already exists in WooCommerce
						resolve(resultObj);
					} catch (error) {
						resultObj.error = true;
						resultObj.message = error;
						resolve(resultObj);
						console.log(error);
					}
				} else {
					resultObj.error = true;
					resultObj.message = error;
					resolve(resultObj);
					console.log(error);
				}
			})
			.catch(async (error) => {
				resultObj.error = true;
				resultObj.message = error.response;
				resolve(resultObj);
			});
	});
}

async function addProductToUserCatalogue(objProduct, objPayload) {
	let resultObj = { error: true, message: "this is a generic message", catalogue: [] };
	return new Promise(async function (resolve, reject) {
		createResourceBulkGeneric(
			"user_mobile_catalogue", objProduct,
			function (task_err, task_result) {
				if (task_err) {
					resultObj.error = true;
					resultObj.message = "internal error occured: CATADD-0";
					resolve(resultObj);
					console.log(task_err);				
					return;
				} else {
					if (!task_result.error) {
						const { modifiedArr, catalogArr } = objPayload;
						// TODO: IMPORTANT : NARROW DOWN THE OPTIONS TO ONLY WHATS NECESSARY & RELEVANT
						resultObj.error = false;
						resultObj.message = modifiedArr; // for sending to user
						resultObj.catalogue = catalogArr; // for cataloging - this is unnecessary, this already exists in WooCommerce
						resolve(resultObj);
					} else {
						resultObj.error = true;
						resultObj.message = "internal error occured: CATADD-1";
						resolve(resultObj);
						console.log(task_result);
					}
					return;
				}
			}
		);
	});
}

module.exports = {
	scrapOnBeforward,
};
