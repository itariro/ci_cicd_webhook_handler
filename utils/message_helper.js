const axios = require('axios');

const accessToken = process.env.ACCESS_TOKEN;
const apiVersion = process.env.VERSION;
const myNumberId = process.env.PHONE_NUMBER_ID;
const myBizAcctId = process.env.BUSINESS_ACCOUNT_ID;

async function sendWhatsAppMessage(data) {
  const config = {
    method: 'post',
    url: `https://graph.facebook.com/v15.0/111615048453223/messages`,
    headers: {
      'Authorization': `Bearer EAAJuN3hCHRwBAHXZCHqZBFswi1gs3cHnBdWeR9gHzJweEZCkMFajjhhaxfwAgyJd75hST5Loz2IP7orCObg1EWQhVAa1aruZByYlGxG9f5lYZAMddgdBX5YCRcG1ZBBfISeKJPk9mSlGwbK5ZABbZA8yMLJXac8fPhlZBBnIxd97SyxjuZCAB8RnO8bqdggXqIX1KbPo5tOZBbOOAZDZD`,
      'Content-Type': 'application/json'
    },
    data: data
  };

  return await axios(config);
}

async function updateWhatsAppMessage(data) {
	const config = {
		method: 'put',
		url: `https://graph.facebook.com/${apiVersion}/${myNumberId}/messages`,
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
		"product_retailer_id": `${product.sku}_${product.id}`
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

function getMessageData(recipient, order) {
	// const { messageTemplates } = require('./message_templates')
	// const messageTemplate = messageTemplates[order.statusId - 1]

	// let messageParameters

	// switch (messageTemplate.name) {
	// 	case 'welcome':
	// 		messageParameters = [
	// 			{ type: "text", text: order.customer.split(' ')[0] },
	// 		];
	// 		break;
	// 	case 'payment_analysis':
	// 		messageParameters = [
	// 			{ type: "text", text: order.customer.split(' ')[0] },
	// 			{ type: "text", text: products[order.items[0].productId - 1].name },
	// 		];
	// 		break;
	// 	case 'payment_approved':
	// 		messageParameters = [
	// 			{ type: "text", text: order.customer.split(' ')[0] },
	// 			{ type: "text", text: order.id },
	// 			{ type: "text", text: order.deliveryDate },
	// 		];
	// 		break;
	// 	case 'invoice_available':
	// 		messageParameters = [
	// 			{ type: "text", text: order.customer.split(' ')[0] },
	// 			{ type: "text", text: products[order.items[0].productId - 1].name },
	// 			{ type: "text", text: `https://customer.your-awesome-grocery-store-demo.com/my-account/orders/${order.id}` },
	// 		];
	// 		break;
	// 	case 'order_picked_packed':
	// 		messageParameters = [
	// 			{ type: "text", text: order.customer.split(' ')[0] },
	// 			{ type: "text", text: order.id },
	// 			{ type: "text", text: `https://customer.your-awesome-grocery-store-demo.com/my-account/orders/${order.id}` },
	// 		];
	// 		break;
	// 	case 'order_in_transit':
	// 		messageParameters = [
	// 			{ type: "text", text: order.customer.split(' ')[0] },
	// 			{ type: "text", text: order.id },
	// 			{ type: "text", text: order.deliveryDate },
	// 			{ type: "text", text: `https://customer.your-awesome-grocery-store-demo.com/my-account/orders/${order.id}` },
	// 		];
	// 		break;
	// 	case 'order_delivered':
	// 		messageParameters = [
	// 			{ type: "text", text: order.customer.split(' ')[0] },
	// 			{ type: "text", text: order.id },
	// 			{ type: "text", text: order.deadlineDays },
	// 		];
	// 		break;
	// }

	// const messageData = {
	// 	messaging_product: "whatsapp",
	// 	to: recipient,
	// 	type: "template",
	// 	template: {
	// 		name: process.env.TEMPLATE_NAME_PREFIX + '_' + messageTemplate.name,
	// 		language: { "code": "en_US" },
	// 		components: [{
	// 			type: "body",
	// 			parameters: messageParameters
	// 		}]
	// 	}
	// }

	// return JSON.stringify(messageData);
}

async function listTemplates() {
	return await axios({
		method: 'get',
		url: `https://graph.facebook.com/${apiVersion}/${myBizAcctId}/message_templates`
			+ '?limit=1000'
			+ `&access_token=${accessToken}`
	})
}

async function createMessageTemplate(template) {
	console.log('name:' + process.env.TEMPLATE_NAME_PREFIX + '_' + template.name);
	const config = {
		method: 'post',
		url: `https://graph.facebook.com/${apiVersion}/${myBizAcctId}/message_templates`,
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
	sendWhatsAppMessage: sendWhatsAppMessage,
	updateWhatsAppMessage: updateWhatsAppMessage,
	listTemplates: listTemplates,
	createMessageTemplate: createMessageTemplate,
	getMessageData: getMessageData,
	createProductsList: createProductsList,
	createProductsForWooCommerceList: createProductsForWooCommerceList
};
