# gulp-dependency-doc-generator

Create a dependency document from your NPM and Bower files. This will pull out the name, description, version, & homepage from each dependecy, aka you will also get an up-to-date view of which versions your dependencies have. Furthermore you will get a list of files in which each dependency is used, note that this is feature is still in early alpha stage.

```
{
	"./package.json": {
		"aws-sdk": {
			"name": "aws-sdk",
			"description": "AWS SDK for JavaScript",
			"version": "2.2.15",
			"homepage": "https://github.com/aws/aws-sdk-js",
			"refs": [
				"gulpfile.js",
				"server/src/services/s3service.js"
			]
		}
	},
	"./console/bower.json": {
		"angular-md5": {
			"name": "angular-md5",
			"description": "A md5 crypto component for Angular.js",
			"version": "0.1.10",
			"homepage": "https://github.com/gdi2290/angular-md5",
			"refs": [
				"console/src/app.js",
				"console/src/modules/core.js"
			]
		}
	}
}
```


## Usage

```
var gulpDependencyDocGenerator = require('gulp-dependency-doc-generator');

gulp.task('generate-dependency-doc', function (done) {
    var options = {
        srcFolder: '.',
        dependencyFiles: ['./package.json', './console/bower.json'],
        fileTypes: ['.html', '.js'],
        ignoredFolders: ['node_modules', 'bower_components', 'coverage/html'],
        outputFile: './dependencyDocument.json'
    };

    gulpDependencyDocGenerator(options, done);
});
```



## Contributing
We encourage you to contribute to this repo! Please send pull requests with modified and updated code.

1. Fork it ( https://github.com/tobiasc/gulp-locale-online-translator )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -a -m 'Add some feature'`), note please squash your commits if you have more than one.
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request
