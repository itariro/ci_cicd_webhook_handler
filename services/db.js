const { Sequelize, DataTypes } = require("sequelize");
let sequelizeInstance = dbConnectionSequelize();
global.CURRENT_MODELS = [];

async function createDatabase() {
	try {
		/* create database + tables */
		const resourceSchema = global.API_CONFIGS[0].resourceSchema;
		resourceSchema.map((resource) => {
			console.log("creating -> ", resource.table);
			const schemaColumns = resource.schema.split(",");
			var fields = new Object();
			schemaColumns.forEach((element) => {
				fields[fieldName(element)] = fieldEntry(element);
			});
			// register model
			global.CURRENT_MODELS.push({
				table_name: resource.table,
				model_name: registerModel(resource.table, resource.table, fields),
			});
		});
		await sequelizeInstance.sync({ force: true, logging:false });
		console.log("All models were synchronized successfully.");
		return {error: false, message: "all models were synchronized successfully."};
	} catch (error) {
		console.log(error);
		return {error: true, message: error};
	}
}

function fieldName(item) {
	const spacerPosition = item.trim().indexOf(" ");
	return item.substr(0, spacerPosition + 1).trim();
}

function fieldEntry(item) {
	const spacerPosition = item.trim().indexOf(" ");
	let columnName = item.substr(0, spacerPosition + 1).trim();
	let columnType = item.substr(spacerPosition + 1).trim();

	if (columnName == "id") {
		return {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		};
	} else {
		return setDataType(columnType);
	}
}

function registerModel(tableName, modelName, fields) {
	const model = sequelizeInstance.define(
		modelName,
		{
			...fields,
		},
		{
			tableName: tableName,
		}
	);
	return model;
}

function setDataType(colType) {
	if (colType === "DEFAULT 0") {
		return {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		};
	}
	if (colType === "TEXT") {
		return {
			type: DataTypes.STRING,
			defaultValue: "",
		};
	}
	if (colType === "DEFAULT 0.00") {
		return {
			type: DataTypes.DECIMAL,
			defaultValue: 0.0,
		};
	}
	if (colType === "DATE") {
		return {
			type: DataTypes.DATE,
		};
	}
}


/* ---------- AUXILIARY FUNCTIONS ---------- */
async function dbConnectionSequelize() {
	return new Sequelize(
		"postgres://majestic_admin:8DVa3SBu38PLYosK87D8E@majestic-apps-db.cropenlgdxvr.us-east-1.rds.amazonaws.com:5432/kuchando_auto"
	);
}

async function dbTest() {
	sequelizeInstance
		.authenticate()
		.then(() => {
			console.log("Connection has been established successfully.");
		})
		.catch((error) => {
			console.error("Unable to connect to the database: ", error);
		});
}

module.exports = {
	createDatabase,
	dbConnection,
	dbConnectionSequelize,
	dbTest,
};
