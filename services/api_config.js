const client = require('./contentful_client').client

const getAPIConfig = async () => {
	try {
		const entries = await client.getEntries({
			content_type: "apiConfig",
			select: "fields",
		});
		const sanitizedEntries = entries.items.map((item) => {
			return {
				...item.fields,
			};
		});
		return sanitizedEntries;
	} catch (error) {
		console.log(`Error fetching config section : ${error}`);
	}
};
module.exports = {
	getAPIConfig
}



