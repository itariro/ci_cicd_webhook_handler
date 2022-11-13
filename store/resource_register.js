const resource_register = [
	{
		"table": "task",
		"schema":
			"CREATE TABLE IF NOT EXISTS task (id INTEGER PRIMARY KEY, date TEXT, systemid TEXT, uuid TEXT, previous_point_marker TEXT, current_point_marker TEXT, status DEFAULT 0, attempts INTEGER);",
		"read_filter":
			"id, date, systemid, uuid, previous_point_marker, current_point_marker, status, attempts"
	},
	{
		"table": "incident",
		"schema":
			"CREATE TABLE IF NOT EXISTS incident (id INTEGER PRIMARY KEY, date TEXT, description TEXT, source TEXT, severity TEXT);",
		"read_filter": "id, date, description, source, severity"
	},
	{
		"table": "user_mobile",
		"schema":
			"CREATE TABLE IF NOT EXISTS user_mobile (id INTEGER PRIMARY KEY, name TEXT, mobile_number TEXT, farm TEXT, status DEFAULT 0, balance DEFAULT 0.00, auth_token TEXT, auth_token_expiry TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, name, mobile_number, farm, status, balance, deleted, date_created, date_updated"
	},
	{
		"table": "user_admin",
		"schema":
			"CREATE TABLE IF NOT EXISTS user_admin (id INTEGER PRIMARY KEY, name TEXT, email_address TEXT, mobile_number TEXT, user_type TEXT, password TEXT, status DEFAULT 0, auth_token TEXT, auth_token_expiry TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, name, email_address, mobile_number, user_type, status, date_created, date_updated"
	},
	{
		"table": "user_partner",
		"schema":
			"CREATE TABLE IF NOT EXISTS user_partner (id INTEGER PRIMARY KEY, name TEXT, email_address TEXT, partner_type TEXT, password TEXT, status DEFAULT 0, auth_token TEXT, auth_token_expiry TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, name, email_address, partner_type, password, status, deleted, date_created, date_updated"
	},
	{
		"table": "field",
		"schema":
			"CREATE TABLE IF NOT EXISTS field (id INTEGER PRIMARY KEY, farmer_id TEXT, name TEXT, size TEXT, polygon TEXT, centre TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, farmer_id, name, size, polygon, centre, deleted, date_created, date_updated"
	},
	{
		"table": "field_insights",
		"schema":
			"CREATE TABLE IF NOT EXISTS field_insights (id INTEGER PRIMARY KEY, field_id TEXT, summary TEXT, insight_request_date TEXT, insight_request_payload TEXT, insight_source TEXT, insight_response TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, field_id, summary, insight_request_date, insight_request_payload, insight_source, insight_response, deleted, date_created, date_updated"
	},
	{
		"table": "transactions_mobile",
		"schema":
			"CREATE TABLE IF NOT EXISTS transactions_mobile (id INTEGER PRIMARY KEY, mobile_user_id INTEGER, description TEXT, date TEXT, direction TEXT, amount TEXT, new_balance TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, mobile_user_id, description, date, direction, amount, new_balance, deleted, date_created, date_updated"
	},
	{
		"table": "transactions_partner",
		"schema":
			"CREATE TABLE IF NOT EXISTS transactions_partner (id INTEGER PRIMARY KEY, partner_id INTEGER, description TEXT, date TEXT, direction TEXT, amount TEXT, new_balance TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, partner_id, description, date, direction, amount, new_balance, deleted, date_created, date_updated"
	},
	{
		"table": "subscription",
		"schema":
			"CREATE TABLE IF NOT EXISTS subscription (id INTEGER PRIMARY KEY, title TEXT, description TEXT, premium_amount DEFAULT 0, frequency TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter": "id, title, description, premium_amount, frequency, new_balance, deleted, date_created, date_updated"
	},
	{
		"table": "subscriber",
		"schema":
			"CREATE TABLE IF NOT EXISTS subscriber (id INTEGER PRIMARY KEY, user_type TEXT, user_id INTEGER, subscription_id INTEGER, status DEFAULT 0, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, title, description, premium_amount, frequency, date_created, date_updated"
	},
	{
		"table": "user_type",
		"schema":
			"CREATE TABLE IF NOT EXISTS user_type (id INTEGER PRIMARY KEY, type TEXT, description TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, type, description"
	},
	{
		"table": "status",
		"schema":
			"CREATE TABLE IF NOT EXISTS status (id INTEGER PRIMARY KEY, title TEXT, description TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, title, description"
	},
	{
		"table": "partner_type",
		"schema":
			"CREATE TABLE IF NOT EXISTS partner_type (id INTEGER PRIMARY KEY, type TEXT, description TEXT, deleted DEFAULT 0, date_created DEFAULT CURRENT_TIMESTAMP, date_updated TEXT);",
		"read_filter":
			"id, type, description"
	}
];

module.exports = resource_register;
