"use strict";

var fs			= require('fs-extra');
var inquirer	= require("inquirer");


var Constants                       = require('./SingleConstants.js');
var Config							= require('./SingleConfig.js');
var RouterArgs	             		= require('./SingleRouterArgs.js');
var lrException                     = require('./error-exception.js');
var router	             			= require('./router.js');


var loadProject = function (projectJson) {

	fs.readJson(Constants.fetch('settingsFolder') + '/' + Constants.fetch('projectsFolder') + '/' + projectJson, function(er, project) {
		if(er) {
			lrException(er);
		}

		var hosts = [];

		Config.set('defaultLocale', project.defaultLocale);
		Config.set('filesFolder', project.filesPath);
		Config.set('ignoreDDMs', project.ignoreDDMs);

		// Check if user supplied a project as an argument or if we should present a gui.
		if (RouterArgs.fetch('hasProject')) {
			if (project.hosts.length === 1) {
				// If user supplied a project and there's only one server in the config
				// load that config

				Config.set('host', project.hosts[0].host);
				Config.set('username', project.hosts[0].username);
				Config.set('password', project.hosts[0].password);

				router(Constants.fetch('STEP_JUST_LOADED_CONFIG'));
			} else {
				// If the user supplied a project but there's more than one,
				// server in the config file, check if the user also supplied an
				// argument for which server to use.
				if (RouterArgs.fetch('hasServer') === true) {
					var currentServer = project.hosts.filter(function(server) {
						return server.name === RouterArgs.fetch('server');
					});

					if (currentServer.length > 0) {

						Config.set('host', currentServer[0].host);
						Config.set('username', currentServer[0].username);
						Config.set('password', currentServer[0].password);

						router(Constants.fetch('STEP_JUST_LOADED_CONFIG'));
					} else {
						lrException('Server \'' + RouterArgs.fetch('server') + '\' does not exist');
					}
				} else {
					lrException('If a project (--project) with more than one server is supplied\nyou need to supply a server (--server) as well');
				}

			}
		} else {
			if (project.hosts.length === 1) {
				Config.set('host', project.hosts[0].host);
				Config.set('username', project.hosts[0].username);
				Config.set('password', project.hosts[0].password);

				router(Constants.fetch('STEP_JUST_LOADED_CONFIG'));
			} else {
				for (var i = 0; i < project.hosts.length; ++i) {
					hosts.push({
						name: project.hosts[i].name,
						value: {
							host: project.hosts[i].host,
							username: project.hosts[i].username,
							password: project.hosts[i].password
						}
					});
				}

				inquirer.prompt([{
					type: "list",
					name: "selectHosts",
					message: "Which host do you want to work with?",
					choices: hosts
				}
				], function(answers) {
					Config.set('host', answers.selectHosts.host);
					Config.set('username', answers.selectHosts.username);
					Config.set('password', answers.selectHosts.password);

					router(Constants.fetch('STEP_JUST_LOADED_CONFIG'));
				});
			}
		}



	});

};

module.exports = loadProject;