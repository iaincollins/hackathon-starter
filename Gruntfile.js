module.exports = function(grunt) {
  grunt.initConfig({
    bowerDirectory: require('bower').config.directory,
    less: {
      compile: {
        options: {
          compress: false,
          paths: ['less', 'tmp', '<%= bowerDirectory %>/bootstrap/less']
        },
        files: {
          'tmp/main.css': ['tmp/main.less']
        }
      }
    },
    recess: {
      dist: {
        options: {
          compile: true
        },
        files: {
          'public/css/main.css': ['tmp/main.css']
        }
      }
    },
    watch: {
      less: {
        files: ['less/*'],
        tasks: ['copy', 'less', 'recess', 'cssmin', 'clean'],
        options: {
          livereload: true
        }
      },
      cssmin: {
        files: ['public/css/main.css'],
        tasks: ['cssmin:minify']
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'public/css',
        src: ['*.css', '!*.min.css'],
        dest: 'public/css',
        ext: '.min.css'
      }
    },
    copy: {
      bootstrap: {
        files: [
          {
            expand: true,
            cwd: '<%= bowerDirectory %>/bootstrap/less',
            src: ['*'],
            dest: 'tmp/bootstrap'
          }, 
          {
            expand: true,
            cwd: 'less',
            src: ['*'],
            dest: 'tmp/'
          }, 
          {
            expand: true,
            cwd: '<%= bowerDirectory %>/bootstrap/fonts',
            src: ['*'],
            dest: 'public/fonts'
          }
        ]
      }
    },
    clean: ['tmp']
  });
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.registerTask('default', ['copy', 'less', 'recess', 'cssmin', 'clean']);
};