const express = require("express");
const { createIncidentLog } = require("../../services/task_manager");
const router = express.Router();

/* send auth SMS */
router.post("/sendSMS", async function (req, res, next) {
	try {
		/*  RequestObject
			-------------
			mobileNumber,
			source,
			authType [registration, login, transaction]
		 */

		if (!validatePhoneNumber(req.body.mobileNumber)) {
			res.status(400).json({
				error: true,
				message: "mobile number is invalid, please try again",
			});
			return;
		} else {
			// what's the purpose of the SMS 
			// TODO: need more context on usecase 
			switch (req.body.authType) {
				case 'registration':
				case 'login':
				case 'transaction':
					const accountSid = process.env.TWILIO_ACCOUNT_SID;
					const authToken = process.env.TWILIO_AUTH_TOKEN;
					const client = require('twilio')(accountSid, authToken);
					// send the SMS 
					client.messages
						.create({
							body: req.body.messageBody,
							from: '+15017122661',
							to: req.body.mobileNumber
						})
						.then(message => {
							res.status(200).json({
								error: true,
								message: message.sid,
							});
						});
					break;
				default:
					res.status(400).json({
						error: true,
						message: "sorry, this action could not be completed due to an error, please try again.",
					});
					return;
			}
		}
	} catch (error) {
		console.error(`error while sending message `, error);
		next(error);
	}
});

/* generate new auth token */
router.get("/apikey/set", async function (req, res, next) {
	try {
		const newApiKey = uuidv4();
		const client = contentful.createClient({
			accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN
		})

		client.getSpace(process.env.CONTENTFUL_SPACE)
			.then((space) => space.getEnvironment('master'))
			.then((environment) => environment.getEntry('41VlUnLymaEcNxt2OofsBo'))
			.then((entry) => entry.patch([
				{
					op: 'replace',
					path: '/fields/apiKey/en-US',
					value: newApiKey
				}
			]))
			.then((entry) => {
				console.log(`Entry ${entry.sys.id} updated.`);
				/* log incident */
				global.API_KEY = newApiKey;
				createIncidentLog({
					description: `apikey regen-> success`,
					source: "system",
					severity: "HIGH",
				});
				return res.status(200).json({
					error: false,
					message: `apikey regen success`,
				});
			})
			.catch(() => {
				/* log incident */
				createIncidentLog({
					description: `apikey regen-> failed`,
					source: "system",
					severity: "HIGH",
				});
				return res.status(400).json({
					error: true,
					message: `apikey regen-> ${error}`,
				})
			})
	} catch (error) {
		console.error(`error setting new api key`, error);
		res.status(400).json({ error: true, message: error });
		next(error);
	}
});

const validatePhoneNumber = (input_str) => {
	var re = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;
	return re.test(input_str);
}

module.exports = router;
