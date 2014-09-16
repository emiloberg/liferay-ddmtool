var fs			= require('fs-extra');
var Q			= require('q');

var Fixed	                        = require('./SingleFixed.js');
var globalStructures				= require('./SingleStructures.js');
var globalTemplates					= require('./SingleTemplates.js');
var globalSites						= require('./SingleSites.js');
var globalSitesWithStructure		= require('./SingleSitesWithStructure.js');
var LrClassNameConfig	    		= require('./SingleLrClassNameConfig.js');
var Constants                       = require('./SingleConstants.js');
var lrException                     = require('./error-exception.js');

var utilities	                    = require('./utilities.js');

var cache = {
	getAllCache: function () {
		// Todo
		// Add error handling for missing files

		globalSites					= cache.readFileFromCache(Fixed.cacheSitesFilename);
		globalSitesWithStructure	= cache.readFileFromCache(Fixed.cacheSitesWithStructuresFilename);
		globalStructures			= cache.readFileFromCache(Fixed.cacheStructuresFilename);
		globalTemplates				= cache.readFileFromCache(Fixed.cacheTemplatesFilename);
		LrClassNameConfig			= cache.readFileFromCache(Fixed.cacheClassNameIdsByName);
	},
	readFileFromCache: function (filename) {
		// Todo
		// Add error handling for non json files
		return fs.readJsonSync(Fixed.cacheFolder + '/' + filename);
	},
	saveToCache: function (e, filename) {
		fs.outputFileSync(Fixed.cacheFolder + '/' + filename, JSON.stringify(e));
	},
	readFromCache: function () {
		utilities.writeToScreen('Reading data from Cache', Constants.SEVERITY_NORMAL, Constants.SCREEN_PRINT_INFO);
		Q.resolve()
			.then(cache.getAllCache)
			.done(function () {
				var router = require('./router.js');
				router(Constants.STEP_JUST_READ_ALL_FROM_SERVER);
			}, function (e) {
				lrException(e);
			});
	},
	clearCache: function () {
		fs.removeSync(Fixed.cacheFolder);
	}

};

module.exports = cache;