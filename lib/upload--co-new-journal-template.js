"use strict";

var createUploadObject = function (newScript, returnObj) {

	var Q           					= require('q');
	var inquirer						= require("inquirer");

	var PortletKeys                     = require("./SinglePortletKeys.js");
	var LrClassNameConfig				= require('./SingleLrClassNameConfig.js');
	var globalSites						= require('./SingleSites.js');
	var globalStructures				= require('./SingleStructures.js');
	var Constants   					= require('./SingleConstants.js');
	var utilities						= require('./utilities.js');

	var deferred = Q.defer();
	var payload = {};

	var listSites						= globalSites.fetch();
	var possibleStructures				= [];
	var questionsSites					= [];
	var questionsStructures				= [];
	var hasAtLeastOneSiteWithStructures	= false;

	// The new file is a journal template which needs to be bound to a journal *structure*
	// Therefor we need to figure out which sites has journal article structures.
	var currentClassNameId = LrClassNameConfig.getSingleValue('clazz', 'com.liferay.portlet.journal.model.JournalArticle', 'id');

	for (var i = 0; i < listSites.length; i++) {

		// Only let sites which may contain DDMs through
		// Like user sites we don't allow to contain DDMs and ar therefor ignoring them.
		if (LrClassNameConfig.getSingleValue('id', listSites[i].classNameId, 'containsDDMs')) {

			// Create an array with entries for each site which the user may
			// upload the journal template to. To be able to upload a template
			// that site needs to have at least 1 journal structure (to which
			// we can bind the template).
			possibleStructures[i] = globalStructures.fetch().filter(function (entry) {
				if (entry.groupId === listSites[i].groupId) {
					return entry.classNameId === currentClassNameId;
				} else {
					return false;
				}
			});

			// If the site has at least one journal structure. Add the
			// site to the list of sites the user is able to choose from
			// when uploading the template.
			if (possibleStructures[i].length > 0) {
			hasAtLeastOneSiteWithStructures = true;
				questionsSites.push({
					name: listSites[i].name + ' [' + LrClassNameConfig.getSingleValue('id', listSites[i].classNameId, 'friendlyName') + '] (' + possibleStructures[i].length + ')',
					value: {
						groupId: listSites[i].groupId,
						possibleStructures: possibleStructures[i]
					}
				});
			}
		}
	}

	// ASK THE USER WHICH SITE S/HE WANT'S TO UPLOAD THE TEMPLATE TO.

	// TODO: Om den nya journal templatens namn är det samma som en (1) giltig journal structures namn så bind automagiskt till den utan att frågan användaren.

	// Check that we have at least one site with a journal structure,
	// to which we can bind the template.
	if (hasAtLeastOneSiteWithStructures) { // Should probably change this to handle non-journal template files.

		utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen('Need some input on file: ', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen(returnObj.fileName + ' (' + returnObj.fileClassObj.friendlyName + ')', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_FILE'));
		utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));

		inquirer.prompt([
				{
					type: "list",
					name: "siteSelection",
					message: "Which site do you want to add the " + returnObj.fileClassObj.friendlyName + " to",
					choices: questionsSites
				}
			], function( answersSite ) {

				for (var i = 0; i < answersSite.siteSelection.possibleStructures.length; i++) {
					questionsStructures.push({
						name: answersSite.siteSelection.possibleStructures[i].nameCurrentValue,
						value: answersSite.siteSelection.possibleStructures[i]
					});
				}

				inquirer.prompt([
						{
							type: "list",
							name: "structureSelection",
							message: "Which structure do you want to bind the template to",
							choices: questionsStructures
						}
					], function( answersStructure ) {

						// Set some values in our return object to be able to do a nice print to the user.
						returnObj.group.description		= globalSites.getSingleValue('groupId', answersSite.siteSelection.groupId, 'description');
						returnObj.group.name			= globalSites.getSingleValue('groupId', answersSite.siteSelection.groupId, 'name');
						returnObj.group.type			= LrClassNameConfig.getSingleValue('id', globalSites.getSingleValue('groupId', answersSite.siteSelection.groupId, 'classNameId'), 'friendlyName');
						returnObj.group.friendlyURL		= globalSites.getSingleValue('groupId', answersSite.siteSelection.groupId, 'friendlyURL');
						returnObj.group.groupId			= answersSite.siteSelection.groupId;

						payload = {
							groupId: answersSite.siteSelection.groupId,
							classNameId: LrClassNameConfig.getSingleValue('clazz', 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure', 'id'),
							classPK: answersStructure.structureSelection.structureId,
							nameMap: utilities.strToJsonMap(returnObj.fileName),
							descriptionMap: {},
							type: 'display',
							mode: '',
							language: returnObj.fileLanguageType,
							script: newScript,
							'+serviceContext': 'com.liferay.portal.service.ServiceContext',
							'serviceContext.addGroupPermissions': true,
							'serviceContext.addGuestPermissions': true,
							'serviceContext.attributes': { refererPortletName: PortletKeys.fetch('JOURNAL') }
						};

						returnObj.payload = '{"/ddmtemplate/add-template": ' + JSON.stringify(payload) + '}';

						deferred.resolve(returnObj);
						return returnObj

					}
				);

			}
		);
	} else {
		returnObj.exception = 'There are no sites with structures to which we can bind a template';
		deferred.reject(returnObj);
		return deferred.promise;
	}


	return deferred.promise;

};

module.exports = createUploadObject;