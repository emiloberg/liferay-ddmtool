"use strict";

var Q           					= require('q');
var inquirer						= require("inquirer");
var _								= require('underscore');

var Constants   					= require('./Constants.js');
var utilities						= require('./utilities.js');
var LrClassNameConfig				= require('./ClassNameConfig.js');
var Sites							= require('./Sites.js');


// FIGURE OUT WHICH SITE WE'RE GOING TO CREATE THE STRUCTURE
// IF THERE'S MORE THAN ONE, WE ASK THE USER WHICH SITE S/HE WANT TO
// UPLOAD THE TEMPLATE TO.
function getSite (newObj, returnObj) {

	var deferred = Q.defer();

	var possibleSites = [];
	var questionsSites = [];

	Sites.fetch().forEach(function(entry) {
		if(LrClassNameConfig.getSingleValue('id', entry.classNameId, 'containsDDMs')) {
			possibleSites.push(entry.groupId)
		}
	});

	if (possibleSites.length === 0) {
		returnObj.exception = 'Could not find any sites to upload the file to';
		deferred.reject(returnObj);
	} else if (possibleSites.length === 1) {
		deferred.resolve({site: possibleSites[0], autofound: true});
	} else {
		// MORE THAN ONE POSSIBLE SITE
		// ASK THE USER WHICH SITE S/HE WANT TO UPLOAD THE STRUCTURE TO
		// Create Question Array:
		possibleSites.forEach(function(entry) {
			questionsSites.push({
				name: Sites.getSingleValue('groupId', entry, 'name') + ' [' + LrClassNameConfig.getSingleValue('id', Sites.getSingleValue('groupId', entry, 'classNameId'), 'friendlyName')+ ']',
				value: entry
			});
		});

		utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen('Need some input on file: ', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
		utilities.writeToScreen('\'' + newObj.fileFriendlyName + '\' (Structure of Type: \'' + LrClassNameConfig.getSingleValue('id', newObj.classNameId, 'friendlyName') + '\')', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_FILE'));
		utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));

		inquirer.prompt([
			{
				type: "list",
				name: "siteSelection",
				message: "Which site do you want to add the structure to",
				choices: questionsSites
			}
		], function(answersSite) {
			deferred.resolve({site: answersSite.siteSelection, autofound: false});
		});
	}
	return deferred.promise;
}



var createUploadObject = function (newObj) {

	var PortletKeys                     = require("./PortletKeys.js");

	var deferred = Q.defer();
	var payload = {};

	var returnObj = {
		exceptionFile: newObj.file,
		group: {}
	};

	getSite(newObj, returnObj)
		.then(function (currentSite) {


			returnObj.group.description		= Sites.getSingleValue('groupId', currentSite.site, 'description');
			returnObj.group.name			= Sites.getSingleValue('groupId', currentSite.site, 'name');
			returnObj.group.type			= LrClassNameConfig.getSingleValue('id', Sites.getSingleValue('groupId', currentSite.site, 'classNameId'), 'friendlyName');
			returnObj.group.friendlyURL		= Sites.getSingleValue('groupId', currentSite.site, 'friendlyURL');
			returnObj.group.groupId			= currentSite.site;

			returnObj.status = 'create';
			returnObj.isStructure = true;
			returnObj.fileFriendlyName = newObj.fileFriendlyName;
			returnObj.className = LrClassNameConfig.getSingleValue('id', newObj.classNameId, 'friendlyName');

			payload = {
				groupId: currentSite.site, 										//long
				parentStructureId: 0, 											//long
				classNameId: newObj.classNameId , 								//long
				structureKey: '', 												//java.lang.String
				nameMap: utilities.strToJsonMap(newObj.fileFriendlyName), 		//java.util.Map
				descriptionMap: {}, 											//java.util.Map
				xsd: newObj.newScript, 											//java.lang.String
				storageType: newObj.fileLanguageType, 							//java.lang.String
				type: newObj.toPayload.type, 									//int
				'+serviceContext': 'com.liferay.portal.service.ServiceContext',
				'serviceContext.addGroupPermissions': true,
				'serviceContext.addGuestPermissions': true,
				'serviceContext.attributes': { refererPortletName: PortletKeys.fetch('JOURNAL') }
			};

			returnObj.payload = '{"/ddmstructure/add-structure": ' + JSON.stringify(payload) + '}';

			deferred.resolve(returnObj);

		}, function (er) {
			deferred.reject(er);
		});

	return deferred.promise;

};

module.exports = createUploadObject;
