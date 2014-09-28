"use strict";

var createUploadObject = function (newObj) {

	var Q           					= require('q');

	var LrClassNameConfig				= require('./SingleLrClassNameConfig.js');
	var Sites							= require('./Sites.js');
	var utilities						= require('./utilities.js');

	var deferred = Q.defer();
	var payload = {};

	var returnObj = {
		exceptionFile: newObj.file,
		group: {}
	};

	// Check if the file already is up to date
	if(newObj.oldObj.xsd === newObj.newScript) {
		returnObj.status = 'uptodate';
	} else {
		returnObj.status = 'update';
	}

	// Set some values in our return object to be able to do a nice print to the user.
	returnObj.className = LrClassNameConfig.getSingleValue('id', newObj.classNameId, 'friendlyName');
	returnObj.fileFriendlyName = newObj.fileFriendlyName;
	returnObj.isStructure = true;

	// Set some values in our return object to be able to do a nice print to the user.
	returnObj.group.description = Sites.getSingleValue('groupId', newObj.oldObj.groupId, 'description');
	returnObj.group.name = Sites.getSingleValue('groupId', newObj.oldObj.groupId, 'name');
	returnObj.group.type = LrClassNameConfig.getSingleValue('id', Sites.getSingleValue('groupId', newObj.oldObj.groupId, 'classNameId'), 'friendlyName');
	returnObj.group.friendlyURL = Sites.getSingleValue('groupId', newObj.oldObj.groupId, 'friendlyURL');
	returnObj.group.groupId = newObj.oldObj.groupId;

	// Populate payload with data from old structure (things we aren't updating)
	payload = {
		structureId: newObj.oldObj.structureId,
		parentStructureId: newObj.oldObj.parentStructureId,
		xsd: newObj.newScript
	};

	// Populate payload with data from old template (things we aren't updating)
	// but we need to make it into a Map which Liferay wants.
	utilities.xmlMapToObj(newObj.oldObj.name, 'Name')
		.then(function (resName) {
			payload.nameMap = resName;
		})
		.then(utilities.xmlMapToObj(newObj.oldObj.description, 'Description')
			.then(function (resDesc) {
				payload.descriptionMap = resDesc;
			}))
		.then(
		function () {
			returnObj.payload = '{"/ddmstructure/update-structure": ' + JSON.stringify(payload) + '}';
			deferred.resolve(returnObj);
		}
	);

	return deferred.promise;

};

module.exports = createUploadObject;