/**
 * Module dependencies.
 */

var config = require("../config.json")
  , fs = require("fs");

/**
 * Expose `TCDBReporter`.
 */

exports = module.exports = TCDBReporter;

/**
 * Initialize a new `TCDBReporter`.
 *
 * @param {Runner} runner
 * @api public
 */

function TCDBReporter(runner, options) {

  var testCases = []
    , environment = process.env.TCDB_ENV || config.env.toUpperCase() || "TCA"
    , envNumber = 0
    , filePath = process.env.TCDB_FILE || config.tcdbFile || process.cwd() + "/tcdb.json";

  switch (environment) {
    case "DCA":
      envNumber = 3;
      break;
    case "TCA":
      envNumber = 4;
      break;
    case "SCA":
      envNumber = 5;
      break;
  }

  function contructJSON(testCaseId, version, status, errorMessage) {
    var reason = "";
    if (errorMessage) {
      reason = "Failure Reason: " + errorMessage;
    }
    var testCase = {
      "Notes": reason,
      "TestCase": {
        "Id": testCaseId,
        "Version": version
      },
      "Result": status,
      "Build": {
        "Id": 2211
      },
      "Architecture": {
        "Name": environment,
        "Id": envNumber
      },
      "HowExecuted": "Automated",
      "AutoCreateStepExecutions": true
    };
    testCases.push(testCase);
  }

  runner.on('pass', function(test){
    var testCaseId = /\[TC(\d+)\.(\d+)\]/.exec(test.title);
    if (testCaseId) {
      contructJSON(testCaseId[1], testCaseId[2], "Passed");
    }
  });

  runner.on('fail', function(test, err){
    var testCaseId = /\[TC(\d+)\.(\d+)\]/.exec(test.title);
    if (testCaseId) {
      contructJSON(testCaseId[1], testCaseId[2], "Failed", err.message);
    }
  });

  runner.on('end', function(){
    console.log("Writing TCDB results to " + filePath);
    fs.writeFileSync(filePath, JSON.stringify({"testCaseExecutions": testCases}));
  });
}