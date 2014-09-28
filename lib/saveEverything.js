"use strict";

var utilities	                    	= require('./utilities.js');
var Constants   						= require('./Constants.js');
var RouterArgs	             			= require('./RouterArgs.js');
var saveTemplates						= require('./saveTemplates.js');
var saveStructures						= require('./saveStructures.js');
var Structures							= require('./Structures.js');
var Templates							= require('./Templates.js');
var Config								= require('./Config.js');



var saveEverythingToFile = function(filesRootPath, options) {

	// Set default options and save to uploadOptions object.
	options = typeof options !== 'undefined' ? options : {};
	options.silent = typeof options.silent !== 'undefined' ? options.silent : false;
	options.returnToMainMenu = typeof options.returnToMainMenu !== 'undefined' ? options.returnToMainMenu : true;

	if (!options.silent) {
		utilities.writeToScreen('Saving everything to disk', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		utilities.writeToScreen('', Constants.fetch('SCREEN_PRINT_HEADING'));
	}

	saveStructures(Structures.fetch(), filesRootPath, options);
	saveTemplates(Templates.fetch(), filesRootPath, options);

	if (!options.silent) {
		utilities.writeToScreen('', Constants.fetch('SCREEN_PRINT_HEADING'));
	}

	RouterArgs.set('doSaveAllFilesToDisk', false);

	if (options.returnToMainMenu) {
		var router = require('./router.js');
		router(Constants.fetch('STEP_JUST_SAVED_ALL_FILES_TO_DISK'));
	}

};

module.exports = saveEverythingToFile;