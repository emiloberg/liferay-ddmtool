var fs			= require('fs-extra');
var Q			= require('q');

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

		globalSites					= cache.readFileFromCache(Constants.fetch('cacheSitesFilename'));
		globalSitesWithStructure	= cache.readFileFromCache(Constants.fetch('cacheSitesWithStructuresFilename'));
		globalStructures			= cache.readFileFromCache(Constants.fetch('cacheStructuresFilename'));
		globalTemplates				= cache.readFileFromCache(Constants.fetch('cacheTemplatesFilename'));
		LrClassNameConfig			= cache.readFileFromCache(Constants.fetch('cacheClassNameIdsByName'));
	},
	readFileFromCache: function (filename) {
		// Todo
		// Add error handling for non json files
		return fs.readJsonSync(Constants.fetch('cacheFolder') + '/' + filename);
	},
	saveToCache: function (e, filename) {
		fs.outputFileSync(Constants.fetch('cacheFolder') + '/' + filename, JSON.stringify(e));
	},
	readFromCache: function () {
		utilities.writeToScreen('Reading data from Cache', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		Q.resolve()
			.then(cache.getAllCache)
			.done(function () {
				var router = require('./router.js');
				router(Constants.fetch('STEP_JUST_READ_ALL_FROM_SERVER'));
			}, function (e) {
				lrException(e);
			});
	},
	clearCache: function () {
		fs.removeSync(Constants.fetch('cacheFolder'));
	}

};

module.exports = cache;