const createClient = require("createClient");

function useContentful() {
	const client = createClient({
		space: process.env.REACT_APP_CONTENTFUL_SPACE,
		accessToken: process.env.REACT_APP_CONTENTFUL_ACCESS_TOKEN,
		host: process.env.REACT_APP_CONTENTFUL_HOST,
	});

	const getSiteConfig = async () => {
		try {
			const entries = await client.getEntries({
				content_type: "siteConfig",
				select: "fields",
			});
			const sanitizedEntries = entries.items.map((item) => {
				const banner = "placeholder";
				return {
					...item.fields,
					banner,
				};
			});
			return sanitizedEntries;
		} catch (error) {
			console.log(`Error fetching config section : ${error}`);
		}
	};

	return {
		getSiteConfig,
	};
}

module.exports = {
  useContentful,
};
