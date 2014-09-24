"use strict";

var showMainMenu = function () {

	var inquirer	= require("inquirer");

	var RouterArgs	             		= require('./SingleRouterArgs.js');
	var createProject	             	= require('./project--create-project.js');
	var saveEverythingToFile	        = require('./save--save-everything.js');
	var uploadSingleFileToServer	    = require('./upload--upload-single-file.js');
	var uploadAllFiles	    			= require('./upload-all-files.js');
	var watchFiles	             		= require('./watch.js');
	var Config							= require('./SingleConfig.js');
	var Constants                       = require('./SingleConstants.js');
	var utilities	                    = require('./utilities.js');

	var temp	             			= require('./temp.js');

	var filesRootPath = Config.fetch('filesFolder');

	// TODO, remove temp-if
	if (RouterArgs.fetch('temp')) {
		RouterArgs.set('temp', false);
		temp();
	} else if (RouterArgs.fetch('doSaveAllFilesToDisk')) {
		RouterArgs.set('doSaveAllFilesToDisk', false);
		saveEverythingToFile(filesRootPath);
	} else if (RouterArgs.fetch('goIntoWatch')) {
		RouterArgs.set('goIntoWatch', false);
		watchFiles(Config.fetch('filesFolder'));
	} else {
		if (!RouterArgs.fetch('doSilently')) {

			utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));

			inquirer.prompt([
					{
						type: "list",
						name: "mainMenu",
						message: "What do you want to do?",
						choices: [
							{
								name: 'Watch',
								value: 'watch'
							},
							{
								name: 'Download All and Save to Disk',
								value: 'saveAllFilesToDisk'
							},
							{
								name: 'Upload Single (TODO)',
								value: 'uploadSingleFileToServer'
							},
							{
								name: 'Upload All',
								value: 'uploadAllFilesToServer'
							},
							{
								name: 'Create new project',
								value: 'createNewProject'
							},
							new inquirer.Separator(),
							{
								name: 'Quit',
								value: 'quit'
							}
						]
					}
				], function( answers ) {
					if (answers.mainMenu === 'uploadSingleFileToServer') {
						uploadSingleFileToServer();
					} else if (answers.mainMenu === 'saveAllFilesToDisk') {
						saveEverythingToFile(filesRootPath);
					} else if (answers.mainMenu === 'createNewProject') {
						createProject();
					} else if (answers.mainMenu === 'watch') {
						watchFiles(Config.fetch('filesFolder'));
					} else if (answers.mainMenu === 'uploadAllFilesToServer') {
						uploadAllFiles();
					} else {
						console.log('Bye bye!');
					}
				}
			);
		}
	}
};

module.exports = showMainMenu;