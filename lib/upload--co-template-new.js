"use strict";

var Q           					= require('q');
var inquirer						= require("inquirer");
var _								= require('underscore');

var Constants   					= require('./SingleConstants.js');
var utilities						= require('./utilities.js');
var LrClassNameConfig				= require('./SingleLrClassNameConfig.js');
var globalSites						= require('./SingleSites.js');


// FIGURE OUT WHICH SITE WE'RE GOING TO CREATE THE TEMPLATE AT.
// TO DO SO, WE CHECK WHICH SITES HAVE STRUCTURES OF THE RIGHT TYPE,
// IF THERE'S MORE THAN ONE, WE ASK THE USER WHICH SITE S/HE WANT TO
// UPLOAD THE TEMPLATE TO.
function getSite (validStructures, fileFriendlyName, className, isADT, returnObj) {
	var deferred = Q.defer();

	var possibleSites = [];
	var questionsSites = [];


	if (isADT) { // if template is an ADT, the use may choose to upload to _any_ group.
		globalSites.fetch().forEach(function(entry) {
			if(LrClassNameConfig.getSingleValue('id', entry.classNameId, 'containsDDMs')) {
				possibleSites.push(entry.groupId)
			}
		});
	} else { // If something else than an ADT the use may only choose upload to a group with a corresponding structure.
		validStructures.forEach(function (entry) {
			possibleSites.push(entry.groupId);
		});
		possibleSites = _.unique(possibleSites);
	}

	if (possibleSites.length === 0) {
		returnObj.exception = 'Could not find any sites to upload the file to';
		deferred.reject(returnObj);
	} else if (possibleSites.length === 1) {
		deferred.resolve({site: possibleSites[0], autofound: true});
	} else {
		// MORE THAN ONE POSSIBLE SITE
		// ASK THE USER WHICH SITE S/HE WANT TO UPLOAD THE TEMPLATE TO
		// Create Question Array:
		possibleSites.forEach(function(entry) {
			questionsSites.push({
				name: globalSites.getSingleValue('groupId', entry, 'name') + ' [' + LrClassNameConfig.getSingleValue('id', globalSites.getSingleValue('groupId', entry, 'classNameId'), 'friendlyName')+ ']',
				value: entry
			});
		});

		utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen('Need some input on file: ', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
		utilities.writeToScreen('\'' + fileFriendlyName + '\' (Template to Structure \'' + className + '\')', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_FILE'));
		utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));

		inquirer.prompt([
			{
				type: "list",
				name: "siteSelection",
				message: "Which site do you want to add the template to",
				choices: questionsSites
			}
		], function(answersSite) {
			deferred.resolve({site: answersSite.siteSelection, autofound: false});
		});
	}
	return deferred.promise;
}



// FIGURE OUT WHICH STRUCTURE WE'RE GOING TO BIND THE TEMPLATE TO.
function getStructure (validStructures, fileFriendlyName, className, currentSite, autofoundSite, isADT, returnObj) {
	var deferred = Q.defer();

	if (isADT) { // Don't try to find a structure if it's an ADT.
		deferred.resolve({
			structure: {},
			site: currentSite,
			autofoundSite: autofoundSite,
			autofoundStructure: false
		});
		return deferred.promise;
	}

	var questionsStructure = [];

	var possibleStructures = validStructures.filter(function (entry) {
		return entry.groupId === currentSite;
	});

	if (possibleStructures.length === 0) {
		returnObj.exception = 'No structures available to bind the template to';
		deferred.reject(returnObj);
	} else if (possibleStructures.length === 1) {
		utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen('Automagically linking new template to structure:\n\'' + fileFriendlyName + '\' ==> \'' + possibleStructures[0].nameCurrentValue + '\'', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_FILE'));
		utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
		deferred.resolve({
			structure: possibleStructures[0],
			site: currentSite,
			autofoundSite: autofoundSite,
			autofoundStructure: true
		});
	} else {
		// MORE THAN ONE POSSIBLE STRUCTURE
		// ASK THE USER WHICH SITE S/HE WANT TO UPLOAD THE TEMPLATE TO
		// Create Question Array:
		possibleStructures.forEach(function(entry) {
			questionsStructure.push({
				name: entry.nameCurrentValue,
				value: entry
			});
		});


		if (autofoundSite) {
			utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
			utilities.writeToScreen('Need some input on file: ', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
			utilities.writeToScreen('\'' + fileFriendlyName + '\' (Template to Structure \'' + className + '\')', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_FILE'));
			utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
		}

		inquirer.prompt([
			{
				type: "list",
				name: "structureSelection",
				message: "Which structure do you want to connect the template to",
				choices: questionsStructure
			}
		], function(answerStructure) {
			deferred.resolve({
				structure: answerStructure.structureSelection,
				site: currentSite,
				autofoundSite: autofoundSite,
				autofoundStructure: false
			});
		});
	}



	return deferred.promise;
}



var createUploadObject = function (newObj) {

	var PortletKeys                     = require("./SinglePortletKeys.js");
	var globalStructures				= require('./SingleStructures.js');

	var deferred = Q.defer();
	var payload = {};

	var listSites						= globalSites.fetch();

	var returnObj = {
		exceptionFile: newObj.file,
		group: {}
	};


	getSite(newObj.validStructures, newObj.fileFriendlyName, newObj.className, newObj.isADT, returnObj)
		.then(function (currentSite) {

			getStructure(newObj.validStructures, newObj.fileFriendlyName, newObj.className, currentSite.site, currentSite.autofound, newObj.isADT, returnObj)
			.then(function (currentSiteAndStructure) {

				// Set some values in our return object to be able to do a nice print to the user.
				returnObj.group.description		= globalSites.getSingleValue('groupId', currentSiteAndStructure.site, 'description');
				returnObj.group.name			= globalSites.getSingleValue('groupId', currentSiteAndStructure.site, 'name');
				returnObj.group.type			= LrClassNameConfig.getSingleValue('id', globalSites.getSingleValue('groupId', currentSiteAndStructure.site, 'classNameId'), 'friendlyName');
				returnObj.group.friendlyURL		= globalSites.getSingleValue('groupId', currentSiteAndStructure.site, 'friendlyURL');
				returnObj.group.groupId			= currentSiteAndStructure.site;

				returnObj.status = 'create';
				returnObj.isTemplate = true;
				returnObj.fileFriendlyName = newObj.fileFriendlyName;

				// Set some things differenly on ADTs
				var classPK = currentSiteAndStructure.structure.structureId;
				var classNameId = newObj.classNameId;
				var refererPortletName = '';
				if (newObj.isADT) {
					classPK = 0;
					classNameId = newObj.validStructuresClassNameId
					returnObj.className = LrClassNameConfig.getSingleValue('id', classNameId, 'friendlyName');
					refererPortletName = PortletKeys.fetch('PORTLET_DISPLAY_TEMPLATES');
					returnObj.isADT = true;
				} else {
					returnObj.className = currentSiteAndStructure.structure.nameCurrentValue;
					refererPortletName = PortletKeys.fetch('JOURNAL');
				}

				// Create Payload
				payload = {
					groupId: currentSiteAndStructure.site,
					classNameId: classNameId,
					classPK: classPK,
					nameMap: utilities.strToJsonMap(newObj.fileFriendlyName),
					descriptionMap: {},
					type: 'display',
					mode: '',
					language: newObj.fileLanguageType,
					script: newObj.newScript,
					'+serviceContext': 'com.liferay.portal.service.ServiceContext',
					'serviceContext.addGroupPermissions': true,
					'serviceContext.addGuestPermissions': true,
					'serviceContext.attributes': { refererPortletName: refererPortletName }
				};

				returnObj.payload = '{"/ddmtemplate/add-template": ' + JSON.stringify(payload) + '}';

				deferred.resolve(returnObj);

			}, function (er) {
				deferred.reject(er);
			});

		}, function (er) {
			deferred.reject(er);
		});

	return deferred.promise;

};

module.exports = createUploadObject;