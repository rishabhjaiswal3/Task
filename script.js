const fs = require("fs");
const readline = require("readline");
const Table = require("cli-table");

let fileName = "api-dev-out.log";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const METHODS = ["GET", "PUT", "POST", "DELETE", "PATCH", "HEAD", "OPTIONS"];

const showStatusCode = (statusCodes) => {
  const table = new Table({
    head: ["Status Code", "Count"],
    colWidths: [], // Set column widths
  });

  for (const statusCode in statusCodes) {
    table.push([statusCode, statusCodes[statusCode]]);
  }
  console.log(table.toString());
};

const APICallPerMinute = (apiCallsPerMinute) => {
  const table = new Table({
    head: ["Api Per Minute", "Count"],
    colWidths: [], // Set column widths
  });

  for (const timestamp in apiCallsPerMinute) {
    table.push([timestamp, apiCallsPerMinute[timestamp]]);
  }
  console.log(table.toString());
};

const showEndPoints = (endpointCounts) => {
  const table = new Table({
    head: ["EndPoint", "Count"],
    colWidths: [], // Set column widths
  });

  console.log("End Points:");
  for (const endpoint in endpointCounts) {
    table.push([endpoint, endpointCounts[endpoint]]);
  }
  console.log(table.toString());
};

function getUserInput(statusCodes, apiCallsPerMinute, endpointCounts) {
  console.log("Press 1: List of Status Codes");
  console.log("Press 2: API Calls Per Minute");
  console.log("Press 3: List Of Endpoints With Their Count");
  console.log("Press 4: Exit\n");

  rl.question("Enter a number 1,2,3, or 4 : ", (userInput) => {
    const number = parseInt(userInput);

    switch (number) {
      case 1:
        showStatusCode(statusCodes);
        break;
      case 2:
        APICallPerMinute(apiCallsPerMinute);
        break;
      case 3:
        showEndPoints(endpointCounts);
        break;
      case 4:
        // console.log("You entered 4. Exiting the loop.");
        rl.close();
        return;
        break;
      default:
        console.log("Please enter a valid number");
    }
    getUserInput(statusCodes, apiCallsPerMinute, endpointCounts); // Continue the loop
  });
}

function countApiCallsInLogFile(filePath) {
  console.log("Please Wait For A While, It May Take Some Time...");
  let count = 0;

  // Read the log file line by line
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const endpointCounts = {};
  const statusCodes = {};
  const apiCallsPerMinute = {};

  for (const line of lines) {
    for (const method of METHODS) {
      const logPattern = new RegExp(
        `(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2} [\\+\\-]\\d{2}:\\d{2}):.*"${method} (.*?) HTTP/1\\.1" (\\d+)`
      );
      const matches = line.match(logPattern);

      if (matches) {
        const timestamp = matches[1];
        let endpoint = matches[2];
        if (endpoint.includes("?")) {
          endpoint = endpoint.split("?")[0];
        }
        const statusCode = matches[3];

        // Count status codes
        if (!statusCodes[statusCode]) {
          statusCodes[statusCode] = 0;
        }
        statusCodes[statusCode]++;

        // Construct a minute-level timestamp (truncate seconds)
        const minuteTimestamp = timestamp.replace(/:\d{2}$/, ":00");
        // Count API calls per minute
        if (!apiCallsPerMinute[minuteTimestamp]) {
          apiCallsPerMinute[minuteTimestamp] = 0;
        }
        apiCallsPerMinute[minuteTimestamp]++;

        if (!endpointCounts[endpoint]) {
          endpointCounts[endpoint] = 0;
        }
        endpointCounts[endpoint]++;
      }
      if (logPattern.test(line)) {
        // console.log(method);
        count++;
      }
    }
  }

  getUserInput(statusCodes, apiCallsPerMinute, endpointCounts);

  return count;
}

const logCounts = countApiCallsInLogFile(fileName);
