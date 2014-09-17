var Structures				= [];

function fetch(entry, prop) {
	if (typeof entry === 'undefined') {
		return Structures;
	} else {
		if (typeof prop === 'undefined') {
			return Structures[entry];
		} else {
			return Structures[entry][prop];
		}
	}
}

function setAll(entries) {
	Structures = entries;
}

function add(entry) {
	Structures.push(entry);
}

function addToEntry(entry, prop, val) {
	Structures[entry][prop] = val;
}

function updateAll(entries) {
	var tempObj = [];
	for (var i = 0; i < entries.length; i++) {
		if (entries[i].hasOwnProperty('structureKey')) {
			tempObj = Structures.filter(function(entry) {
				return entry.structureKey != entries[i].structureKey;
			});
			tempObj.push(entries[i]);
			Structures = tempObj;
		}
	}
}

module.exports.fetch = fetch;
module.exports.add = add;
module.exports.setAll = setAll;
module.exports.addToEntry = addToEntry;
module.exports.updateAll = updateAll;


