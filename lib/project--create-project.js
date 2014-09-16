
var clc			= require('cli-color');
var fs			= require('fs-extra');
var inquirer	= require("inquirer");
var Q			= require('q');

var Constants                       = require('./SingleConstants.js');

var utilities	                    = require('./utilities.js');
var getData	             			= require('./getData.js');



var createProject = function () {


	var hostsOut = [];
	var retValue = true;

	console.log();
	console.log('Initializing a New Project');
	console.log('    Need some data to set up the project:');
	console.log('    - Project Name. You\'ll use this every time you run the script. Pick something short.');
	console.log('    - The path to the DDM files (structures, templates, etc) on your local machine. ');
	console.log('      Folder will be created if path does not exist. ');
	console.log('      This is the folder you want to check-in to your version control system.');
	console.log('    - Whether we should upload/download Liferay default DDMs or not');
	console.log();
	console.log('      Settings will be saved to ' + clc.yellow(Constants.fetch('settingsFolder') + '/' + Constants.fetch('projectsFolder') + '/projectname.json'));
	console.log('      and may be edited at any time');
	console.log();

	// Define Project Questions
	var questionsProject = [
		{
			type: "input",
			name: "projectName",
			message: "Project Short Name",
			validate: function( value ) {
				var pass = value.match(/^[a-z0-9\-]{1,15}$/i);
				if (pass) {
					if (fs.existsSync(Constants.fetch('settingsFolder') + '/' + Constants.fetch('projectsFolder') + '/' + value.toLowerCase() + '.json')) {
						return "Project named '" + value + "' already exists";
					} else {
						return true;
					}
				} else {
					return "Project name must be maximum 15 characters and only contain alfanumeric characters and underscore";
				}
			},
			filter: function(value) {
				return value.trim();
			}
		},
		{
			type: "input",
			name: "filesPath",
			message: "Path to files on this machine",
			filter: function(value) {
				return utilities.removeTrailingSlash(value);
			}
		},
		{
			type: "input",
			name: "defaultLocale",
			message: "Default locale. Just press enter for",
			default: "en_US",
			validate: function( value ) {
				var pass = value.match(/^[a-z\_]{2}\_[A-Z]{2}$/);
				if (pass) {
					return true;
				} else {
					return "Locale must be by the standard \"en_US\"";
				}
			},
			filter: function(value) {
				return value.trim();
			}
		},
		{
			type: "list",
			name: "ignoreLRDefault",
			message: "Should I handle or ignore Liferay default templates/structures?",
			choices: [
				{
					name: 'Include Liferay Defaults',
					value: false
				},
				{
					name: 'Ignore Liferay Defaults',
					value: true
				}
			]
		}
	];

	// Ask Project Questions
	inquirer.prompt( questionsProject, function(answersProject) {

		console.log();
		console.log('Add your first server');
		console.log('    The URL, Username and Password to a Liferay Server (URL may be http://localhost)');
		console.log('    You may add more servers after this.');
		console.log();

		// Define Hosts Questions
		var questionsHosts = [
			{
				type: "input",
				name: "name",
				message: "Host Name (e.g 'prod1' or 'local-dev'):",
				validate: function( value ) {
					var pass = value.match(/^[a-z0-9\-]{1,15}$/i);
					if (pass) {
						retValue = true;
						for (var i = 0; i < hostsOut.length; i++) {
							if (hostsOut[i].name.toLowerCase() === value.toLowerCase()) {
								retValue = 'Host name already exists, choose another one';
							}
						}
						return retValue;
					} else {
						return "Host name must be maximum 15 characters and only contain alfanumeric characters and underscore";
					}
				},
				filter: function(value) {
					return value.trim();
				}
			},
			{
				type: "input",
				name: "host",
				message: "Liferay Host (URL):",
				filter: function(value) {
					return utilities.removeTrailingSlash(value.trim());
				}
			},
			{
				type: "input",
				name: "username",
				message: "Lifray Username",
				filter: function(value) {
					return value.trim();
				}
			},
			{
				type: "input",
				name: "password",
				message: "Liferay Password",
				filter: function(value) {
					return value.trim();
				}
			}
		];

		// Ask Hosts Questions
		function askForHosts() {
			inquirer.prompt(questionsHosts, function(answersHosts) {

				// Check if connection works
				var deferred = Q.defer();
				utilities.writeToScreen('Testing connection', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
				getData('{"/portal/get-build-number": {}}', true, answersHosts.host, answersHosts.username, answersHosts.password)
					.then(function () {
						utilities.writeToScreen('Connection okay!', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
						// Resolve Promise if connection Works
						deferred.resolve();
					}, function (e) {
						// If connection didn't work, ask if user want's to save it anyway.
						utilities.writeToScreen('Could not establish connection (' + e + ')', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_ERROR'));

						inquirer.prompt([{
							type: "list",
							name: "proceed",
							message: "What do you want to do?",
							choices: [
								{
									name: 'Re-enter the server information',
									value: 'reenter'
								},
								{
									name: 'Save configuration, even though connection failed',
									value: 'save'
								}
							]
						}
						], function( answers ) {
							// Check if user wanted to re-enter the information of save it anyways
							if (answers.proceed === 'reenter') {
								// If the user wants to re-enter the information,
								// set the current answers as default answers for the new questions,
								// and then ask the new question.
								utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
								utilities.writeToScreen('Previously entered values within parentheses\nJust press <enter> if you want to leave the field unchanged', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
								utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

								questionsHosts[0].default = answersHosts.name;
								questionsHosts[1].default = answersHosts.host;
								questionsHosts[2].default = answersHosts.username;
								questionsHosts[3].default = answersHosts.password;

								askForHosts();
							} else {
								// If the user wants to save the information, even though a connection
								// couldn't be made, just resolve this and go to next step.
								deferred.resolve();
							}
						});

						return deferred.promise;


					})
					.done(function () {
						// Ask if the user wants to add another server.
						inquirer.prompt([{
							type: "list",
							name: "askAgain",
							message: "Do you want to enter another server",
							choices: [
								{
									name: 'Yes',
									value: true
								},
								{
									name: 'No',
									value: false
								}
							]
						}
						], function(answersAskAgain) {
							// Save the just added server to array
							hostsOut.push(answersHosts);

							if (answersAskAgain.askAgain) {
								// If the user wants to add another server
								questionsHosts.forEach(function(obj){ delete obj.default; });
								console.log();
								console.log('Add your ' + clc.yellow(utilities.stringifyNumber(hostsOut.length + 1)) + ' server');
								console.log();
								askForHosts();
							} else {
								// If the user don't want to add another server, save the configuration to file
								// and send the user to the 'Select Projects' screen.

								// Append hosts
								answersProject.hosts = hostsOut;

								// Add templates to ignore.
								if (answersProject.ignoreLRDefault) {
									answersProject.ignoreDDMs = Constants.fetch('ignoreDDMs');
								} else {
									answersProject.DONTignoreDDMs = Constants.fetch('ignoreDDMs');
								}
								delete answersProject.ignoreLRDefault;

								fs.outputFileSync(Constants.fetch('settingsFolder') + '/' + Constants.fetch('projectsFolder') + '/' + answersProject.projectName.toLowerCase() + '.json', JSON.stringify(answersProject, null, "  "));
								utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
								utilities.writeToScreen('Project created!', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
								utilities.writeToScreen('Settings saved to ' + Constants.fetch('settingsFolder') + '/' + Constants.fetch('projectsFolder') + '/' + answersProject.projectName.toLowerCase() + '.json', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
								utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));

								var router = require('./router.js');
								router(Constants.fetch('STEP_JUST_CREATED_PROJECT'));

							}
						});
					});
			});
		}
		// ask for Hosts the first time.
		askForHosts();
	});

};

module.exports = createProject;