const client = require('./contentful_client').client

async function getAPIConfig () {
	try {
		const entries = await client.getEntries({
			content_type: "kuchandoAutoApiConfig",
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



