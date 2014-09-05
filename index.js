/**
 * GOOD THINGS:
 * XML Parser: https://www.npmjs.org/package/xml2js
 *
 *
 *
 * TODO:
 *
 * Add a connection check, the first thing you do, to make sure you can connect to server
 *
 *
 * Make an option to not save structures which are Liferay default (unsure how to manage this)
 *
 *
 *	Since it's important that no templates/structures have the same name, create a function to 
 *  warn the user if some of the entities have the same name.
 *
 *	Get all Workflows aswell.
 *
 *
 *
 *	Current function for finding out if the app was started with a certain arguments is not
 *	that good. It will search for a key in the arguments-object and if that key exists - 
 *	do something. So far so god. However, the search function is greedy. If object contains
 *	value 'foobar', a search for 'foo' or 'bar' vill return true.
 *	Maybe just replace it with the regular process.argv.slice(2) and search that array
 *	with indexOf, or underscore's: _.indexOf(array, value) 
 *
 */


/**
 *	COLORS. Usage: clc.colorname('output')
 *	black		bgBlack		blackBright		bgBlackBright	
 *	red			bgRed		redBright		bgRedBright	
 *	green		bgGreen		greenBright		bgGreenBright	
 *	yellow		bgYellow	yellowBright	bgYellowBright	
 *	blue		bgBlue		blueBright		bgBlueBright	
 *	magenta		bgMagenta	magentaBright	bgMagentaBright	
 *	cyan		bgCyan		cyanBright		bgCyanBright	
 *	white		bgWhite		whiteBright		bgWhiteBright
 * 
 * bold
 * italic
 * underline
 * blink
 * inverse
 * strike
 *
 */


// Dependencies
var request		= require('superagent');
var Q			= require('q');
var fs			= require('fs-extra');
//var Promise		= require('bluebird');
var glob		= require("glob");

var clc			= require('cli-color');

var _			= require('underscore');

var argv		= require('minimist')(process.argv.slice(2));
var inquirer	= require("inquirer");

var cli			= require('cli');
var nprint		= require('node-print');




var heading = clc.blue;

var config = {};

// Localhost MOH
// var config = {
// 	host:				'http://localhost:8080/api/jsonws/invoke',
// 	username:			'test@liferay.com',
// 	password:			'test',
// 	filesFolder:		'/Users/emiloberg/Desktop/outputtest/new'
// };

// MOH
// var config = {
// 	host:				'http://15.126.227.132/api/jsonws/invoke',
// 	username:			'superadmin',
// 	password:			'icT@icT@1234',
// 	filesFolder:		'/Users/emiloberg/Desktop/outputtest/new'
// };


// CYGATE FI
// var config = {
// 	host:				'http://10.167.2.160:8280/api/jsonws/',
// 	username:			'www.admin@cygate.fi',
// 	password:			'www4dm1n',
// 	filesFolder:		'/Users/emiloberg/Desktop/outputtest/new'
// };

// LOCALHOST CYGATE
// var config = {
// 	host:				'http://localhost:8080',
// 	username:			'test@cygate.com',
// 	password:			'test',
// 	filesFolder:		'/Users/emiloberg/Desktop/outputtest/new'
// };



// Globals
var globalSites					= [];
var globalSitesWithStructure	= [];
var globalCompanyId				= 0;

var globalStructures			= [];
var globalTemplates				= [];


// Constansts
var fixed = {
	settingsFolder:						'settings',
	projectsFolder:						'projects',

	cacheFolder:						'cache',
	cacheSitesFilename:					'Sites.json',
	cacheSitesWithStructuresFilename:	'SitesWithStructures.json',
	cacheStructuresFilename:			'Structures.json',
	cacheTemplatesFilename:				'Templates.json',
	cacheClassNameIdsByName:			'ClassNameIDsByName.json',
	cacheClassNameIdsById:				'ClassNameIDsById.json',

	txtWorking:							'Working...',

	pathSlugDocumentTypes:				'document_types',
	pathSlugMetadataSets:				'metadata_sets',

	apiPath:							'/api/jsonws/invoke'
};


var globalClassNameIdsById = {};

var globalClassNameIdsByName = {
	PortletAssetModelAssetEntry: {
		"filesPath": 'application_display_template/templates',
		"friendlyName": 'Application Display Template (ADT)'
	},
	PortletDynamicdatamappingModelDDMStructure: {
		"filesPath": 'journal/templates',
		"friendlyName": 'Journal Article Template'
	},
	PortletDocumentlibraryModelDLFileEntryMetadata: {
		"filesPath": 'document_and_media',
		"friendlyName": 'Document Types'
	},
	PortletDocumentlibraryUtilRawMetadataProcessor: {
		"filesPath": 'unknown',
		"friendlyName": 'TODO Something with Document Metadata'
	},
	PortletDynamicdatalistsModelDDLRecordSet: {
		"filesPath": 'dynamic_data_lists/structures',
		"friendlyName": 'Dynamic Data List (DDL) Definition'
	},
	PortletJournalModelJournalArticle: {
		"filesPath": 'journal/structures',
		"friendlyName": 'Journal Article Structure'
	},
	PortalModelUser: {
		"friendlyName": 'User site'
	},
	PortalModelGroup: {
		"friendlyName": 'Group'
	},
	PortalModelOrganization: {
		"friendlyName": 'Organization'
	},
	PortalModelCompany: {
		"friendlyName": 'Company (Global)'
	}
};

var stepping = {
	hasProject: false,
	hasServer: false
};


// Debug things
var debugLevel				= 0;

var SEVERITY_NORMAL			= 0;
var SEVERITY_DEBUG			= -1;
var SCREEN_PRINT_INFO		= 0;
var SCREEN_PRINT_SAVE		= 1;
var SCREEN_PRINT_ERROR		= 2;
var SCREEN_PRINT_HEADING	= 3;


mainSwitch();

/** ************************************************************************ *\
 * 
 * CHAINS
 * 
\** ************************************************************************ */
function chainFetchAllFromServer() {
	writeToScreen('Getting data from server', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	Q.resolve()
	.then(clearCache)
	.then(getClassNameIds)
	.then(getUserSites)
	.then(getCompanyGroupFromCompanyId)
	.then(getStructuresFromListOfSites)
	.then(getTemplates)
	.then(saveEverythingToFile)

	.done(whatToDoSwitch, doneRejected);
}

function chainReadFromCache() {
	writeToScreen('Reading data from Cache', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	Q.resolve()
	.then(getAllCache)
	.then(saveEverythingToFile)
	.done(whatToDoSwitch, doneRejected);
}

/** ************************************************************************ *\
 * 
 * TODO: TEMPORARY, REMOVE LATER
 * 
\** ************************************************************************ */
function chainTemp() {
	Q.resolve()
	.then(getTemp)
	.then(handleGetTemp)
	.done(doneFulfilled, doneRejected);
}


function getTemp() {
	return getData('{"/ddmtemplate/get-templates": {"groupId": 10195, "classNameId": 10083}}');
}


function handleGetTemp(e){
	var resp = JSON.parse(e);
	console.dir(e);
}


/** ************************************************************************ *\
 * 
 * MAIN SWITCH
 * 
\** ************************************************************************ */


function showMainMenu() {
	inquirer.prompt([
		{
			type: "list",
			name: "theme",
			message: "XWhat do you want to do?",
			choices: [
				"Order a pizza",
				"Make a reservation",
				new inquirer.Separator(),
				"Ask opening hours",
				"Talk to the receptionnist"
				]
		},
		{
			type: "list",
			name: "size",
			message: "What size do you need",
			choices: [ "Jumbo", "Large", "Standard", "Medium", "Small", "Micro" ],
			filter: function( val ) { return val.toLowerCase(); }
		}
		], function( answers ) {
			console.log( JSON.stringify(answers, null, "  ") );
		});
}

function whatToDoSwitch() {

	// inquirer.prompt([
	// 	{
	// 		type: "list",
	// 		name: "theme",
	// 		message: "XWhat do you want to do?",
	// 		choices: [
	// 			"Order a pizza",
	// 			"Make a reservation",
	// 			new inquirer.Separator(),
	// 			"Ask opening hours",
	// 			"Talk to the receptionnist"
	// 			]
	// 	},
	// 	{
	// 		type: "list",
	// 		name: "size",
	// 		message: "What size do you need",
	// 		choices: [ "Jumbo", "Large", "Standard", "Medium", "Small", "Micro" ],
	// 		filter: function( val ) { return val.toLowerCase(); }
	// 	}
	// 	], function( answers ) {
	// 		console.log( JSON.stringify(answers, null, "  ") );
	// 	});

}

function saveArgs() {
	if (argv.hasOwnProperty('p')) {
		if (argv.p.length > 0) { stepping.hasProject = true; }
	}

	if (argv.hasOwnProperty('s')) {
		if (argv.s.length > 0) { stepping.hasServer = true; }
	}
}

function mainSwitch() {

	Q.resolve()
	.then(saveArgs)
	.then(selectProject)
	.done(doneFulfilled, doneRejected);


//createProject();

	// if (argv.p) {
	// 	console.log(argv.p);
	// }

	// if (argv.c) {
	// 	chainReadFromCache();
	// } else {
	// 	chainFetchAllFromServer();
	// }

//	if (valueExistsInObj(argv._, 'fetch')) {
//		chainFetchAllFromServer();
//	} else if (valueExistsInObj(argv._, 'temp')) {
//		chainTemp();
//	} else if (argv.c) {
//		chainReadFromCache();
//	} else {
//		console.dir(argv.c);
//		lrException('No valid argument');
//	}
}



/** ************************************************************************ *\
 * 
 * CACHE
 * 
\** ************************************************************************ */
function getAllCache() {
	// Todo
	// Add error handling for missing files 

	globalSites					= readFromCache(fixed.cacheSitesFilename);
	globalSitesWithStructure	= readFromCache(fixed.cacheSitesWithStructuresFilename);
	globalStructures			= readFromCache(fixed.cacheStructuresFilename);
	globalTemplates				= readFromCache(fixed.cacheTemplatesFilename);
	globalClassNameIdsByName	= readFromCache(fixed.cacheClassNameIdsByName);
	globalClassNameIdsById		= readFromCache(fixed.cacheClassNameIdsById);
}

function readFromCache(filename) {
	// Todo
	// Add error handling for non json files
	return fs.readJsonSync(fixed.cacheFolder + '/' + filename);
}

function saveToCache(e, filename) {
	fs.outputFileSync(fixed.cacheFolder + '/' + filename, JSON.stringify(e));
}

/** ************************************************************************ *\
 * 
 * Save To File
 * 
\** ************************************************************************ */
function saveEverythingToFile() {
	writeToScreen('Saving everything to file', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	saveStructuresAndTemplatesToFile(globalTemplates);
	saveStructuresAndTemplatesToFile(globalStructures);
}

function saveStructuresAndTemplatesToFile(e) {
	var filePath;
	var fileContent;
	var outCounter = {};

	for (i = 0; i < e.length; ++i) {
		if (globalClassNameIdsById.hasOwnProperty(e[i].classNameId)) {

			// Figure out what kind of data we're dealing with and get a filename/path and the content.
			if (e[i].hasOwnProperty('storageType') && e[i].hasOwnProperty('xsd')) {
				
				fileContent = e[i].xsd;

				// Check 'type' if class is Document Metadata. If so, depending on type, set different save paths for 'Document Type' and 'Metadata Set'
				if (globalClassNameIdsById[e[i].classNameId].className === 'PortletDocumentlibraryModelDLFileEntryMetadata') {
					if (e[i].type === 1) {
						filePath = config.filesFolder + '/' + globalClassNameIdsById[e[i].classNameId].filesPath + '/' + fixed.pathSlugDocumentTypes + '/' + e[i].nameCurrentValue + '.' + e[i].storageType;
					} else {
						filePath = config.filesFolder + '/' + globalClassNameIdsById[e[i].classNameId].filesPath + '/' + fixed.pathSlugMetadataSets + '/' + e[i].nameCurrentValue + '.' + e[i].storageType;
					}
				} else {
					filePath = config.filesFolder + '/' + globalClassNameIdsById[e[i].classNameId].filesPath + '/' + e[i].nameCurrentValue + '.' + e[i].storageType;
				}


			} else if (e[i].hasOwnProperty('script') && e[i].hasOwnProperty('language')) {
				filePath = config.filesFolder + '/' + globalClassNameIdsById[e[i].classNameId].filesPath + '/' + e[i].nameCurrentValue + '.' + e[i].language;
				fileContent = e[i].script;
			} else {
				throw Error('Could not find content in entity ' + e[i].classNameId + ' (nothing you can do about this, this is my bad)');
			}

			// Save file
			fs.outputFileSync(filePath, fileContent);

			//  Count the different files to be able to tell the user what's saved.
			if (outCounter.hasOwnProperty(globalClassNameIdsById[e[i].classNameId].friendlyName)) {
				outCounter[globalClassNameIdsById[e[i].classNameId].friendlyName] = outCounter[globalClassNameIdsById[e[i].classNameId].friendlyName] + 1;
			} else {
				outCounter[globalClassNameIdsById[e[i].classNameId].friendlyName] = 1;
			}


		} else {
			throw Error('Found an entry with ClassNameId ' + e[i].classNameId + ', but I don\'t know what kind of entry that is (nothing you can do about this, this is my bad)');
		}
	}

	// Echo what has been saved
	var outKeys = _.keys(outCounter);
	for (var x = 0; x < outKeys.length; ++x) {
		nprint.pf('%10s   %10s', outCounter[outKeys[x]], outKeys[x]);
	}
}


/** ************************************************************************ *\
 * 
 * Get Complete list of Sites 
 * 
\** ************************************************************************ */
function getUserSites() {
	writeToScreen('Downloading list of sites', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	return getData('{"/group/get-user-sites": {}}').then(
		function (e) {
			if(e.length === 0) {
				throw Error('Could not find any sites');
			} else {
				globalSites = e;
				globalCompanyId = e[0].companyId;
			}
		});
}

function getCompanyGroupFromCompanyId() {
	writeToScreen('Downloading company site', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	return getData('{"/group/get-company-group": {"companyId": ' + globalCompanyId + '}}').then(
		function (e) {
			// Dirty way of adding the global site to the list of sites.
			globalSites = JSON.parse('[' + JSON.stringify(globalSites).substr(1).slice(0, -1) + ',' + JSON.stringify(e) + ']');
			saveToCache(globalSites, fixed.cacheSitesFilename);
		});
}


/** ************************************************************************ *\
 * 
 * TEMPLATES
 * 
\** ************************************************************************ */
function getTemplates() {
	writeToScreen('Downloading templates', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	var apiArr = [];

	for (var i = 0; i < globalSites.length; ++i) {
		apiArr.push('{"/ddmtemplate/get-templates": {"groupId": ' + globalSites[i].groupId + ', "classNameId": ' + globalClassNameIdsByName.PortletAssetModelAssetEntry.id + '}}');
		apiArr.push('{"/ddmtemplate/get-templates": {"groupId": ' + globalSites[i].groupId + ', "classNameId": ' + globalClassNameIdsByName.PortletDynamicdatamappingModelDDMStructure.id + '}}');
	}

	return getData('[' + apiArr.join() + ']').then(
		function (e) {
			var curTemplate = [];
			for (var y = 0; y < e.length; ++y) {
				for (i = 0; i < e[y].length; ++i) {
					globalTemplates.push(e[y][i]);
				}
			}
			saveToCache(globalTemplates, fixed.cacheTemplatesFilename);
		});
}


/** ************************************************************************ *\
 * 
 * CLASS NAME IDS
 * 
\** ************************************************************************ */

function getClassNameIds() {
	writeToScreen('Downloading id\'s', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
	return getData('[' +
		// Templates and Structures to be downloaded
		'{"/classname/fetch-class-name-id": {"clazz": "com.liferay.portlet.asset.model.AssetEntry"}}, ' + //(10083) ADT
		'{"/classname/fetch-class-name-id": {"clazz": "com.liferay.portlet.dynamicdatamapping.model.DDMStructure"}}, ' + // (10102) All Structures

		// A structure can have one of these classNameId's:
		'{"/classname/fetch-class-name-id": {"clazz": "com.liferay.portlet.documentlibrary.model.DLFileEntryMetadata"}}, ' + // (10091) Document Metadata
		'{"/classname/fetch-class-name-id": {"clazz": "com.liferay.portlet.documentlibrary.util.RawMetadataProcessor"}}, ' + // (10315) Something with Documents
		'{"/classname/fetch-class-name-id": {"clazz": "com.liferay.portlet.dynamicdatalists.model.DDLRecordSet"}},' + // (10098) DDL Data Definition
		'{"/classname/fetch-class-name-id": {"clazz": "com.liferay.portlet.journal.model.JournalArticle"}}, ' + // (10109) Journal Article

		// A site can have one of these classNameId's:
		'{"/classname/fetch-class-name-id": {"clazz": "com.liferay.portal.model.User"}}, ' + //(10005) User site
		'{"/classname/fetch-class-name-id": {"clazz": "com.liferay.portal.model.Group"}}, ' + //(10001) Group
		'{"/classname/fetch-class-name-id": {"clazz": "com.liferay.portal.model.Organization"}}, ' + //(10003) Organization
		'{"/classname/fetch-class-name-id": {"clazz": "com.liferay.portal.model.Company"}}' + //(10025) Company (global)
		']').then(
			function (e) {
				globalClassNameIdsByName.PortletAssetModelAssetEntry.id =						e[0];
				globalClassNameIdsByName.PortletDynamicdatamappingModelDDMStructure.id =		e[1];
				globalClassNameIdsByName.PortletDocumentlibraryModelDLFileEntryMetadata.id =	e[2];
				globalClassNameIdsByName.PortletDocumentlibraryUtilRawMetadataProcessor.id =	e[3];
				globalClassNameIdsByName.PortletDynamicdatalistsModelDDLRecordSet.id =			e[4];
				globalClassNameIdsByName.PortletJournalModelJournalArticle.id =					e[5];
				globalClassNameIdsByName.PortalModelUser.id =									e[6];
				globalClassNameIdsByName.PortalModelGroup.id =									e[7];
				globalClassNameIdsByName.PortalModelOrganization.id =							e[8];
				globalClassNameIdsByName.PortalModelCompany.id =								e[9];
				
				saveToCache(globalClassNameIdsByName, fixed.cacheClassNameIdsByName);


				// Create a copy of the object but with id as key.
				var classNames = _.keys(globalClassNameIdsByName);
				for (var x = 0; x < classNames.length; ++x) {
					globalClassNameIdsById[globalClassNameIdsByName[classNames[x]].id] = {
						"friendlyName": globalClassNameIdsByName[classNames[x]].friendlyName,
						"filesPath": globalClassNameIdsByName[classNames[x]].filesPath,
						"className": classNames[x]
					};
				}

				saveToCache(globalClassNameIdsById, fixed.cacheClassNameIdsById);
			});
}


/** ************************************************************************ *\
 * 
 * STRUCTURES
 * 
\** ************************************************************************ */
function getStructuresFromListOfSites() {
	writeToScreen('Downloading structures', SEVERITY_NORMAL, SCREEN_PRINT_INFO);

	var sitesList = [];
	var i;
	for (i = 0; i < globalSites.length; ++i) {
		sitesList.push(globalSites[i].groupId);
	}

	return getData('{"/ddmstructure/get-structures": {"groupIds": [' + sitesList.join() + ']}}').then(
		function (e) {
 
			// Remove every entry (therer is only 1) with className 
			// 'PortletDocumentlibraryUtilRawMetadataProcessor'. 
			// This is a Liferay internal structure which is used to parse 
			// document metadata and display it in the Document and Media Portlet.
			e = e.filter(function(entry) {
				return entry.classNameId != globalClassNameIdsByName.PortletDocumentlibraryUtilRawMetadataProcessor.id;
			});
     
			globalStructures = e;
			saveToCache(globalStructures, fixed.cacheStructuresFilename);

			// Save a list of all the sites which have Structures.
			for (i = 0; i < e.length; ++i) {
				if (globalSitesWithStructure.indexOf(e[i].groupId) < 0) {
					globalSitesWithStructure.push(e[i].groupId);
				}
			}
			saveToCache(globalSitesWithStructure, fixed.cacheSitesWithStructuresFilename);
		});
}


/** ************************************************************************ *\
 * 
 * CREATE / SELECT PROJECT
 * 
\** ************************************************************************ */

function selectProject() {

	if (stepping.hasProject) {
		// If project is supplied in arguments
		var projectSettingsPath = fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + argv.p.toLowerCase() + '.json';
		if (fs.existsSync(projectSettingsPath)) {
			loadProject(argv.p.toLowerCase() + '.json');
		} else {
			lrException('Project \'' + argv.p + '\' does not exist.');
		}

	} else {
		// If project is not supploed in arguments
		var globOptions = {
			cwd: fixed.settingsFolder + '/' + fixed.projectsFolder
		};

		glob('*.json', globOptions, function (err, files) {
			if(err) {
				lrException(err);
			}

			if (files.length === 0) {
				console.log();
				console.log(heading('Looks like it\'s the first time you run this App'));
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
					projectName = filenameAndPathToFilename(files[i]);
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
						loadProject(answers.selectProject);
					}
				});

			}

		});

	}
		
}

function loadProject(projectJson) {
	fs.readJson(fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + projectJson, function(er, project) {
		if(er) {
			lrException(er);
		}

		var hosts = [];

		try {
			config.filesFolder = project.filesPath;
			
			// Check if user supplied a project as an argument or if we should present a gui.
			if (stepping.hasProject) {
				if (project.hosts.length === 1) {
					// If user supplied a project and there's only one server in the config
					// load that config
					config.host			= project.hosts[0].host;
					config.username		= project.hosts[0].username;
					config.password		= project.hosts[0].password;
				} else {
					// If the user supplied a project but there's more than one,
					// server in the config file, check if the user also supplied an
					// argument for which server to use.
					if (stepping.hasServer === true) {
						var currentServer = project.hosts.filter(function(server) {
							return server.name === argv.s;
						});

						if (currentServer.length > 0) {
							config.host			= currentServer[0].host;
							config.username		= currentServer[0].username;
							config.password		= currentServer[0].password;
						} else {
							lrException('Server \'' + argv.s + '\' does not exist');
						}
					} else {
						lrException('If a project (-p) with more than one server is supplied\nyou need to supply a server (-s) as well');
					}

				}
			} else {
				if (project.hosts.length === 1) {
					config.host			= project.hosts[0].host;
					config.username		= project.hosts[0].username;
					config.password		= project.hosts[0].password;
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
						config.host			= answers.host;
						config.username		= answers.username;
						config.password		= answers.password;
					});
				}
			}

		} catch(catchErr) {
			lrException('Could not understand content of config file ' + fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + projectJson);
		}

	});
}

function createProject() {

	var hostsOut = [];
	var retValue = true;

	console.log();
	console.log(heading('Initializing a New Project'));
	console.log('    Need some data to set up the project:');
	console.log('    - Project Name. You\'ll use this every time you run the script. Pick something short.');
	console.log('    - A path to where to save DDM files (structures, templates, etc) on your local machine ');
	console.log('      This is the folder you want to check-in to your version control system.');
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
					if (fs.existsSync(fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + value.toLowerCase() + '.json')) {
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
				return removeTrailingSlash(value);
			}
		}
	];

	// Ask Project Questions
	inquirer.prompt( questionsProject, function(answersProject) {

		console.log();
		console.log(heading('Add your first server'));
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
					return removeTrailingSlash(value.trim());
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
				writeToScreen('Testing connection', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
				getData('{"/portal/get-build-number": {}}', answersHosts.host, answersHosts.username, answersHosts.password)
				.then(function (e) {
					writeToScreen('Connection okay!', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
					// Resolve Promise if connection Works
					deferred.resolve();
				}, function (e) {
					// If connection didn't work, ask if user want's to save it anyway.
					writeToScreen('Could not establish connection (' + e + ')', SEVERITY_NORMAL, SCREEN_PRINT_ERROR);

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
							writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
							writeToScreen('Previously entered values within parentheses\nJust press <enter> if you want to leave the field unchanged', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
							writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_INFO);

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
				.done(function (e) {
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
							console.log(heading('Add your ') + clc.yellow(stringifyNumber(hostsOut.length + 1)) + heading(' server') );
							console.log();
							askForHosts();
						} else {
							// If the user don't want to add another server, save the configuration to file
							// and send the user to the 'Select Projects' screen.
							answersProject.hosts = hostsOut;
							fs.outputFileSync(fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + answersProject.projectName.toLowerCase() + '.json', JSON.stringify(answersProject, null, "  "));
							writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_SAVE);
							writeToScreen('Project created!', SEVERITY_NORMAL, SCREEN_PRINT_SAVE);
							writeToScreen('', SEVERITY_NORMAL, SCREEN_PRINT_SAVE);
							selectProject();
						}
					});
				});
			});
		}
		// ask for Hosts the first time.
		askForHosts();
	});
}

/** ************************************************************************ *\
 * 
 * Bits 'n' Pieces
 * 
\** ************************************************************************ */

function removeTrailingSlash(str) {
	if (str.charAt(str.length - 1) == "/") str = str.substr(0, str.length - 1);
	return str;
}

function filenameAndPathToFilename(path, showExtension) {
	showExtension = typeof showExtension !== 'undefined' ? showExtension : false;
	path = path.substr(path.lastIndexOf('/')+1);
	if (!showExtension && path.indexOf('.') > 0) {
		path = path.substr(0, path.lastIndexOf('.'));
	}
	return path;
}

function stringifyNumber(n) {
	var special = ['zeroth','first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelvth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];
	var deca = ['twent', 'thirt', 'fourt', 'fift', 'sixt', 'sevent', 'eight', 'ninet'];
	if (n < 20) return special[n];
	if (n%10 === 0) return deca[Math.floor(n/10)-2] + 'ieth';
	return deca[Math.floor(n/10)-2] + 'y-' + special[n%10];
}


function clearCache() {
	fs.removeSync(fixed.cacheFolder);
}

function writeToScreen(str, severity, type) {

	if (severity >= debugLevel) {
		if (type == SCREEN_PRINT_INFO) {
			console.log(str);
		} else if (type == SCREEN_PRINT_SAVE) {
			console.log(clc.green(str));
		} else if (type == SCREEN_PRINT_HEADING) {
			console.log(clc.blue(str));			
		} else if (type == SCREEN_PRINT_ERROR) {
			console.log(clc.red(str));
		} else {
			console.log(str);
		}
	}
}

function valueExistsInObj(haystack, needle) {
	if (haystack.indexOf(needle) > -1) {
		return true;
	} else {
		return false;
	}
}

function getData(api, lrHost, lrUser, lrPass){

	cli.spinner(clc.blue(fixed.txtWorking));

	var deferred = Q.defer();
	var errStr;

	lrHost = typeof lrHost !== 'undefined' ? lrHost : config.host;
	lrUser = typeof lrUser !== 'undefined' ? lrUser : config.username;
	lrPass = typeof lrPass !== 'undefined' ? lrPass : config.password;

	lrHost = lrHost + fixed.apiPath;

	writeToScreen('Requesting data (from server ' + lrHost + '):\n' + api , SEVERITY_DEBUG, SCREEN_PRINT_INFO);
	var lrResException;

	request
		.post(lrHost)
		.set('Content-Type', 'application/json')
		.auth(lrUser, lrPass)
		.send(api)
		.end(function(err, res){

			cli.spinner('', true);

			if (err) {
				if (err.code === 'ENOTFOUND') { errStr = 'Host not found'; }
				else if (err.code === 'ECONNREFUSED') { errStr = 'Connection refused'; }
				else if (err.code === 'EHOSTUNREACH') { errStr = 'No route to host'; }
				else { errStr = 'Unknown error: ' + JSON.stringify(err); }
				return deferred.reject(errStr);
			}

			if (res.ok) {
				if(isJson(res.text)) {
					if(res.body.hasOwnProperty('exception')){
						if(res.body.exception === 'Authenticated access required') {
							deferred.reject('Could not authenticate (check username/password)');
						} else {
							deferred.reject(res.body.exception);
						}

					} else {
						deferred.resolve(res.body);
					}
				} else {
					deferred.reject('Connected to server but response is not JSON');
				}
			} else {

				if(res.statusCode == '404') { errStr = '(Not Found)'; }
				else { errStr =''; }

				errStr = 'Error ' + res.statusCode + ' ' + errStr;

				deferred.reject(errStr);
			}
		});
	return deferred.promise;
}

function doneFulfilled() {
	writeToScreen('All done', SEVERITY_NORMAL, SCREEN_PRINT_INFO);
}

function doneRejected(e) {
	writeToScreen('Error', SEVERITY_NORMAL, SCREEN_PRINT_ERROR);
	writeToScreen(e, SEVERITY_NORMAL, SCREEN_PRINT_ERROR);
}

function lrException(e) {

	var errCode = "";
	if(typeof e === 'object') {
		try {
			errCode = e.code;
		} catch(thisErr) {
			errStr = JSON.stringify(e);
		}
	} else {
		errStr = e;
	}

	if (errCode === 'ENOENT') { errStr = 'No such file or folder'; }

	writeToScreen('Error', SEVERITY_NORMAL, SCREEN_PRINT_ERROR);
	writeToScreen(errStr, SEVERITY_NORMAL, SCREEN_PRINT_ERROR);
	process.exit();
}

function isJson(text) {
	if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
	replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
	replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
		return true;
	}else{
		return false;
	}
}
