"use strict";

var createUploadObject = function (newScript, fileClassObj, fileName, fileLanguageType, isNewDDM, oldDDMObj, returnObj) {
	var Q           					= require('q');
	var inquirer						= require("inquirer");

	var LrClassNameConfig				= require('./SingleLrClassNameConfig.js');
	var globalSites						= require('./SingleSites.js');
	var utilities						= require('./utilities.js');

	var deferred = Q.defer();
	var payload = {};

	// Check if the file already is up to date
	if(oldDDMObj.script === newScript) {
		returnObj.status = 'uptodate';
	} else {
		returnObj.status = 'update';
	}

	// Set some values in our return object to be able to do a nice print to the user.
	returnObj.group.description = globalSites.getSingleValue('groupId', oldDDMObj.groupId, 'description');
	returnObj.group.name = globalSites.getSingleValue('groupId', oldDDMObj.groupId, 'name');
	returnObj.group.type = LrClassNameConfig.getSingleValue('id', globalSites.getSingleValue('groupId', oldDDMObj.groupId, 'classNameId'), 'friendlyName');
	returnObj.group.friendlyURL = globalSites.getSingleValue('groupId', oldDDMObj.groupId, 'friendlyURL');
	returnObj.group.groupId = oldDDMObj.groupId;

	// Populate payload with data from old template (things we aren't updating)
	payload = {
		templateId: oldDDMObj.templateId,
		classPK: oldDDMObj.classPK,
		type: oldDDMObj.type,
		mode: oldDDMObj.mode,
		language: oldDDMObj.language,
		cacheable: oldDDMObj.cacheable,
		smallImage: oldDDMObj.smallImage,
		smallImageURL: oldDDMObj.smallImageURL,
		smallImageFile: null, // We don't support small images right now.
		script: newScript
	};

	// Populate payload with data from old template (things we aren't updating)
	// but we need to make it into a Map which Liferay wants.
	utilities.xmlMapToObj(oldDDMObj.name, 'Name')
		.then(function (resName) {
			payload.nameMap = resName;
		})
		.then(utilities.xmlMapToObj(oldDDMObj.description, 'Description')
			.then(function (resDesc) {
				payload.descriptionMap = resDesc;
			}))
		.then(
		function () {
			returnObj.payload = '{"/ddmtemplate/update-template": ' + JSON.stringify(payload) + '}';
			deferred.resolve(returnObj);
		}
	);

	return deferred.promise;

};

module.exports = createUploadObject;