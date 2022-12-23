const resourceName = "user_mobile";

async function registerUserGeneric(resourceChildren, callback) {
	try {
		let tableModel = global.CURRENT_MODELS.find((tableProperties) => tableProperties.table_name === resourceName);
		if (tableModel != null) {
			await tableModel.model_name.findOrCreate({
				where: resourceChildren,
			}).then(([user, created]) => {
				callback(null, {
					error: false,
					data: user,
				});
			});
		} else {
			callback(null, {
				error: true,
				message: "resource does not exist",
			});
		}
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

async function updateUserGeneric(resourceFilter, resourceChildren, callback) {
	/* update single log entry */
	try {
		let tableModel = global.CURRENT_MODELS.find((tableProperties) => tableProperties.table_name === resourceName);
		if (tableModel != null) {
			const updatedRecord = await tableModel.model_name.update(resourceChildren, {
				where: resourceFilter
			});
			if (updatedRecord) {
				callback(null, {
					error: false,
					data: updatedRecord
				});
			} else {
				callback(null, {
					error: true,
					message: "resource does not exist"
				});
			}
		} else {
			callback(null, {
				error: true,
				message: "resource does not exist"
			});
		}
	} catch (error) {
		callback(null, {
			error: true,
			message: error,
		});
	}
}

module.exports = {
	registerUserGeneric,
	updateUserGeneric
};