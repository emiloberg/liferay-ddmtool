"use strict";

var inquirer	= require("inquirer");

var RouterArgs	             		= require('./SingleRouterArgs.js');
var createProject	             	= require('./project--create-project.js');
var saveEverythingToFile	        = require('./save--save-everything.js');
var uploadSingleFileToServer	    = require('./upload--upload-single-file.js');

var temp	             			= require('./temp.js');



var showMainMenu = function () {

	// TODO, remove temp-if
	if (RouterArgs.temp) {
		RouterArgs.temp = false;
		temp();
	} else if (RouterArgs.doSaveAllFilesToDisk) {
		saveEverythingToFile();
	} else {
		if (!RouterArgs.doSilently) {
			console.log('');
			inquirer.prompt([
					{
						type: "list",
						name: "mainMenu",
						message: "What do you want to do?",
						choices: [
							{
								name: 'Watch (TODO)',
								value: ''
							},
							{
								name: 'Download All',
								value: 'saveAllFilesToDisk'
							},
							{
								name: 'Upload Single (TODO)',
								value: 'uploadSingleFileToServer'
							},
							{
								name: 'Upload All (TODO)',
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
						saveEverythingToFile();
					} else if (answers.mainMenu === 'createNewProject') {
						createProject();
					} else {
						console.log('Bye bye!');
					}
				}
			);
		}
	}
};

module.exports = showMainMenu;