// This App Dependencies
var Constants                       = require('./SingleConstants.js');
var globalStructures				= require('./SingleStructures.js');
var globalTemplates					= require('./SingleTemplates.js');
var globalSites						= require('./SingleSites.js');

var utilities	                    = require('./utilities.js');
var lrException                     = require('./error-exception.js');
var createUploadObject              = require('./upload--create-object.js');
var getData	             			= require('./getData.js');
var router	             			= require('./router.js');
var updateGlobalStructureTemplateWithNew	= require('./updateListSites.js');


/**
 * Upload file by
 * Takes file as
 * Based on the file path to the file - figure out what kind of file it is
 * TODO SKRIV HÄR
 *
 */

/**
 * Upload a structure/template
 *
 * @param files - path and filename.
 * @return Object - success.
 */

var uploadFiles = function (files) {


	var fullPayload = [];

	var preparePayloadPromises = files.map(function(path) {
		return createUploadObject(path, globalTemplates, globalStructures, globalSites);
	});


// TODO: Se till att det här sker sekventiellt istället. Dvs typ typ:
// Testa genom att skicka in 2 st NYA journal templates så att 2 st input-rutan triggas.


// However, if you want to run a dynamically constructed sequence of functions, you'll want something like this:

// var funcs = [foo, bar, baz, qux];

// var result = Q(initialVal);
// funcs.forEach(function (f) {
//     result = result.then(f);
// });
// return result;	



	// TODO: Handle if we get rejects! E.g because there are no structures uploaded
	Q.all(preparePayloadPromises).then(function (uploadObjects) {

		var filteredUploadObjects = [];
		var states = [
			{
				status: 'uptodate',
				heading: 'Already up to date, will not update'
			},
			{
				status: 'update',
				heading: 'Update'
			},
			{
				status: 'create',
				heading: 'Create new'
			}
		];

		// Split the uploadObjects into 3, one with files that are already up to date,
		// one with files that needs updating and one with files that needs to be created,
		// to be able to present it to the user in a nice way (and avoid) updating things,
		// which does not need to be updated.
		for (var x = 0; x < states.length ; x++) {
			filteredUploadObjects = uploadObjects.filter(function(entry) {
				return entry.status == states[x].status;
			});

			states[x].table = new Table({
				head: ['Name', 'Type', 'GrpId', 'Group Name'],
				chars: {
					'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': '',
					'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': '',
					'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': '',
					'right': '' , 'right-mid': '' , 'middle': ' '
				},
				style: {
					'padding-left': 2,
					'padding-right': 0,
					'head': ['yellow']
				},
				colWidths: [30, 35, 7]
			});

			for (var i = 0; i < filteredUploadObjects.length; i++) {
				states[x].table.push([
					filteredUploadObjects[i].fileName,
					filteredUploadObjects[i].fileClassObj.friendlyName,
					filteredUploadObjects[i].group.groupId,
						filteredUploadObjects[i].group.name + ' (' + filteredUploadObjects[i].group.type + ')'
				]);
			}

			if (states[x].table.length > 0) {
				utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
				utilities.writeToScreen(states[x].heading + ' (' + states[x].table.length + ')', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
				utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
				utilities.writeToScreen(states[x].table.toString(), Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
				utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
			}

		}

		// Check to see that we actually have things which needs to be updated/created
		if (states[1].table.length > 0 || states[2].table.length > 0 ) {
			inquirer.prompt([
					{
						type: "list",
						name: "confirm",
						message: "Do you want to send this to the server?",
						choices: [
							{
								name: 'Send to server',
								value: true
							},
							{
								name: 'Abort',
								value: false
							}
						]
					}
				], function( answers ) {
					if (answers.confirm === true) {

						// Remove every file which is already to date.
						uploadObjects = uploadObjects.filter(function(entry) {
							return entry.status != 'uptodate';
						});

						// Create a batch of all payloads.
						for (var i = 0; i < uploadObjects.length; i++) {
							fullPayload.push(uploadObjects[i].payload);
						}

						getData('[' + fullPayload.join() + ']').then(function (resp) {
							updateGlobalStructureTemplateWithNew(resp);
							utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
							utilities.writeToScreen('Files updated/created!', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
							router(Constants.fetch('STEP_JUST_UPLOADED_DDMS'));
						}, function (e) {
							console.dir(e);
							lrException('Could not upload DDMs to server!\n');
						});

					} else {
						router(Constants.fetch('STEP_JUST_UPLOADED_DDMS'));
					}
				}
			);


		} else {
			utilities.writeToScreen('Every file is already up to date\n', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
			router(Constants.fetch('STEP_JUST_UPLOADED_DDMS'));
		}

	});
};

module.exports = uploadFiles;