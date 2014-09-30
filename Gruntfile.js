module.exports = function(grunt) {
	grunt.initConfig({
		jshint: {
			all: ['lib/*.js', 'index.js'],
			options: {
				reporter: require('jshint-table-reporter'),
				node: true
			},
			jshintrc: '.jshintrc',
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.registerTask('default', ['jshint']);

};
