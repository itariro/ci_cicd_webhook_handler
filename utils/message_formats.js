require("dotenv").config();
const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

const text = {
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "text",
  "text": {
      "preview_url": false,
      "body": "MESSAGE_CONTENTS"
  }
}

const list = {
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "interactive",
  "interactive": {
      "type": "product_list",
      "header": {
          "type": "text",
          "text": "Add item to your cart"
      },
      "body": {
          "text": "There are the parts we found matching your part number"
      },
      "footer": {
          "text": "Parts listed are from our new and used"
      },
      "action": {
          "catalog_id": "1154340098851255",
          "sections": [
              {
                  "title": "Best of used/refurbished",
                  "product_items": [
                      {
                          "product_retailer_id": "<YOUR_PRODUCT1_SKU_IN_CATALOG>"
                      },
                      {
                          "product_retailer_id": "<YOUR_SECOND_PRODUCT1_SKU_IN_CATALOG>"
                      }
                  ]
              }
          ]
      }
  }
}

const replyButton = {
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "Do you want to add an item to your order?"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "0",
            "title": "No"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "1",
            "title": "Yes"
          }
        }
      ]
    }
  }
}

const resultList = {
	"create": []
}

const facebookBatchAPIObj = {
  "access_token": accessToken,
  "requests": []
}

if (exports) {
  exports.plainText = text;
  exports.interactiveList = list;
  exports.resultListForWooCommerce = resultList;
  exports.interactiveReplyButton = replyButton;
  exports.facebookBatchAPIObj = facebookBatchAPIObj;
}
