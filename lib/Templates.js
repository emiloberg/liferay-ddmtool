"use strict";

var Templates = [];

function fetch(entry, prop) {
	if (typeof entry === 'undefined') {
		return Templates;
	} else {
		if (typeof prop === 'undefined') {
			return Templates[entry];
		} else {
			return Templates[entry][prop];
		}
	}
}

function getAllFilter(lookForProperty, lookForValue) {
	return Templates.filter(function(entry) {
		return entry[lookForProperty] == lookForValue;
	});
}

function setAll(entries) {
	Templates = entries;
}

function add(entry) {
	Templates.push(entry);
}

function addToEntry(entry, prop, val) {
	Templates[entry][prop] = val;
}

function updateAll(entries) {
	var tempObj = [];
	for (var i = 0; i < entries.length; i++) {
		if (entries[i].hasOwnProperty('templateKey')) {
			/*jshint -W083 */
			tempObj = Templates.filter(function(entry) {
				return entry.templateKey != entries[i].templateKey;
			});
			/*jshint +W083 */
			tempObj.push(entries[i]);
			Templates = tempObj;
		}
	}
}

function getSingleValue(lookForProperty, lookForValue, returnProperty) {
	var ret = Templates.filter(function(entry) {
		return entry[lookForProperty] == lookForValue;
	});

	if (ret.length === 1) {
		return ret[0][returnProperty];
	} else {
		return undefined;
	}
}


module.exports.fetch = fetch;
module.exports.getAllFilter = getAllFilter;
module.exports.add = add;
module.exports.setAll = setAll;
module.exports.addToEntry = addToEntry;
module.exports.updateAll = updateAll;
module.exports.getSingleValue = getSingleValue;

