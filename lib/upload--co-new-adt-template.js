"use strict";

var createUploadObject = function (newScript, fileClassObj, fileName, fileLanguageType, isNewDDM, returnObj) {

	var Q           					= require('q');
	var inquirer						= require("inquirer");

	var PortletKeys                     = require("./SinglePortletKeys.js");
	var LrClassNameConfig				= require('./SingleLrClassNameConfig.js');
	var globalSites						= require('./SingleSites.js');
	var Constants   					= require('./SingleConstants.js');
	var utilities						= require('./utilities.js');

	var deferred = Q.defer();
	var payload = {};

	var listSites						= globalSites.fetch();
	var questionsSites					= [];

	// Create question: Which site do you want to upload template to.
	for (var i = 0; i < listSites.length; i++) {
		if(LrClassNameConfig.getSingleValue('id', listSites[i].classNameId,  'containsDDMs')) {
			questionsSites.push({
				name: listSites[i].name + ' [' + LrClassNameConfig.getSingleValue('id', listSites[i].classNameId, 'friendlyName') + ']',
				value: {
					groupId: listSites[i].groupId
				}
			});
		}
	}

	utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
	utilities.writeToScreen('Need some input on file: ', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
	utilities.writeToScreen('"' + returnObj.fileName + '" (Type: ' + returnObj.fileClassObj.friendlyName + ')', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_FILE'));
	utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));

	inquirer.prompt([
		{
			type: "list",
			name: "siteSelection",
			message: "Which site do you want to add the " + returnObj.fileClassObj.friendlyName + " to",
			choices: questionsSites
		}
	], function( answersSite ) {

		// Set some values in our return object to be able to do a nice print to the user.
		returnObj.group.description		= globalSites.getSingleValue('groupId', answersSite.siteSelection.groupId, 'description');
		returnObj.group.name			= globalSites.getSingleValue('groupId', answersSite.siteSelection.groupId, 'name');
		returnObj.group.type			= LrClassNameConfig.getSingleValue('id', globalSites.getSingleValue('groupId', answersSite.siteSelection.groupId, 'classNameId'), 'friendlyName');
		returnObj.group.friendlyURL		= globalSites.getSingleValue('groupId', answersSite.siteSelection.groupId, 'friendlyURL');
		returnObj.group.groupId			= answersSite.siteSelection.groupId;

		payload = {
			groupId: answersSite.siteSelection.groupId,
			classNameId: returnObj.fileClassObj.id,
			classPK: 0,
			nameMap: utilities.strToJsonMap(returnObj.fileName),
			descriptionMap: {},
			type: 'display',
			mode: '',
			language: fileLanguageType,
			script: newScript,
			'+serviceContext': 'com.liferay.portal.service.ServiceContext',
			'serviceContext.addGroupPermissions': true,
			'serviceContext.addGuestPermissions': true,
			'serviceContext.attributes': { refererPortletName: PortletKeys.fetch('PORTLET_DISPLAY_TEMPLATES') }
		};

		returnObj.payload = '{"/ddmtemplate/add-template": ' + JSON.stringify(payload) + '}';

		deferred.resolve(returnObj);

	});



	return deferred.promise;

};

module.exports = createUploadObject;