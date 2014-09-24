var temp = function() {
	var uploadFiles						= require('./upload--upload-files.js');
	var utilities	                    = require('./utilities.js');

	var files = [
		// UPDATE TEMPLATES
		'/Users/emiloberg/code/test-wcm/journal/templates/WCM template1.ftl'
//		'/Users/emiloberg/code/test-wcm/application_display_template/asset_publisher/templates/My Asset Publisher.ftl',
//		'/Users/emiloberg/code/test-wcm/generic_record_set/templates/Generic DDM Display Template.ftl',

//		'/Users/emiloberg/code/test-wcm/application_display_template/documents_and_media/templates/Carousel.ftl',
//		'/Users/emiloberg/code/test-wcm/application_display_template/documents_and_media/templates/NyCarousel.ftl'

		// CREATE TEMPLATES
//		'/Users/emiloberg/code/test-wcm/journal/templates/NEW WCM Template.ftl',
//		'/Users/emiloberg/code/test-wcm/application_display_template/asset_publisher/templates/NEW Asset Publisher.ftl',
//		'/Users/emiloberg/code/test-wcm/generic_record_set/templates/NEW Generic DDM Display Template.ftl'



		// CREATE STRUCTURES
//		'/Users/emiloberg/code/test-wcm/journal/structures/New Structure.xml',
//		'/Users/emiloberg/code/test-wcm/generic_record_set/structures/Ny Generic DDM Structure.xml',
//		'/Users/emiloberg/code/test-wcm/dynamic_data_lists/structures/NEW DDL Structure.xml'
//		'/Users/emiloberg/code/test-wcm/document_and_media/document_types/structures/NEW2 DnM DocType Structure.xml',

		// UPDATE STRUCTURES
//		'/Users/emiloberg/code/test-wcm/journal/structures/Second Structure.xml',
//		'/Users/emiloberg/code/test-wcm/generic_record_set/structures/Generic DDM Data Definition.xml',
//		'/Users/emiloberg/code/test-wcm/dynamic_data_lists/structures/My Dynamic Data Definition.xml',

//
//		'/Users/emiloberg/code/test-wcm/document_and_media/document_types/structures/Contract.xml',
//		'/Users/emiloberg/code/test-wcm/document_and_media/metadata_sets/structures/Meeting Metadata.xml'

//		'/Users/emiloberg/code/test-wcm/application_display_template/asset_publisher/Global AP.ftl'
	];


	// Update all files with timestamp
	var fs								= require('fs-extra');
	var Constants                       = require('./SingleConstants.js');
	for (var i = 0; i < files.length; i++) {
		if(utilities.filenameToLanguageType(files[i]) === 'ftl') {
			if (fs.existsSync(files[i])) {
				newScript = fs.readFileSync(files[i], {encoding: Constants.fetch('filesEncoding')});
				newScript = '<#-- Updated ' + new Date + ' ' + Date.now() + ' -->\n' + newScript;
				fs.writeFileSync(files[i], newScript, {encoding: Constants.fetch('filesEncoding')});
			}
		}
	}

	uploadFiles(files);


};

module.exports = temp;