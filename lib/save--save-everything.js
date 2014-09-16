"use strict";

var utilities	                    	= require('./utilities.js');
var Constants   						= require('./SingleConstants.js');
var RouterArgs	             			= require('./SingleRouterArgs.js');
var saveStructuresAndTemplatesToFile	= require('./save--save-structures-and-templates.js');
var globalStructures					= require('./SingleStructures.js');
var globalTemplates						= require('./SingleTemplates.js');

var saveEverythingToFile = function() {
	utilities.writeToScreen('Saving everything to disk', Constants.SEVERITY_NORMAL, Constants.SCREEN_PRINT_INFO);
	saveStructuresAndTemplatesToFile(globalTemplates);
	saveStructuresAndTemplatesToFile(globalStructures);
	RouterArgs.doSaveAllFilesToDisk = false;

	var router = require('./router.js');
	router(Constants.STEP_JUST_SAVED_ALL_FILES_TO_DISK);

};

module.exports = saveEverythingToFile;