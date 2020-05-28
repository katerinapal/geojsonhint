"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.hint = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _jsonlintLines = require("jsonlint-lines");

var _jsonlintLines2 = _interopRequireDefault(_jsonlintLines);

var _object = require("./object");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @alias geojsonhint
 * @param {(string|object)} GeoJSON given as a string or as an object
 * @param {Object} options
 * @param {boolean} [options.noDuplicateMembers=true] forbid repeated
 * properties. This is only available for string input, becaused parsed
 * Objects cannot have duplicate properties.
 * @param {boolean} [options.precisionWarning=true] warn if GeoJSON contains
 * unnecessary coordinate precision.
 * @returns {Array<Object>} an array of errors
 */
function hint(str, options) {

    var gj,
        errors = [];

    if ((typeof str === "undefined" ? "undefined" : _typeof(str)) === 'object') {
        gj = str;
    } else if (typeof str === 'string') {
        try {
            gj = _jsonlintLines2.default.parse(str);
        } catch (e) {
            var match = e.message.match(/line (\d+)/);
            var lineNumber = parseInt(match[1], 10);
            return [{
                line: lineNumber - 1,
                message: e.message,
                error: e
            }];
        }
    } else {
        return [{
            message: 'Expected string or object as input',
            line: 0
        }];
    }

    errors = errors.concat((0, _object.hint)(gj, options));

    return errors;
}

var hint_hint;

exports.hint = hint_hint = hint;
exports.hint = hint_hint;