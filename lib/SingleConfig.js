var Config = {};

function set(prop, val) {
	Config[prop] = val;
}

function fetch(prop) {
	if (typeof prop === 'undefined') {
		return Config;
	} else {
		return Config[prop];
	}
}

module.exports.set = set;
module.exports.fetch = fetch;
