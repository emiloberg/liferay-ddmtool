"use strict";

var fs			= require('fs-extra');
var glob		= require("glob");
var inquirer	= require("inquirer");


var lrException                     = require('./error-exception.js');
var RouterArgs	             		= require('./SingleRouterArgs.js');
var Fixed	                        = require('./SingleFixed.js');

var createProject	             	= require('./project--create-project.js');
var utilities	                    = require('./utilities.js');

var selectProject = function () {

	if (RouterArgs.hasProject) {
		// If project is supplied in arguments
		var projectSettingsPath = Fixed.settingsFolder + '/' + Fixed.projectsFolder + '/' + RouterArgs.projectName.toLowerCase() + '.json';
		if (fs.existsSync(projectSettingsPath)) {
			var loadProject = require('./project--load-project.js');
			loadProject(RouterArgs.projectName.toLowerCase() + '.json'); //TODO ÄNDRA HÄR.
		} else {
			lrException('Project \'' + RouterArgs.projectName + '\' does not exist.');
		}

	} else {
		var globOptions = {
			cwd: Fixed.settingsFolder + '/' + Fixed.projectsFolder
		};

		glob('*.json', globOptions, function (err, files) {
			if(err) {
				lrException(err);
			}

			if (files.length === 0) {
				console.log();
				console.log('Looks like it\'s the first time you run this App');
				console.log();

				inquirer.prompt([{
					type: "list",
					name: "proceed",
					message: "What do you want to do?",
					choices: [
						{
							name: 'Create a new project',
							value: 'new'
						},
						{
							name: 'Quit',
							value: 'quit'
						}
					]
				}
				], function( answers ) {
					if (answers.proceed === 'new') {
						createProject();
					}
				});


			} else {
				var projectName;
				var projects = [];
				for (var i = 0; i < files.length; ++i) {
					projectName = utilities.filenameAndPathToFilename(files[i]);
					projects.push({
						name: projectName,
						value: files[i]
					});
				}

				projects.push(new inquirer.Separator());
				projects.push({
					name: "Create new project",
					value: "new"
				});

				inquirer.prompt([{
					type: "list",
					name: "selectProject",
					message: "Which project do you want to work with?",
					choices: projects
				}
				], function(answers) {
					if (answers.selectProject === 'new') {
						createProject();
					} else {
						var loadProject = require('./project--load-project.js');
						loadProject(answers.selectProject); //TODO ÄNDRA
					}
				});

			}

		});

	}

};

module.exports = selectProject;