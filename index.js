var fs = require('fs');
var async = require('async');
var recursive = require('recursive-readdir');
var gutil = require('gulp-util');

module.exports = function (options, callback) {
    run(options, function (err, data) {
        if (err) {
            callback(new gutil.PluginError('gulp-dependency-doc-generator', err));

        } else {
            fs.writeFile(options.outputFile, JSON.stringify(data, null, '\t'), 'utf8', function (err, data) {
                if (err) {
                    callback(new gutil.PluginError('gulp-dependency-doc-generator', err));
                } else {
                    callback();
                }
            });
        }
    });
};

function run(options, callback) {
    var docJson = {};
    async.waterfall([
        // looks into dependencyFiles
        function (cb) {
            async.each(options.dependencyFiles, function (dependencyFile, cb1) {
                var dependencyFileFolder = '';
                if (dependencyFile.indexOf('package.json') !== -1) {
                    dependencyFileFolder = dependencyFile.replace('package.json', 'node_modules');

                } else if (dependencyFile.indexOf('bower.json') !== -1) {
                    // take .bowerrc files into account
                    var bowerFolder = dependencyFile.substr(0, dependencyFile.indexOf('bower.json'));
                    try {
                        var bowerrcObj = JSON.parse(fs.readFileSync(bowerFolder + '.bowerrc', "utf8"));
                        if (bowerrcObj.directory) {
                            dependencyFileFolder = bowerFolder + bowerrcObj.directory.replace('./', '');
                        }
                        cb1();

                    } catch (err) {
                        dependencyFileFolder = dependencyFile.replace('bower.json', 'bower_components');
                        cb1();
                    }
                }

                if (dependencyFileFolder !== '') {
                    docJson[dependencyFile] = {};
                    getDependencyFiles(dependencyFile, dependencyFileFolder, function (err, objs) {
                        if (err) {
                            cb1(err);

                        } else {
                            for (var attrname in objs) { 
                                docJson[dependencyFile][attrname] = objs[attrname]; 
                            }
                            cb1();
                        }
                    });

                } else {
                    cb1();
                }

            }, function (err) {
                if (err) {
                    cb(err);
                } else {
                    cb();
                }
            });
        },

        // attach references (we do this in a separate step to iterate through files more efficiently)
        function (cb) {
            var refs = [];
            for (var i = 0; i < options.dependencyFiles.length; i++) {
                var keys = Object.keys(docJson[options.dependencyFiles[i]]);
                for (var j = 0; j< keys.length; j++) {
                    if (refs.indexOf(keys[j]) === -1) {
                        refs.push(keys[j]);
                    }
                }
            }

            findReferences(options, refs, function (err, obj) {
                if (err) {
                    cb();
                } else {
                    // note that we're adding the ref files to all instances of a ref, as we don't know exactly who's using it
                    for (var i = 0; i < options.dependencyFiles.length; i++) {
                        for (var ref in obj) { 
                            if (docJson[options.dependencyFiles[i]] && docJson[options.dependencyFiles[i]][ref]) {
                                if (typeof docJson[options.dependencyFiles[i]][ref].refs === 'undefined') {
                                    docJson[options.dependencyFiles[i]][ref].refs = [];
                                }
                                for (var j = 0; j < obj[ref].length; j++) {
                                    docJson[options.dependencyFiles[i]][ref].refs.push(obj[ref][j]);
                                };
                            }
                        }
                    }
                    cb();
                }
            });
        }

    ], function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, docJson);
        }
    });
}

function getDependencyFiles(filename, folder, callback) {
    var depObjs = {};

    try {
        fs.readFile(filename, 'utf8', function (err, text) {
            if (err) {
                callback(err);

            } else {
                try {
                    var json = JSON.parse(text);

                    async.waterfall([
                        // looks into dependencies
                        function (cb) {
                            if (json.dependencies) {
                                getObjectsFromDependencies(Object.keys(json.dependencies), folder, function (err, objs) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        for (var attrname in objs) { 
                                            depObjs[attrname] = objs[attrname]; 
                                        }
                                        cb();
                                    }
                                });

                            } else {
                                cb();
                            }

                        },

                        // looks into devDependencies
                        function (cb) {
                            if (json.devDependencies) {
                                getObjectsFromDependencies(Object.keys(json.devDependencies), folder, function (err, objs) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        for (var attrname in objs) { 
                                            depObjs[attrname] = objs[attrname]; 
                                        }
                                        cb();
                                    }
                                });

                            } else {
                                cb();
                            }
                        }

                    ], function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, depObjs);
                        }
                    });

                } catch (err) {
                    callback(err);
                }
            }
        });

    } catch (err) {
        callback();
    }
}

function getObjectsFromDependencies(dependencies, folder, callback) {
    var objs = {};
    async.each(dependencies, function (dependency, cb) {
        var depFile = '';
        // we favor package.json files, but will fallback to bower.json files
        if (fs.existsSync(folder + '/' + dependency + '/package.json')) { 
            depFile = folder + '/' + dependency + '/package.json';

        } else if (fs.existsSync(folder + '/' + dependency + '/bower.json')) {
            depFile = folder + '/' + dependency + '/bower.json';
        }

        if (depFile !== '') {
            getPropertiesFromDependency(depFile, function (err, obj) {
                if (err) {
                    cb(err);

                } else {
                    objs[dependency] = obj;
                    cb();
                }
            });
        } else {
            cb();           
        }

    }, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, objs);
        }
    });
}

function getPropertiesFromDependency(filename, callback) {
    try {
        fs.readFile(filename, 'utf8', function (err, text) {
            if (err) {
                callback(err);

            } else {
                try {
                    var json = JSON.parse(text);
                    callback(null, {
                            name: json.name,
                            description: json.description,
                            version: json.version,
                            homepage: json.homepage
                        });

                } catch (err) {
                    callback(err);
                }
            }
        });

    } catch (err) {
        callback(err);
    }
}

function findReferences(options, refs, callback) {
    var objRefs = {};
    createListOfFiles(options, function (err, files) {
        async.each(files, function (file, cb) {
            fs.readFile(file, 'utf-8', function (err, contents) { 
                if (err) {
                    cb();

                } else {
                    var tmp = inspectFile(file, contents, refs);
                    for (var attrname in tmp) { 
                        if (!objRefs[attrname]) {
                            objRefs[attrname] = [];
                        }
                        objRefs[attrname].push(tmp[attrname]); 
                    }
                    cb();
                }
            }); 

        }, function (err) {
            if (err) {
                callback(err);
            } else {

                callback(null, objRefs);
            }
        });
    });
}

function inspectFile(filename, contents, refs) {
    var objs = {};
    for (var i = 0; i < refs.length; i++) {
        if (contents.match(new RegExp(createRegExpString(refs[i]))) || contents.match(new RegExp(createRegExpString(makeCamelCase(refs[i]))))) {
            if (!objs[refs[i]]) {
                objs[refs[i]] = [];
            }
            objs[refs[i]] = filename;
        }
    }
    return objs;
}

function makeCamelCase(string) {
    return string.replace(/-([a-z])/g, function (g) { 
        return g[1].toUpperCase(); 
    });
}

function createRegExpString(ref) {
    return '(\'|")' + ref + '(\'|")';
}

function createListOfFiles(options, callback) {
    var fileArr = [];
    async.each(options.fileTypes, function (fileType, cb) {
        var arr = options.ignoredFolders.concat(['!*' + fileType]);
        recursive(options.srcFolder, arr, function (err, files) {
            if (err) {
                cb(err);

            } else {
                fileArr = fileArr.concat(files);
                cb();
            }
        });

    }, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, fileArr);
        }
    });
}
