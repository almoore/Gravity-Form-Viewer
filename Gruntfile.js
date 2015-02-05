module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: ['build','dist'],
		copy:{
			main:{
				files:[
					{expand: true, src: ['app.js'], dest: 'build'},
					{expand: true, src: ['content/**'], dest: 'build'},
					{expand: true, src: ['node_modules/**'], dest: 'build'},
					{expand: true, src: ['node/**'], dest: 'build'},
					{expand: true, src: ['run'], dest: 'build'}
				]

			}
		},
		chmod: {
			options: {
				mode: '775'
			},
			node: {
				src: ['build/**']
			}
		},
		compress: {
			main: {
				options: {
					mode: 'zip',
					archive: 'dist/<%= pkg.name %>.zip'
				},
				expand: true,
				cwd:'build',
				src: ['**']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-chmod');

	grunt.registerTask('build', ['clean','copy:main','chmod']);

};