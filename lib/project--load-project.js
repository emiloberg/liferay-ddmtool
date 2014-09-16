"use strict";

var fs			= require('fs-extra');
var inquirer	= require("inquirer");


var Fixed	                        = require('./SingleFixed.js');
var Constants                       = require('./SingleConstants.js');
var Config							= require('./SingleConfig.js');
var RouterArgs	             		= require('./SingleRouterArgs.js');
var lrException                     = require('./error-exception.js');
var router	             			= require('./router.js');


var loadProject = function (projectJson) {

	fs.readJson(Fixed.settingsFolder + '/' + Fixed.projectsFolder + '/' + projectJson, function(er, project) {
		if(er) {
			lrException(er);
		}

		var hosts = [];

		Config.defaultLocale = project.defaultLocale;
		Config.filesFolder = project.filesPath;
		Config.ignoreDDMs = project.ignoreDDMs;

		// Check if user supplied a project as an argument or if we should present a gui.
		if (RouterArgs.hasProject) {
			if (project.hosts.length === 1) {
				// If user supplied a project and there's only one server in the config
				// load that config
				Config.host			= project.hosts[0].host;
				Config.username		= project.hosts[0].username;
				Config.password		= project.hosts[0].password;
				router(Constants.STEP_JUST_LOADED_CONFIG);
			} else {
				// If the user supplied a project but there's more than one,
				// server in the config file, check if the user also supplied an
				// argument for which server to use.
				if (RouterArgs.hasServer === true) {
					var currentServer = project.hosts.filter(function(server) {
						return server.name === RouterArgs.server;
					});

					if (currentServer.length > 0) {
						Config.host			= currentServer[0].host;
						Config.username		= currentServer[0].username;
						Config.password		= currentServer[0].password;
						router(Constants.STEP_JUST_LOADED_CONFIG);
					} else {
						lrException('Server \'' + RouterArgs.server + '\' does not exist');
					}
				} else {
					lrException('If a project (--project) with more than one server is supplied\nyou need to supply a server (--server) as well');
				}

			}
		} else {
			if (project.hosts.length === 1) {
				Config.host			= project.hosts[0].host;
				Config.username		= project.hosts[0].username;
				Config.password		= project.hosts[0].password;
				router(Constants.STEP_JUST_LOADED_CONFIG);
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
					Config.host			= answers.selectHosts.host;
					Config.username		= answers.selectHosts.username;
					Config.password		= answers.selectHosts.password;

					router(Constants.STEP_JUST_LOADED_CONFIG);
				});
			}
		}



	});

};

module.exports = loadProject;