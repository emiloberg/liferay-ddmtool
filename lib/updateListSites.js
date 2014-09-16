var globalStructures				= require('./SingleStructures.js');
var globalTemplates					= require('./SingleTemplates.js');

var utilities	                    = require('./utilities.js');
var cache	                    	= require('./cache.js');

/**
 * Updates globalStructures and globalTemplates with the
 * newly created or updated theme/structure, and save
 * to cache.
 *
 */
var updateGlobalStructureTemplateWithNew = function (retObjs) {
	for (var i = 0; i < retObjs.length; i++) {
		if (retObjs[i].hasOwnProperty('templateKey')) {
			globalTemplates = globalTemplates.filter(function(entry) {
				return entry.templateKey != retObjs[i].templateKey;
			});
			globalTemplates.push(retObjs[i]);
			cache.saveToCache(globalTemplates, Fixed.cacheTemplatesFilename);
		} else if (retObjs[i].hasOwnProperty('structureKey')) {
			globalStructures = globalStructures.filter(function(entry) {
				return entry.structureKey != retObjs[i].structureKey;
			});
			globalStructures.push(retObjs[i]);
			cache.saveToCache(globalStructures, Fixed.cacheStructuresFilename);
		}
	}
};

module.exports = updateGlobalStructureTemplateWithNew;
