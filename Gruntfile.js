module.exports = function(grunt) {
	grunt.initConfig({
		jshint: {
			all: ['lib/*.js', 'index.js'],
			options: {
				reporter: require('jshint-table-reporter'),
				node: true
			},
			jshintrc: '.jshintrc',
		},
		bump: {
			options: {
				files: ['package.json'],
				updateConfigs: [],
				commit: true,
				commitMessage: 'Release v%VERSION%',
				commitFiles: ['package.json'],
				createTag: true,
				tagName: 'v%VERSION%',
				tagMessage: 'Version %VERSION%',
				push: true,
				pushTo: 'github',
				gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
			}
		},
	});

	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('release', ['bump']);
};
