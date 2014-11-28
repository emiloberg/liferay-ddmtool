"use strict";

/**
 *
 * @type {{logMode: string, logTimestamp: boolean}}
 *
 * logMode may be set to:
 *   'normal' - prints everything to screen
 *   'sparse' - only print content with a severity of SEVERITY_IMPORTANT and above.
 *
 * logTimestamp - whether or not log should be prepended with a timestamp
 */
var Config = {
	logMode: 'normal',
	logTimestamp: false,

	userHome: '',
	settingsFolder: '',
	projectsFolder: '',
	cacheFolder: '',
	articlesCacheFolder: '',
	articlesFolderFullPath: ''
};

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

function getAll() {
	return Config;
}

module.exports.set = set;
module.exports.fetch = fetch;
module.exports.getAll = getAll;
