const {
	resultListForWooCommerce
} = require("../utils/message_formats");
const {
	createProductsList,
	createProductsForWooCommerceList
} = require("../utils/message_helper");

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
											row["sku"] = task.user_mobile + "-" + row[row_key].replace(/\W/g, "");
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

							//console.log('results -> ', results);
							try {
								// compile products to add to WooCommerce
								const objForWooCommerce = results.map(
									createProductsForWooCommerceList
								);
								let productsForAdditionToWooCommerce = resultListForWooCommerce;
								productsForAdditionToWooCommerce.create = objForWooCommerce;

								//console.log('objForWooCommerce -> ', objForWooCommerce);
								await addProductToWooCommerce(
									productsForAdditionToWooCommerce,
									task
								).then(function (response) {
									console.log("woo => ", response);
									resolve({
										status: 1,
										uuid: task.uuid,
										in_queue: 0,
										attempts: task.attempts + 1,
										result: JSON.stringify(response),
									});
								});
							} catch (error) {
								console.log(error.message);
								resolve({
									status: 0,
									uuid: task.uuid,
									in_queue: 0,
									attempts: task.attempts + 1,
									result: JSON.stringify({ error: true, message: error.message }),
								});
							}
						}
					})
					.catch(async (error) => {
						// interpret error and maybe display something on the UI
						console.log(error);
						resolve({
							status: 1,
							uuid: task.uuid,
							in_queue: 0,
							attempts: task.attempts + 1,
							result: JSON.stringify({ error: true, message: "part not found/invalid OEM part number" }),
						});
					});
			} catch (error) {
				resolve({
					status: 0,
					uuid: task.uuid,
					in_queue: 0,
					attempts: task.attempts + 1,
					result: JSON.stringify({ error: true, message: error.message }),
				});
			}
		} else {
			resolve({
				status: 1,
				uuid: task.uuid,
				in_queue: 0,
				attempts: task.attempts + 1,
				result: JSON.stringify({ error: true, message: "invalid OEM part number" }),
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
	let resultObj = { error: true, message: "this is a generic message", data_short: [], data_full: [] };

	return new Promise(async function (resolve, reject) {
		// Create a product see more in https://woocommerce.github.io/woocommerce-rest-api-docs/#product-properties
		api
			.post("products/batch", objProduct)
			.then(async (response) => {
				// Successful request
				console.log("Response Status:", response.status);
				if (response.data.create) {
					try {
						let modifiedArr = [];
						response.data.create.map(function (product) {
							if (product.id > 0) {
								modifiedArr.push(createProductsList(product));
							}
						});

						resultObj.error = false;
						resultObj.data_short = modifiedArr; // for sending to user
						resultObj.data_full = response.data.create; // for cataloging
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

module.exports = {
	scrapOnBeforward,
};
