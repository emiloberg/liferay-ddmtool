var Sites				= [];

function fetch(entry, prop) {
	if (typeof entry === 'undefined') {
		return Sites;
	} else {
		if (typeof prop === 'undefined') {
			return Sites[entry];
		} else {
			return Sites[entry][prop];
		}
	}
}

function setAll(entries) {
	Sites = entries;
}

function add(entry) {
	Sites.push(entry);
}

function addToEntry(entry, prop, val) {
	Sites[entry][prop] = val;
}

function getSingleValue(lookForProperty, lookForValue, returnProperty) {
	var ret = Sites.filter(function(entry) {
		return entry[lookForProperty] == lookForValue;
	});

	if (ret.length === 1) {
		return ret[0][returnProperty];
	} else {
		return undefined;
	}
}



module.exports.fetch = fetch;
module.exports.add = add;
module.exports.setAll = setAll;
module.exports.addToEntry = addToEntry;
module.exports.getSingleValue = getSingleValue;
