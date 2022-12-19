const express = require("express");
const router = express.Router();

/* LIST all tasks */
router.get("/:systemid", async function (req, res, next) {
	try {
		const db = require("../../services/db").dbConnection();
		db.all(
			`SELECT date, systemid, uuid, previous_point_marker, current_point_marker, status FROM task WHERE systemid = '${req.params.systemid}' ORDER BY id`,
			[],
			(err, rows) => {
				if (err) {
					res.status(400).json({
						error: true,
						message: err.message,
					});
					db.close();
					return;
				}
				if (rows.length > 0) {
					console.log("some rows");
					res.status(200).json({
						error: false,
						data: rows,
					});
					db.close();
					return;
				} else {
					console.log("no rows");
					res.status(400).json({
						error: true,
						message: "no tasks found",
					});
					db.close();
					return;
				}
			}
		);
	} catch (error) {
		console.error(`error while fetching task list`, error);
		res.status(400).json({ error: true, message: error });
		next(error);
	}
});

/* POST NEW task */
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
							body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
							from: '+15017122661',
							to: req.body.mobileNumber
						})
						.then(message => console.log(message.sid));

					const db = require("../../services/db").dbConnection();
					const moment = require("moment");
					db.run(
						`INSERT INTO task (date, systemid, uuid, previous_point_marker, current_point_marker, status, attempts) VALUES(?,?,?,?,?,?,?)`,
						[
							moment().format(),
							req.params.systemid,
							req.params.systemid + "." + req.body.after,
							req.body.before,
							req.body.after,
							"pending",
							0,
						],
						function (err) {
							if (err) {
								res.status(400).json({
									error: true,
									message: err.message,
								});
								return;
							}
							res.status(200).json({
								error: false,
								data: this.lastID,
							});
							return;
						}
					);
					db.close();
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

function validatePhoneNumber(input_str) {
	var re = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;
	return re.test(input_str);
}

module.exports = router;
