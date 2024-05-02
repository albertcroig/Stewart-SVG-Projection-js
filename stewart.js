/**
 * @license Stewart.js v1.0.1 17/02/2019
 * https://raw.org/research/inverse-kinematics-of-a-stewart-platform/
 *
 * Copyright (c) 2019, Robert Eisele (robert@raw.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

// Get the vertices of the "hexagonal" plates, used for both the base and the platform. We have 3 arguments:
// inner radious, outer radious and the rotation of the plate.
function getHexPlate(r_i, r_o, rot) {
  // Initialize an empty array to store the vertices of the hexagon: "ret" name standing for "return array"
  var ret = [];

  // Calculate the distance from the center to the midpoint of each side (a_2: apothem)
  var a_2 = (2 * r_i - r_o) / Math.sqrt(3);

  // Loop through 6 times to create the hexagon
  for (var i = 0; i < 6; i++) {
    // Calculate the angle (phi) for each vertex
    var phi = (i - i % 2) / 3 * Math.PI + rot;

    // Calculate the coordinates of each vertex and push them into the array
    var ap = a_2 * Math.pow(-1, i);
    ret.push({
      x: r_o * Math.cos(phi) + ap * Math.sin(phi),
      y: r_o * Math.sin(phi) - ap * Math.cos(phi)
    });
  }
  // Return the array of hexagon vertices
  return ret;
}

// Parse an SVG path string and extract its individual
// segments along with their parameters. The function processes the path string character by character, identifying 
// commands (e.g., M, L, C, Q, A) and their associated parameters.
// https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
function parseSVGPath(str) {

  // This converts the path string containing all the commands separated by commas, into an array, where every command
  // becomes an element of the array. Example: if str is "A, -3, B, c, 0.23", p will be [A, -3, B, c, 0.23]
  var p = str.match(/[a-z]|[-+]?([0-9]*\.[0-9]+|[0-9]+)/ig);  
  var COMMANDS = "MmZzLlHhVvCcSsQqTtAa";
  var UPPERCASE = "MZLHVCSQTA";

  var segments = [];

  var cur = {y: 0, z: 0};
  var start = null;
  var cmd = null;
  var prevCmd = null;
  var isRelative = false;

  while (p.length > 0) {

    if (COMMANDS.indexOf(p[0]) !== -1) {           // If first element of p array is a command (is found within the COMMANDS string).
      prevCmd = cmd;                               // Assign previous command to prevCmd variable
      cmd = p.shift();                             // Removes first element from p array (new command) and assigns it to the cmd variable
      isRelative = UPPERCASE.indexOf(cmd) === -1;  // It assigns this command as relative (boolean variable) if it's lowercase.
      cmd = cmd.toUpperCase();                     // Converts this command (wether it's relative or not) to uppercase.
    } else {
      if (cmd === null) {                          // Error handling if it does not recognize the command
        throw new Error("Invalid implicit command");
      }
      prevCmd = cmd; // For S and T                // Assigns the previous command to command
    }

    switch (cmd) {

      case 'M':
        var y = +p.shift();
        var z = +p.shift();
        //console.log(z)
        if (isRelative) {
          cur.y += y;
          cur.z += z;
        } else {
          cur.y = y;
          cur.z = z;
        }

        segments.push({cmd: "move", y: cur.y, z: cur.z});

        // Reset start position
        start = {y: cur.y, z: cur.z};

        // Implicitely treat move as lineTo
        cmd = 'L';
        break;

      case 'L':
        var y = +p.shift();
        var z = +p.shift();

        if (isRelative) {
          y += cur.y;
          z += cur.z;
        }

        segments.push({cmd: "line", y1: cur.y, z1: cur.z, y2: y, z2: z});

        cur.y = y;
        cur.z = z;
        break;

      case 'H':
        var y = +p.shift();

        if (isRelative) {
          y += cur.y;
        }

        segments.push({cmd: "line", y1: cur.y, z1: cur.z, y2: y, z2: cur.z});

        cur.y = y;
        break;

      case 'V':
        var z = +p.shift();

        if (isRelative) {
          z += cur.z;
        }

        segments.push({cmd: "line", y1: cur.y, z1: cur.z, y2: cur.y, z2: z});

        cur.z = z;
        break;

      case 'Z':
        if (start) {
          segments.push({cmd: "line", y1: cur.y, z1: cur.z, y2: start.y, z2: start.z});
          cur.y = start.y;
          cur.z = start.z;
        }
        start = null;
        cmd = null; // No implicit commands after path close
        break;

      case 'C':

        var y1 = +p.shift();
        var z1 = +p.shift();

        var y2 = +p.shift();
        var z2 = +p.shift();

        var y = +p.shift();
        var z = +p.shift();

        if (isRelative) {
          y1 += cur.y;
          z1 += cur.z;

          y2 += cur.y;
          z2 += cur.z;

          y += cur.y;
          z += cur.z;
        }

        segments.push({
          cmd: "cubic",
          y0: cur.y, z0: cur.z, // Start
          y1: y1, z1: z1, // Control 1
          y2: y2, z2: z2, // Control 2
          y3: y, z3: z, // End
          bezier: new Bezier(cur.y, cur.z, y1, z1, y2, z2, y, z)
        });

        cur.y = y;
        cur.z = z;
        break;

      case 'S':

        // First control point is the reflection of the previous command.

        if (prevCmd !== 'C' && prevCmd !== 'S') {
          // If prev command was not C or S, assume first control point is coincident with current point
          var y1 = cur.y;
          var z1 = cur.z;
        } else {
          // The first control point is assumed to be the reflection of the second control point of the previous command relative to current point
          var y1 = cur.y + cur.y - segments[segments.length - 1].y2;
          var z1 = cur.z + cur.z - segments[segments.length - 1].z2;
        }

        var y2 = +p.shift();
        var z2 = +p.shift();

        var y = +p.shift();
        var z = +p.shift();

        if (isRelative) {
          y2 += cur.y;
          z2 += cur.z;

          y += cur.y;
          z += cur.z;
        }

        segments.push({
          cmd: "cubic",
          y0: cur.y, z0: cur.z, // Start
          y1: y1, z1: z1, // Control 1
          y2: y2, z2: z2, // Control 2
          y3: y, z3: z, // End
          bezier: new Bezier(cur.y, cur.z, y1, z1, y2, z2, y, z)
        });

        cur.y = y;
        cur.z = z;
        break;

      case 'Q':

        var y1 = +p.shift();
        var z1 = +p.shift();

        var y = +p.shift();
        var z = +p.shift();


        if (isRelative) {
          y1 += cur.y;
          z1 += cur.z;

          y += cur.y;
          z += cur.z;
        }

        // Quadratic Bezier
        segments.push({
          cmd: "quadratic",
          y0: cur.y, z0: cur.z, // Start
          y1: y1, z1: z1, // Control 1
          y2: y, z2: z, // End
          bezier: new Bezier(cur.y, cur.z, y1, z1, y, z)
        });

        cur.y = y;
        cur.z = z;
        break;

      case 'T':

        // Control point is the reflection of the previous command.

        if (prevCmd !== 'Q' && prevCmd !== 'T') {
          // If prev command was not C or S, assume first control point is coincident with current point
          var y1 = cur.y;
          var z1 = cur.z;
        } else {
          // The first control point is assumed to be the reflection of the second control point of the previous command relative to current point
          var y1 = cur.y + cur.y - segments[segments.length - 1].y1;
          var z1 = cur.z + cur.z - segments[segments.length - 1].z1;
        }

        var y = +p.shift();
        var z = +p.shift();

        if (isRelative) {
          y += cur.y;
          z += cur.z;
        }

        segments.push({
          cmd: "quadratic",
          y0: cur.y, z0: cur.z, // Start
          y1: y1, z1: z1, // Control 1
          y2: y, z2: z, // End
          bezier: new Bezier(cur.y, cur.z, y1, z1, y, z)
        });

        cur.y = y;
        cur.z = z;
        break;

      case 'A':

        var ry = +p.shift();
        var rz = +p.shift();

        var axisRotation = +p.shift();
        var largeArcFlag = +p.shift();
        var sweepFlag = +p.shift();

        var y = +p.shift();
        var z = +p.shift();

        if (isRelative) {
          y += cur.y;
          z += cur.z;
        }

        segments.push({
          cmd: "arc",

          ry: ry, rz: rz, // Radius

          axisRotation: axisRotation,
          largeArcFlag: largeArcFlag,
          sweepFlag: sweepFlag,

          y: y, z: z // End
        });

        cur.y = y;
        cur.z = z;
        break;

      default:
        throw new Error('Invalid SVG command ' + cmd);
    }
  }
  //console.log(segments)
  return segments;
}
