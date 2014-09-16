var Q           = require('q');


var Constants   					= require('./SingleConstants.js');
var RouterArgs	             		= require('./SingleRouterArgs.js');
var lrException                     = require('./error-exception.js');
var showHelp                     	= require('./help.js');
var selectProject	             	= require('./project--select-project.js');
var download	             		= require('./download.js');
var showMainMenu	             	= require('./mainMenu.js');
var cache	                    	= require('./cache.js');

var router = function (step) {
	if (RouterArgs.doShowHelp) {
		showHelp();
	} else {
		if (step === Constants.STEP_START) {
			selectProject();
		} else if (step === Constants.STEP_JUST_LOADED_CONFIG) {
			if (RouterArgs.loadFromCache) {
				cache.readFromCache();
			} else {
				download.downloadAllFromServer();
			}
		} else if (step === Constants.STEP_JUST_READ_ALL_FROM_SERVER ) {
			showMainMenu();
		} else if (step === Constants.STEP_JUST_SAVED_ALL_FILES_TO_DISK ) {
			showMainMenu();
		} else if (step === Constants.STEP_JUST_UPLOADED_DDMS ) {
			showMainMenu();
		} else if (step === Constants.STEP_JUST_CREATED_PROJECT ) {
			selectProject();
		} else {
			lrException('Unknown next step!');
		}
	}
};

module.exports = router;