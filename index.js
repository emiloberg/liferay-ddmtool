/**
 * TODO:
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

// Localhost MOH
var config = {
	host:				'http://localhost:8080/api/jsonws/',
	username:			'test@liferay.com',
	password:			'test',
	structuresFolder:	'/Users/emiloberg/Desktop/outputtest/moh-test/wcm',
	wcmTemplatesFolder:	'/Users/emiloberg/Desktop/outputtest/moh-test/wcm',
	adtFolder:			'/Users/emiloberg/Desktop/outputtest/moh-test/adt',
	tempFolder:			'tmp',
	cacheFolder:		'cache'
};




// Colors
var error		= clc.red.bold;
var errorDesc	= clc.red;
var warn		= clc.yellow;
var info		= clc.blue;
var good		= clc.green;

// Globals
var globalSites					= [];
var globalSitesWithStructure	= [];

var globalADTClassNameId		= 0;
var globalWCMClassNameId		= 0;

var globalStructures			= [];
var globalWCMTemplates			= [];
var globalADTTemplates			= [];

// Constansts
var fixed = {
	cacheSitesFilename:					'sites.json',
	cacheSitesWithStructuresFilename:	'siteswithstructures.json',
	cacheStructuresFilename:			'structures.json',
	cacheWCMTemplatesFilename:			'wcmtemplates.json',
	cacheADTTemplatesFilename:			'adttemplates.json',
	cacheADTClassNameId:				'adtclassnameid.json',
	cacheWCMClassNameId:				'wcmclassnameid.json'
};

mainSwitch(argv);


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
	} else if (argv.c) {
		chainReadFromCache();
	} else {
		console.dir(argv.c);
		lrException('No valid argument');
	}
}

function chainReadFromCache() {
	console.log(info('Running \'chainReadFromCache\''));
	initPromise()
	.then(getAllCache)
	.then(showMainMenu)
	.done(doneFulfilled, doneRejected);
}

// Promise Chain
//getData('group/get-user-sites')
function chainFetch() {
	return Q.resolve()
	.then(getUserSites)
	.then(handleGetUserSites)
	.then(getCompanyGroupFromCompanyId)
	.then(handleGetCompanyGroupFromCompanyId)


	.then(getStructuresFromListOfSites)
	.then(handleGetStructuresFromListOfSites)

	.then(getADTClassNameId)
	.then(handleGetADTClassNameId)

	.then(getWCMClassNameId)
	.then(handleGetWCMClassNameId)

	.then(getWCMTemplates)
	.then(handleGetWCMTemplates)

	.then(getADTs)
	.then(handleGetADTs)

	.then(saveStructuresToFile)
	.then(saveWCMTemplatesToFile)
	.then(saveADTTemplatesToFile)

	.then(nextThing)

	.done(doneFulfilled, doneRejected);
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
	return fs.readJsonSync(config.cacheFolder + '/' + filename);
}

function saveToCache(e, filename) {
	console.log(info('Running \'saveToCache\''));
	fs.outputFileSync(config.cacheFolder + '/' + filename, JSON.stringify(e));
}

/**
 * Save to File
 *
 */
function saveADTTemplatesToFile() {
	console.log(info('Running \'saveADTTemplatesToFile\''));
	saveToFile(globalADTTemplates, 'adt', config.adtFolder);
}


function saveWCMTemplatesToFile() {
	console.log(info('Running \'saveWCMTemplatesToFile\''));
	saveToFile(globalWCMTemplates, 'template', config.wcmTemplatesFolder);
}

function saveStructuresToFile() {
	console.log(info('Running \'saveStructuresToFile\''));
	saveToFile(globalStructures, 'structure', config.structuresFolder);
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
	console.log(info('Running \'getUserSites\''));
	return getData('group/get-user-sites');
}

function handleGetUserSites(e){
	console.log(info('Running \'handleGetUserSites\''));
	var resp = JSON.parse(e);
	if(resp.length === 0) {
		throw Error('Could not find any sites');
	} else {
		globalSites = resp;
		return resp[0].companyId;
	}
}

function getCompanyGroupFromCompanyId(e) {
	console.log(info('Running \'getCompanyGroupFromCompanyId\''));
	return getData('group/get-company-group/company-id/' + e);
}

function handleGetCompanyGroupFromCompanyId(e) {
	console.log(info('Running \'handleGetCompanyGroupFromCompanyId\''));

	// Dirty way of adding the global site to the list of sites.
	globalSites = JSON.parse('{"sites": [' + JSON.stringify(globalSites).substr(1).slice(0, -1) + ',' + e + '] }');

	saveToCache(globalSites, fixed.cacheSitesFilename);

	return globalSites;
}




/** ************************************************************************ *\
 * 
 * ADTs
 * 
\** ************************************************************************ */
function getADTs() {
	console.log(info('Running \'getADTs\''));
	var res = [];
	var api;
	var i;

	for (i = 0; i < globalSites.sites.length; ++i) {
		api = 'ddmtemplate/get-templates/group-id/' + globalSites.sites[i].groupId + '/class-name-id/' + globalADTClassNameId;
		res[i] = getData(api);
	}

	return Q.all(res);
}

function handleGetADTs(e) {
	var i;
	var x;
	var curTemplate;
	for (i = 0; i < e.length; ++i) {
		curTemplate = JSON.parse(e[i]);
		for (x = 0; x < curTemplate.length; ++x) {
			globalADTTemplates.push(curTemplate[x]);
		}
	}

	saveToCache(globalADTTemplates, fixed.cacheADTTemplatesFilename);

	return globalADTTemplates;
}

/** ************************************************************************ *\
 * 
 * WCM
 * 
\** ************************************************************************ */
function getWCMTemplates() {
	console.log(info('Running \'getWCMTemplates\''));
	var res = [];
	var api;
	var i;

	// The commented-out loop below will loop *all* the sites and do a separate api call
	// for every Liferay site. This will take a long time if there are lots of sites.
	// Instead we should be able to just loop the sites which have structures.
	// No structure - no template.
	//	for (i = 0; i < globalSites.sites.length; ++i) {
	//		api = 'ddmtemplate/get-templates/group-id/' + globalSites.sites[i].groupId + '/class-name-id/' + globalWCMClassNameId;
	//		res[i] = getData(api);
	//	}
	for (i = 0; i < globalSitesWithStructure.length; ++i) {
		api = 'ddmtemplate/get-templates/group-id/' + globalSitesWithStructure[i] + '/class-name-id/' + globalWCMClassNameId;
		res[i] = getData(api);
	}

	return Q.all(res);
}

function handleGetWCMTemplates(e) {
	var i;
	var x;
	var curTemplate;
	for (i = 0; i < e.length; ++i) {
		curTemplate = JSON.parse(e[i]);
		for (x = 0; x < curTemplate.length; ++x) {
			globalWCMTemplates.push(curTemplate[x]);
		}
	}

	saveToCache(globalWCMTemplates, fixed.cacheWCMTemplatesFilename);

	return globalWCMTemplates;
}

/** ************************************************************************ *\
 * 
 * CLASS NAME IDS
 * 
\** ************************************************************************ */
function getADTClassNameId() {
	console.log(info('Running \'getADTClassNameId\''));
	return getData('classname/fetch-class-name-id/clazz/com.liferay.portlet.asset.model.AssetEntry');
}

function handleGetADTClassNameId(e) {
	globalADTClassNameId = e;
	saveToCache(e, fixed.cacheADTClassNameId);
}

function getWCMClassNameId() {
	console.log(info('Running \'getWCMClassNameId\''));
	return getData('classname/fetch-class-name-id/clazz/com.liferay.portlet.dynamicdatamapping.model.DDMStructure');
}

function handleGetWCMClassNameId(e) {
	globalWCMClassNameId = e;
	saveToCache(e, fixed.cacheWCMClassNameId);
}

/** ************************************************************************ *\
 * 
 * STRUCTURES
 * 
\** ************************************************************************ */
function getStructuresFromListOfSites(e) {
	console.log(info('Running \'getStructuresFromListOfSites\''));

	var sitesList = '';
	var i;
	for (i = 0; i < e.sites.length; ++i) {
		sitesList += '%2C' + e.sites[i].groupId;
	}

	sitesList = sitesList.substr(3);

	return getData('ddmstructure/get-structures/group-ids/' + sitesList);
}

function handleGetStructuresFromListOfSites(e) {
	console.log(info('Running \'handleGetStructuresFromListOfSites\''));

	var ret;
	ret = JSON.parse(e);
	globalStructures = ret;

	// Save a list of all the sites which have Structures.
	var i;
	for (i = 0; i < ret.length; ++i) {
		if (globalSitesWithStructure.indexOf(ret[i].groupId) < 0) {
			globalSitesWithStructure.push(ret[i].groupId);
		}
	}
	
	saveToCache(globalSitesWithStructure, fixed.cacheSitesWithStructuresFilename);
	saveToCache(globalStructures, fixed.cacheStructuresFilename);

	return ret;
}


/** ************************************************************************ *\
 * 
 * Bits 'n' Pieces
 * 
\** ************************************************************************ */

function valueExistsInObj(haystack, needle) {
	if (haystack.indexOf(needle) > -1) {
		return true;
	} else {
		return false;
	}
}

function getData(api){
	var deferred = Q.defer();

	console.log(info('Running \'getData\' with call ') + api + ' from server ' + config.host);
	var lrResException;

	request
		//apa
		.get(config.host + api)
//		 .post(config.host)
//  		.send({ name: 'Manny', species: 'cat' })
		.auth(config.username, config.password)
		.end(function(res){
			if (res.ok) {
				if(isJson(res.text)) {
					lrResException = JSON.parse(res.text);
					if(lrResException.hasOwnProperty('exception')){
						deferred.reject(lrResException.exception);
					} else {
						deferred.resolve(res.text);
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
