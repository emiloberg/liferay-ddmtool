"use strict";

var fs								= require('fs-extra');
var glob							= require("glob");
var inquirer						= require("inquirer");

var Config							= require('./Config.js');
var Constants                       = require('./Constants.js');
var lrException                     = require('./errorException.js');
var RouterArgs	             		= require('./RouterArgs.js');
var createProject	             	= require('./projectCreate.js');
var utilities	                    = require('./utilities.js');

var selectProject = function () {

	if (RouterArgs.fetch('hasProject')) {
		// If project is supplied in arguments
		var projectSettingsPath = Config.fetch('projectsFolder') + '/' + RouterArgs.fetch('projectName').toLowerCase() + '.json';
		if (fs.existsSync(projectSettingsPath)) {
			var loadProject = require('./projectLoad.js');
			loadProject(RouterArgs.fetch('projectName').toLowerCase() + '.json');
		} else {
			lrException('Project \'' + RouterArgs.fetch('projectName') + '\' does not exist.');
		}

	} else {
		var globOptions = {
			cwd: Config.fetch('projectsFolder')
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
						var loadProject = require('./projectLoad.js');
						loadProject(answers.selectProject);
					}
				});

			}

		});

	}

};

module.exports = selectProject;