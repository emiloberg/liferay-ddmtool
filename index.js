/**
 * GOOD THINGS:
 * XML Parser: https://www.npmjs.org/package/xml2js
 *
 *
 *
 * TODO:
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

var clc			= require('cli-color');
var Promise		= require('bluebird');

var _			= require('underscore');

var argv		= require('minimist')(process.argv.slice(2));
var inquirer	= require("inquirer");


var cli			= require('cli');
var nprint		= require('node-print');



var heading = clc.blue;

// Localhost MOH
var config = {
	host:				'http://localhost:8080/api/jsonws/invoke',
	username:			'test@liferay.com',
	password:			'test',
	filesFolder:		'/Users/emiloberg/Desktop/outputtest/new'
};

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
// 	host:				'http://localhost:8080/api/jsonws/',
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

	txtWorking:							'Working...'
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
		"filesPath": 'document_and_media/document_types',
		"friendlyName": 'Document Types'
	},
	PortletDocumentlibraryUtilRawMetadataProcessor: {
		"filesPath": 'TODO_something_with_document_metadata',
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




// Debug things
var debugLevel			= 0;

var SEVERITY_NORMAL		= 0;
var SEVERITY_DEBUG		= -1;
var SCREEN_PRINT_INFO	= 0;
var SCREEN_PRINT_SAVE	= 1;
var SCREEN_PRINT_ERROR	= 2;


mainSwitch(argv);

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

function createProject() {
	console.log();
	console.log(heading('Initializing a New Project'));
	console.log('    Need some data to set up the project:');
	console.log('    - Project Name. You\'ll use this every time you run the script. Pick something short.');
	console.log('    - The URL, Username and Password to a Liferay Server (URL may be localhost)');
	console.log('    - A path to where to save DDM files (structures, templates, etc) on your local machine ');
	console.log('      This is the folder you want to check-in to your version control system.');
	console.log();

	var questions = [
		{
			type: "input",
			name: "projectName",
			message: "Project (Short) Name",
			validate: function( value ) {
				var pass = value.match(/^[a-z]{1,8}$/i);
				if (pass) {
					// TODO, CHECK HERE IF FILE ALREADY EXIST

					if (fs.existsSync(fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + value.toLowerCase() + '.json')) {
						return "Project named '" + value + "' already exists";
					} else {
						return true;
					}
				} else {
					return "Project name must be maximum 10 characters and only contain A-Z, 0-9";
				}
			}
		},
		{
			type: "input",
			name: "host",
			message: "Liferay Host (URL):"
		},
		{
			type: "input",
			name: "username",
			message: "Lifray Username"
		},
		{
			type: "input",
			name: "password",
			message: "Liferay Password"
		},
		{
			type: "input",
			name: "filesPath",
			message: "Path to files on this machine"
			//TODO: CHECK IF PATH EXISTS, IF NOT, MAYBE ASK IF WE SHOULD CREATE IT
		}
	];

	inquirer.prompt( questions, function(answers) {
		fs.outputFileSync(fixed.settingsFolder + '/' + fixed.projectsFolder + '/' + answers.projectName.toLowerCase() + '.json', JSON.stringify(answers, null, "  "));
});


}

function mainSwitch(argv) {

	createProject();
//	if (argv.p) {
//		console.log(argv.p);
//	}

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
 * SETTINGS
 * 
\** ************************************************************************ */

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
				filePath = config.filesFolder + '/' + globalClassNameIdsById[e[i].classNameId].filesPath + '/' + e[i].nameCurrentValue + '.' + e[i].storageType;
				fileContent = e[i].xsd;
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
						"type": classNames[x]
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
 * Bits 'n' Pieces
 * 
\** ************************************************************************ */

function clearCache() {
	fs.removeSync(fixed.cacheFolder);
}

function writeToScreen(str, severity, type) {

	if (severity >= debugLevel) {
		if (type == SCREEN_PRINT_INFO) {
			console.log(clc.blue(str));
		} else if (type == SCREEN_PRINT_SAVE) {
			console.log(clc.green(str));
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

function getData(api){

	cli.spinner(clc.blue(fixed.txtWorking));

	var deferred = Q.defer();

	writeToScreen('Requesting data (from server ' + config.host + '):\n' + api , SEVERITY_DEBUG, SCREEN_PRINT_INFO);
	var lrResException;

	request
		.post(config.host)
		.set('Content-Type', 'application/json')
		.auth(config.username, config.password)
		.send(api)
		.end(function(res){
			if (res.ok) {
				if(isJson(res.text)) {
					if(res.body.hasOwnProperty('exception')){
						deferred.reject(res.body.exception);
					} else {
						cli.spinner('', true);
						deferred.resolve(res.body);
					}
				} else {
					deferred.reject('Connected to server but response is not JSON');
				}
			} else {
				deferred.reject(res.text);
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
	writeToScreen('Error', SEVERITY_NORMAL, SCREEN_PRINT_ERROR);
	writeToScreen(e, SEVERITY_NORMAL, SCREEN_PRINT_ERROR);
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
