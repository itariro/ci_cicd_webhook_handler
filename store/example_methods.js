function get(url) {
	// Return a new promise.
	return new Promise(function (resolve, reject) {
		// on success
		if (req.status == 200) {
			// Resolve the promise with the response text
			resolve(req.response);
		} else {
			// Otherwise reject with the status text
			// which will hopefully be a meaningful error
			reject(Error("some error here"));
		}
	});
}