"use strict";

var fs								= require('fs-extra');
var inquirer						= require("inquirer");

var Constants                       = require('./Constants.js');
var Config							= require('./Config.js');
var RouterArgs	             		= require('./RouterArgs.js');
var lrException                     = require('./errorException.js');
var router	             			= require('./router.js');


var loadProject = function (projectJson) {

	fs.readJson(Config.fetch('projectsFolder') + '/' + projectJson, function(er, project) {
		if(er) {
			lrException(er);
		}

		var hosts = [];

		Config.set('defaultLocale', project.defaultLocale);
		Config.set('filesFolder', project.filesPath);
		Config.set('ignoreDDMs', project.ignoreDDMs);
		Config.set('projectName', project.projectName);
		Config.set('externalDiff', project.externalDiff);
		Config.set('watchIgnorePattern', project.watchIgnorePattern);
		Config.set('ddmCacheFolder', Config.fetch('cacheFolder') + '/' + project.projectName + '/' + Constants.fetch('ddmCacheFolder'));

		// Check if user supplied a project as an argument or if we should present a gui.
		if (RouterArgs.fetch('hasProject')) {
			if (project.hosts.length === 1) {
				// If user supplied a project and there's only one server in the config
				// load that config

				Config.set('hostFriendlyName', project.hosts[0].name);
				Config.set('host', project.hosts[0].host);
				Config.set('username', project.hosts[0].username);
				Config.set('password', project.hosts[0].password);
				Config.set('email', project.hosts[0].email);

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
						Config.set('hostFriendlyName', currentServer[0].name);
						Config.set('host', currentServer[0].host);
						Config.set('username', currentServer[0].username);
						Config.set('password', currentServer[0].password);
						Config.set('email', currentServer[0].email);

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
				Config.set('hostFriendlyName', project.hosts[0].name);
				Config.set('host', project.hosts[0].host);
				Config.set('username', project.hosts[0].username);
				Config.set('password', project.hosts[0].password);
				Config.set('email', project.hosts[0].email);

				router(Constants.fetch('STEP_JUST_LOADED_CONFIG'));
			} else {
				for (var i = 0; i < project.hosts.length; ++i) {
					hosts.push({
						name: project.hosts[i].name,
						value: {
							name: project.hosts[i].name,
							host: project.hosts[i].host,
							username: project.hosts[i].username,
							password: project.hosts[i].password,
							email: project.hosts[i].email
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
					Config.set('hostFriendlyName', answers.selectHosts.name);
					Config.set('host', answers.selectHosts.host);
					Config.set('username', answers.selectHosts.username);
					Config.set('password', answers.selectHosts.password);
					Config.set('email', answers.selectHosts.email);

					router(Constants.fetch('STEP_JUST_LOADED_CONFIG'));
				});
			}
		}



	});

};

module.exports = loadProject;