/**
 * TODO:
 *
 *	Download all DDL structures and templates aswell
 *
 *	Don't Loop alla ADTs.
 *		Right now, the request for ADT:s will loop *all* the Liferay sites available
 *		and do a separate request for each one of them. This can take a long time if there's
 *		many sites. We need to be smarter about this. Like blacklisting, whitelisting or 
 *		finding another api call to make.
 *
 *		Could this API be used instead?
 *		http://localhost:8080/api/jsonws?signature=%2Fddmtemplate%2Fsearch-13-companyId-groupIds-classNameIds-classPKs-name-description-type-mode-language-andOperator-start-end-orderByComparator#serviceResults
 *
 *
 *
 * 		Make sure that we can separate the different types of structures. Right now
 *		it's downloading *all* kind of structures. Stuff like 'Learning Module Metadata.xml'
 *		which I've no idea where it comes from.
 *
 *
 *
 *		Current function for finding out if the app was started with a certain arguments is not
 *		that good. It will search for a key in the arguments-object and if that key exists - 
 *		do something. So far so god. However, the search function is greedy. If object contains
 *		value 'foobar', a search for 'foo' or 'bar' vill return true.
 *	
 *		Maybe just replace it with the regular process.argv.slice(2) and search that array
 *		with indexOf, or underscore's: _.indexOf(array, value) 
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


// Localhost MOH
var config = {
	host:				'http://localhost:8080/api/jsonws/invoke',
	username:			'test@liferay.com',
	password:			'test',
	structuresFolder:	'/Users/emiloberg/Desktop/outputtest/moh-test/wcm',
	wcmTemplatesFolder:	'/Users/emiloberg/Desktop/outputtest/moh-test/wcm',
	adtFolder:			'/Users/emiloberg/Desktop/outputtest/moh-test/adt',
	tempFolder:			'tmp'
};

// MOH
// var config = {
// 	host:				'http://15.126.227.132/api/jsonws/invoke',
// 	username:			'superadmin',
// 	password:			'icT@icT@1234',
// 	structuresFolder:	'/Users/emiloberg/Desktop/outputtest/moh/wcm',
// 	wcmTemplatesFolder:	'/Users/emiloberg/Desktop/outputtest/moh/wcm',
// 	adtFolder:			'/Users/emiloberg/Desktop/outputtest/moh/adt',
// 	tempFolder:			'tmp'
// };


// CYGATE FI
// var config = {
// 	host:				'http://10.167.2.160:8280/api/jsonws/',
// 	username:			'www.admin@cygate.fi',
// 	password:			'www4dm1n',
// 	structuresFolder:	'/Users/emiloberg/Desktop/outputtest/fi/wcm',
// 	wcmTemplatesFolder:	'/Users/emiloberg/Desktop/outputtest/fi/wcm',
// 	adtFolder:			'/Users/emiloberg/Desktop/outputtest/fi/adt',
// 	tempFolder:			'tmp'
// };

// LOCALHOST CYGATE
// var config = {
// 	host:				'http://localhost:8080/api/jsonws/',
// 	username:			'test@cygate.com',
// 	password:			'test',
// 	structuresFolder:	'/Users/emiloberg/Desktop/outputtest/cygate-localhost/wcm',
// 	wcmTemplatesFolder:	'/Users/emiloberg/Desktop/outputtest/cygate-localhost/wcm',
// 	adtFolder:			'/Users/emiloberg/Desktop/outputtest/cygate-localhost/adt',
// 	tempFolder:			'tmp'
// };


// Colors
var error		= clc.red.bold;
var errorDesc	= clc.red;
var warn		= clc.yellow;
var info		= clc.blue;
var good		= clc.green;

// Globals
var globalSites					= [];
var globalSitesWithStructure	= [];
var globalCompanyId				= 0;

var globalADTClassNameId		= 0;
var globalWCMClassNameId		= 0;

var globalStructures			= [];
var globalTemplates				= [];

var globalWCMTemplates			= []; // de här ska tas bort. Sök igenom koden och ta bort 
var globalADTTemplates			= []; // de här ska tas bort. Sök igenom koden och ta bort 

// Constansts
var fixed = {
	cacheSitesFilename:					'sites.json',
	cacheSitesWithStructuresFilename:	'siteswithstructures.json',
	cacheStructuresFilename:			'structures.json',
	cacheTemplatesFilename:				'templates.json',
	cacheWCMTemplatesFilename:			'wcmtemplates.json', //Ska också tas bort
	cacheADTTemplatesFilename:			'adttemplates.json', //Ska också tas bort
	cacheADTClassNameId:				'adtclassnameid.json',
	cacheWCMClassNameId:				'wcmclassnameid.json',
	cacheClassNameIds:					'classnameids.json',
	txtWorking:							'Working...',
	cacheFolder:						'cache'
};


var globalClassNameIds = {
	PortletAssetModelAssetEntry: {
		"filesPath": 'not-applicable',
		"friendlyName": 'ADT'
	},
	PortletDynamicdatamappingModelDDMStructure: {
		"filesPath": 'not-applicable',
		"friendlyName": 'All structures'
	},
	PortletDocumentlibraryModelDLFileEntryMetadata: {
		"filesPath": 'not-applicable',
		"friendlyName": 'Document Metadata'
	},
	PortletDocumentlibraryUtilRawMetadataProcessor: {
		"filesPath": 'not-applicable',
		"friendlyName": 'TODO Something with Document Metadata'
	},
	PortletDynamicdatalistsModelDDLRecordSet: {
		"filesPath": 'not-applicable',
		"friendlyName": 'DDL Data Definition'
	},
	PortletJournalModelJournalArticle: {
		"filesPath": 'not-applicable',
		"friendlyName": 'Journal Article'
	},
	PortalModelUser: {
		"filesPath": 'not-applicable',
		"friendlyName": 'User site'
	},
	PortalModelGroup: {
		"filesPath": 'not-applicable',
		"friendlyName": 'Group'
	},
	PortalModelOrganization: {
		"filesPath": 'not-applicable',
		"friendlyName": 'Organization'
	},
	PortalModelCompany: {
		"filesPath": 'not-applicable',
		"friendlyName": 'Company (Global)'
	}
};




// Debug things
var SEVERITY_NORMAL	= 0;
var SEVERITY_DEBUG	= -1;
var debugLevel		= 0;

mainSwitch(argv);

function chainFetch() {
	Q.resolve()
	.then(clearCache)
	.then(getClassNameIds)
	.then(getUserSites)
	.then(getCompanyGroupFromCompanyId)
	.then(getStructuresFromListOfSites)
	.then(getTemplates)
	.then(saveStructuresToFile)


	.done(doneFulfilled, doneRejected);
}

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



// Promise Chain
//getData('group/get-user-sites')
// function chainFetch() {
// 	return Q.resolve()
// 	.then(getUserSites)
// 	.then(handleGetUserSites)
// 	.then(getCompanyGroupFromCompanyId)
// 	.then(handleGetCompanyGroupFromCompanyId)


// 	.then(getStructuresFromListOfSites)
// 	.then(handleGetStructuresFromListOfSites)

// 	.then(getADTClassNameId)
// 	.then(handleGetADTClassNameId)

// 	.then(getWCMClassNameId)
// 	.then(handleGetWCMClassNameId)

// 	.then(getWCMTemplates)
// 	.then(handleGetWCMTemplates)

// 	.then(getADTs)
// 	.then(handleGetADTs)

// 	.then(saveStructuresToFile)
// 	.then(saveWCMTemplatesToFile)
// 	.then(saveADTTemplatesToFile)

// 	.then(nextThing)

// 	.done(doneFulfilled, doneRejected);
// }

function chainReadFromCache() {
	console.log(info('Running \'chainReadFromCache\''));
	initPromise()
	.then(getAllCache)
	.then(showMainMenu)
	.done(doneFulfilled, doneRejected);
}














function showMainMenu() {
	console.log(info('Running \'showMainMenu\''));


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

function mainSwitch(argv) {

	if (valueExistsInObj(argv._, 'fetch')) {
		chainFetch();
	} else if (valueExistsInObj(argv._, 'temp')) {
		chainTemp();
	} else if (argv.c) {
		chainReadFromCache();
	} else {
		console.dir(argv.c);
		lrException('No valid argument');
	}
}



/**
 * Cache
 *
 */

function getAllCache() {
	// Todo
	// Add error handling for missing files 
	globalSites					= readFromCache(fixed.cacheSitesFilename);
	globalSitesWithStructure	= readFromCache(fixed.cacheSitesWithStructuresFilename);

	globalADTClassNameId		= readFromCache(fixed.cacheADTClassNameId);
	globalWCMClassNameId		= readFromCache(fixed.cacheWCMClassNameId);

	globalStructures			= readFromCache(fixed.cacheStructuresFilename);
	globalWCMTemplates			= readFromCache(fixed.cacheWCMTemplatesFilename);
	globalADTTemplates			= readFromCache(fixed.cacheADTTemplatesFilename);
}

function readFromCache(filename) {
	// Todo
	// Add error handling for non json files
	console.log(info('Running \'readFromCache\''));
	return fs.readJsonSync(fixed.cacheFolder + '/' + filename);
}

function saveToCache(e, filename) {
	fs.outputFileSync(fixed.cacheFolder + '/' + filename, JSON.stringify(e));
}

/**
 * Save to File
 *
 */
// function saveADTTemplatesToFile() {
// 	console.log(info('Running \'saveADTTemplatesToFile\''));
// 	saveToFile(globalADTTemplates, 'adt', config.adtFolder);
// }


// function saveWCMTemplatesToFile() {
// 	console.log(info('Running \'saveWCMTemplatesToFile\''));
// 	saveToFile(globalWCMTemplates, 'template', config.wcmTemplatesFolder);
// }


function classNameIdTofriendlyName(classNameId) {

}

function saveStructuresToFile() {
	writeToScreen('Saving structures', SEVERITY_NORMAL);
//	saveToFile(globalStructures, 'structure', config.structuresFolder);
	saveToFileNew(globalStructures);
}

function saveToFileNew(e) {

	var file;

	classNames = _.keys(globalClassNameIds);
	var classNamesById = {};

	for (var x = 0; x < classNames.length; ++x) {
		classNamesById[globalClassNameIds[classNames[x]].id] = {
			"friendlyName": globalClassNameIds[classNames[x]].friendlyName,
			"filesPath": globalClassNameIds[classNames[x]].filesPath,
			"type": classNames[x]
		};
	}

	console.dir(classNamesById);

	for (i = 0; i < e.length; ++i) {
		console.log(e[i].classNameId);
		console.log(classNamesById[e[i].classNameId].friendlyName);
		console.log(warn('-------------'));
	}

}

function saveToFile(e, type, outputPath) {
	console.log(info('Running \'saveToFile\''));

	var i;
	var file;
	for (i = 0; i < e.length; ++i) {
		if (type == 'structure') {
			file = e[i].nameCurrentValue + '.' + e[i].storageType;
			fs.outputFileSync(outputPath + '/' + file, e[i].xsd);
		} else if (type == 'template' || type == 'adt') {
			file = e[i].nameCurrentValue + '.' + e[i].language;
			fs.outputFileSync(outputPath + '/' + file, e[i].script);
		} else {
			lrException('Incorrect type supplied');
		}
	}
	console.log(good('Saved ' + e.length + ' files (of type ' + type + ') to disc'));
}


/** ************************************************************************ *\
 * 
 * Get Complete list of Sites 
 * 
\** ************************************************************************ */
function getUserSites() {
	writeToScreen('Downloading list of sites', SEVERITY_NORMAL);
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
	writeToScreen('Downloading company site', SEVERITY_NORMAL);
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
	writeToScreen('Downloading templates', SEVERITY_NORMAL);
	var apiArr = [];

	for (var i = 0; i < globalSites.length; ++i) {
		apiArr.push('{"/ddmtemplate/get-templates": {"groupId": ' + globalSites[i].groupId + ', "classNameId": ' + globalClassNameIds.PortletAssetModelAssetEntry.id + '}}');
		apiArr.push('{"/ddmtemplate/get-templates": {"groupId": ' + globalSites[i].groupId + ', "classNameId": ' + globalClassNameIds.PortletDynamicdatamappingModelDDMStructure.id + '}}');
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
	writeToScreen('Downloading id\'s', SEVERITY_NORMAL);
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
				globalClassNameIds.PortletAssetModelAssetEntry.id =						e[0];
				globalClassNameIds.PortletDynamicdatamappingModelDDMStructure.id =		e[1];
				globalClassNameIds.PortletDocumentlibraryModelDLFileEntryMetadata.id =	e[2];
				globalClassNameIds.PortletDocumentlibraryUtilRawMetadataProcessor.id =	e[3];
				globalClassNameIds.PortletDynamicdatalistsModelDDLRecordSet.id =			e[4];
				globalClassNameIds.PortletJournalModelJournalArticle.id =					e[5];
				globalClassNameIds.PortalModelUser.id =									e[6];
				globalClassNameIds.PortalModelGroup.id =									e[7];
				globalClassNameIds.PortalModelOrganization.id =							e[8];
				globalClassNameIds.PortalModelCompany.id =								e[9];
				
				saveToCache(globalClassNameIds, fixed.cacheClassNameIds);
			});
}


/** ************************************************************************ *\
 * 
 * STRUCTURES
 * 
\** ************************************************************************ */
function getStructuresFromListOfSites() {
	writeToScreen('Downloading structures', SEVERITY_NORMAL);

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

function writeToScreen(str, severity) {

	if (severity >= debugLevel) {
		console.log(info(str));
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

	cli.spinner(info(fixed.txtWorking));

	var deferred = Q.defer();

	writeToScreen('Requesting data (from server ' + config.host + '):\n' + api , SEVERITY_DEBUG);
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
	console.log(good('Done and \'Fulfilled\''));
}

function doneRejected(e) {
	console.log(error('Done and \'Rejected\''));
	console.log(errorDesc(e));
}

function lrException(e) {
	console.log(error('Running ERRORS'));
	console.log(errorDesc(e));
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


// ########################################## COULD BE CRAP ##########################################

/* Seach in Object */

function comparator(obj, text) {
    if (obj && text && typeof obj === 'object' && typeof text === 'object') {
        for (var objKey in obj) {
            if (objKey.charAt(0) !== '$' && hasOwnProperty.call(obj, objKey) &&
                    comparator(obj[objKey], text[objKey])) {
                return true;
            }
        }
        return false;
    }
    text = ('' + text).toLowerCase();
    return ('' + obj).toLowerCase().indexOf(text) > -1;
}

function searchObject(obj, text) {
    if (typeof text == 'string' && text.charAt(0) === '!') {
        return !searchObject(obj, text.substr(1));
    }
    switch (typeof obj) {
        case "boolean":
        case "number":
        case "string":
            return comparator(obj, text);
        case "object":
            switch (typeof text) {
                case "object":
                    return comparator(obj, text);
                default:
                    for (var objKey in obj) {
                        if (objKey.charAt(0) !== '$' && searchObject(obj[objKey], text)) {
                            return true;
                        }
                    }
                    break;
            }
            return false;
        case "array":
            for (var i = 0; i < obj.length; i++) {
                if (searchObject(obj[i], text)) {
                    return true;
                }
            }
            return false;
        default:
            return false;
    }
}


// ########################################## CRAP ##########################################


function nextThing() {
	console.log(info('Running \'NEXT THING\''));
}

function getDataFunc(api) {
  return function() {
    return getData(api);
  };
}

function first() {
  var deferred = Q.defer();
  setTimeout(function() {
    console.log('First sleep');
    deferred.resolve();
  }, 1000);

  return deferred.promise;
}

function second() {
	return function() {
		var deferred = Q.defer();
		setTimeout(function() {
			console.log('Second sleep');
			deferred.resolve();
			}, 1000);

		return deferred.promise;
	}
}

function sleep(ms) {
  
  var deferred = Q.defer();
  setTimeout(function() {
    // setTimeout to resolve the deferred, which will trigger the fulfillment handler of the promise.
    console.log('sleep for ' + ms + ' ms');
    deferred.resolve();
  }, ms);
  // return the promise of the deferred.
  return deferred.promise;
}

// return a fulfillment handler which return another promise
function SleepFunc(ms) {
  return function() {
    return sleep(ms);
  };

}




// ORIGINAL WORKING CODE
/*
var Q = require('q');

function sleep(ms) {
  
  var deferred = Q.defer();
  setTimeout(function() {
    // setTimeout to resolve the deferred, which will trigger the fulfillment handler of the promise.
    console.log('sleep for ' + ms + ' ms');
    deferred.resolve();
  }, ms);
  // return the promise of the deferred.
  return deferred.promise;
}

// return a fulfillment handler which return another promise
function SleepFunc(ms) {
  return function() {
    return sleep(ms);
  };
}

// sequence 3 promises one by one
var time_start = new Date();
sleep(1000)
  .then(SleepFunc(2000))
  .then(SleepFunc(3000))
  .then(function() {
    var time_end = new Date();
    console.log('sequence complete, time cost: ' + (time_end - time_start) + ' ms');
  });

// Type `node sequence.js` to run this sample.
*/
