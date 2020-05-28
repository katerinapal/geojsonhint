import ext_tap_tap from "tap";
import ext_fs_fs from "fs";
import ext_glob_glob from "glob";
import ext_fuzzer_fuzzer from "fuzzer";
import ext_child_process_child_process from "child_process";
import ext_path_path from "path";
import { hint as index_hintjs } from "../";
var test = ext_tap_tap.test, exec = ext_child_process_child_process.exec;

function file(x) {
    return ext_fs_fs.readFileSync(x, 'utf8');
}

function filejs(x) {
    return JSON.parse(ext_fs_fs.readFileSync(x, 'utf8'));
}

test('geojsonhint', function(t) {
    ext_glob_glob.sync('test/data/good/*.geojson').forEach(function(f) {
        var gj = file(f);
        t.deepEqual(index_hintjs.hint(gj), [], f);
    });
    t.deepEqual(index_hintjs.hint(undefined), [{
        message: 'Expected string or object as input',
        line: 0
    }], 'expected string input');
    t.deepEqual(index_hintjs.hint('{}'), [{
        message: '"type" member required',
        line: 1
    }], 'just an object');
    test('validates incorrect files', function(t) {
        ext_glob_glob.sync('test/data/bad/*.geojson').forEach(function(f) {
            var gj = file(f);
            if (process.env.UPDATE) {
                ext_fs_fs.writeFileSync(f.replace('geojson', 'result'), JSON.stringify(index_hintjs.hint(gj), null, 2));
            }
            t.deepEqual(index_hintjs.hint(gj), filejs(f.replace('geojson', 'result')), f);
        });
        t.end();
    });
    test('binary produces output for bad files', function(t) {
        ext_glob_glob.sync('test/data/bad/*.geojson').slice(0, 10).forEach(function(f) {
            t.test(f + ' pretty', function(tt) {
                exec(ext_path_path.join(__dirname, '../bin/geojsonhint ' + f), function(err, output) {
                    if (process.env.UPDATE) {
                        ext_fs_fs.writeFileSync(f.replace('geojson', 'cli-output-pretty'), output);
                    }
                    var expected = ext_fs_fs.readFileSync(f.replace('geojson', 'cli-output-pretty'), 'utf8');
                    tt.equal(output, expected);
                    tt.end();
                });
            });
            t.test(f + ' json', function(tt) {
                exec(ext_path_path.join(__dirname, '../bin/geojsonhint ' + f + ' --format=json'), function(err, output) {
                    if (process.env.UPDATE) {
                        ext_fs_fs.writeFileSync(f.replace('geojson', 'cli-output-json'), output);
                    }
                    var expected = ext_fs_fs.readFileSync(f.replace('geojson', 'cli-output-json'), 'utf8');
                    tt.equal(output, expected);
                    tt.end();
                });
            });
        });
        t.end();
    });
    test('validates incorrect files as objects', function(t) {
        ext_glob_glob.sync('test/data/bad/*.geojson').forEach(function(f) {
            if (f === 'test/data/bad/bad-json.geojson') return;
            var gj = filejs(f);
            if (process.env.UPDATE) {
                ext_fs_fs.writeFileSync(f.replace('geojson', 'result-object'), JSON.stringify(index_hintjs.hint(gj), null, 2));
            }
            t.deepEqual(index_hintjs.hint(gj), filejs(f.replace('geojson', 'result-object')), f);
        });
        t.end();
    });
    test('noDuplicateMembers option=false', function(t) {
        t.deepEqual(index_hintjs.hint('{"type":"invalid","type":"Feature","properties":{},"geometry":null}', {
            noDuplicateMembers: false
        }), [], 'sketchy object permitted');
        t.end();
    });
    test('noDuplicateMembers option=true', function(t) {
        t.deepEqual(index_hintjs.hint('{"type":"invalid","type":"Feature","properties":{},"geometry":null}', {
            noDuplicateMembers: true
        }), [{
          line: 1,
          message: 'An object contained duplicate members, making parsing ambigous: type'
        }], 'sketchy object not permitted by default');
        t.end();
    });
    test('noDuplicateMembers option=true', function(t) {
        t.deepEqual(index_hintjs.hint('{ "type": "Point", "coordinates": [100.0000000001, 5.0000000001] }', {
            precisionWarning: true
        }), [{
          line: 1,
          level: 'message',
          message: 'precision of coordinates should be reduced'
        }, {
          line: 1,
          level: 'message',
          message: 'precision of coordinates should be reduced'
        }], 'sketchy object not permitted by default');
        t.end();
    });
    test('noDuplicateMembers option=true', function(t) {
        var excessiveFeature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [
                    100.0000001,
                    100.0000001
                ]
            },
            properties: {}
        };
        var featureCollection = {
            type: 'FeatureCollection',
            features: []
        };
        for (var i = 0; i < 100; i++) featureCollection.features.push(excessiveFeature);
        var truncated = index_hintjs.hint(JSON.stringify(featureCollection, null, 2), {
            precisionWarning: true
        })
        t.equal(truncated.length, 11);
        t.deepEqual(truncated[10], {
          line: 63,
          level: 'message',
          message: 'truncated warnings: we\'ve encountered coordinate precision warning 10 times, '
              + 'no more warnings will be reported'
        });
        t.end();
    });
    test('invalid roots', function(t) {
        t.deepEqual(index_hintjs.hint('null'), [{
            message: 'The root of a GeoJSON object must be an object.',
            line: 0
        }], 'non-object root');
        t.deepEqual(index_hintjs.hint('1'), [{
            message: 'The root of a GeoJSON object must be an object.',
            line: 0
        }], 'number root');
        t.deepEqual(index_hintjs.hint('"string"'), [{
            message: 'The root of a GeoJSON object must be an object.',
            line: 0
        }], 'string root');
        t.end();
    });
    ext_glob_glob.sync('test/data/good/*.geojson').forEach(function(f) {
        var mutator = ext_fuzzer_fuzzer.mutate.object(filejs(f));
        for (var i = 0; i < 100; i++) {
            try {
                var input = mutator();
                index_hintjs.hint(input);
            } catch(e) {
                t.fail('exception on ' + JSON.stringify(input));
            }
        }
    });
    t.end();
});
