var Templates				= [];

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
			tempObj = Templates.filter(function(entry) {
				return entry.templateKey != entries[i].templateKey;
			});
			tempObj.push(entries[i]);
			Templates = tempObj;
		}
	}
}

module.exports.fetch = fetch;
module.exports.add = add;
module.exports.setAll = setAll;
module.exports.addToEntry = addToEntry;
module.exports.updateAll = updateAll;

