var RouterArgs = {
	doSilently: false,
	hasProject: false,
	hasServer: false,
	loadFromCache: false,
	doSaveAllFilesToDisk: false,
	doShowHelp: false,
	temp: false
};

function set(prop, val) {
	RouterArgs[prop] = val;
}

function fetch(prop) {
	if (typeof prop === 'undefined') {
		return RouterArgs;
	} else {
		return RouterArgs[prop];
	}
}


module.exports.set = set;
module.exports.fetch = fetch;
