require("dotenv").config();
const axios = require('axios');

const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
const facebookBusinessAccount= process.env.FACEBOOK_MESSAGING_ACCOUNT;

async function sendWhatsAppMessage(data) {
  const config = {
    method: 'post',
    url: `${facebookBusinessAccount}/messages`,
    headers: {
	  'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    data: data
  };

  return await axios(config);
}

async function updateWhatsAppMessage(data) {
	const config = {
		method: 'put',
		url: `${facebookBusinessAccount}/messages`,
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		data: data
	};

	return await axios(config)
}

function createProductsList(product) {
	return {
		"product_retailer_id": `${product.sku}`
		//"product_retailer_id": `${product.sku}_${product.id}`
	}
}

function createProductsListForCatalogue(product) {
	return {
		// "facebook_commerce_id": `${product.sku}_${product.id}`, WooCommerce
		//"woocommerce_id": product.id,

		"facebook_commerce_id": `${product.sku}`,
		"description": product.name,
		"price": product.clean_price,
		"currency": "USD",
		"permalink": `https://parts.kuchado.co.uk?p=${product.sku}`,
		"images": product.images,
		"date_created": product.date_created,
		"sku": product.sku
	}
}

function createProductsForWooCommerceList(product) {
	return {
		"sku": `${product.sku}`,
		"name": product.name,
		"type": "simple",
		"regular_price": `${product.clean_price}`,
		"price_html": `${product.price}`,
		"description": product.name,
		"short_description": product.name,
		"categories": [
			{
				"id": 9
			},
			{
				"id": 14
			}
		],
		"images": [
			{
				"src": "http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_2_front.jpg"
			},
			{
				"src": "http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_2_back.jpg"
			}
		]
	}
}

function createProductsForFacebookCommerceList(product) {
	return {
		"method": "CREATE",
		"retailer_id":`${product.sku}`,
		"data": {
			"availability": "in stock",
			"inventory": 1,
			"custom_label_0": `${product.custom_label_0}`,
			"brand": "Unspecified",
			"category": "motor-vehicle-parts",
			"description":  product.name,
			"image_url": "https://i8.amplience.net/i/jpl/jd_172907_a?qlt=92&w=900&h=637&v=1&fmt=auto",
			"name": product.name,
			"price":  `${product.clean_price}`,
			"currency": "USD",
			"shipping": [
				{
					"country": "US",
					"region": "CA",
					"service": "service",
					"price_value": "10",
					"price_currency": "USD"
				}
			],
			"condition": `${product.condition}`,
			"url": `https://parts.kuchado.co.uk?p=${product.sku}`,
			"retailer_product_group_id": `${product.retailer_product_group_id}`
		}
	}
}

function createProductsForCatalogueList(product) {
	return {
		"status": 1, // 0: expired, 1: active, 2: purchased 
		"expiry_date": `${product.expiry_date}`,
		"user_mobile": `${product.user_mobile}`,
		"sku": `${product.sku}`, // uuid based
		"availability": "in stock",
		"inventory": 1,
		"brand": "Unspecified",
		"category": "motor-vehicle-parts",
		"description":  `${product.name}`,
		"image_url": "https://i8.amplience.net/i/jpl/jd_172907_a?qlt=92&w=900&h=637&v=1&fmt=auto",
		"name": `${product.name}`,
		"price":  `${product.clean_price}`,
		"currency": "USD",
		"shipping": `${product.shipping}`,
		"condition": `${product.condition}`,
		"source_retailer": `${product.source_retailer}`,
		"source_retailer_sku": `${product.source_retailer_sku}`,
		"task_uuid": `${product.task_uuid}`
	}
}

async function listTemplates() {
	return await axios({
		method: 'get',
		url: `${facebookBusinessAccount}/message_templates`
			+ '?limit=1000'
			+ `&access_token=${accessToken}`
	})
}

async function createMessageTemplate(template) {
	console.log('name:' + process.env.TEMPLATE_NAME_PREFIX + '_' + template.name);
	const config = {
		method: 'post',
		url: `${facebookBusinessAccount}/message_templates`,
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		data: {
			name: process.env.TEMPLATE_NAME_PREFIX + '_' + template.name,
			category: template.category,
			components: template.components,
			language: template.language
		}
	};

	return await axios(config)
}

module.exports = {
	sendWhatsAppMessage,
	updateWhatsAppMessage,
	listTemplates,
	createMessageTemplate,
	createProductsList,
	createProductsListForCatalogue,
	createProductsForWooCommerceList,
	createProductsForFacebookCommerceList,
	createProductsForCatalogueList
};
