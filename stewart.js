/**
 * @license Stewart.js v1.0.1 17/02/2019
 * https://raw.org/research/inverse-kinematics-of-a-stewart-platform/
 *
 * Copyright (c) 2019, Robert Eisele (robert@raw.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

function getHexPlate(r_i, r_o, rot) {
  var ret = [];
  var a_2 = (2 * r_i - r_o) / Math.sqrt(3);
  for (var i = 0; i < 6; i++) {
    var phi = (i - i % 2) / 3 * Math.PI + rot;
    var ap = a_2 * Math.pow(-1, i);

    ret.push({
      x: r_o * Math.cos(phi) + ap * Math.sin(phi),
      y: r_o * Math.sin(phi) - ap * Math.cos(phi)
    });
  }
  return ret;
}

function parseSVGPath(str) {

  var p = str.match(/[a-z]|[-+]?([0-9]*\.[0-9]+|[0-9]+)/ig);

  var COMMANDS = "MmZzLlHhVvCcSsQqTtAa";
  var UPPERCASE = "MZLHVCSQTA";

  var segments = [];

  var cur = {x: 0, y: 0};
  var start = null;
  var cmd = null;
  var prevCmd = null;
  var isRelative = false;

  while (p.length > 0) {

    if (COMMANDS.indexOf(p[0]) !== -1) {
      prevCmd = cmd;
      cmd = p.shift();
      isRelative = UPPERCASE.indexOf(cmd) === -1;
      cmd = cmd.toUpperCase();
    } else {
      if (cmd === null) {
        throw new Error("Invalid implicit command");
      }
      prevCmd = cmd; // For S and T
    }

    switch (cmd) {

      case 'M':
        var x = +p.shift();
        var y = +p.shift();

        if (isRelative) {
          cur.x += x;
          cur.y += y;
        } else {
          cur.x = x;
          cur.y = y;
        }

        segments.push({cmd: "move", x: cur.x, y: cur.y});

        // Reset start position
        start = {x: cur.x, y: cur.y};

        // Implicitely treat move as lineTo
        cmd = 'L';
        break;

      case 'L':
        var x = +p.shift();
        var y = +p.shift();

        if (isRelative) {
          x += cur.x;
          y += cur.y;
        }

        segments.push({cmd: "line", x1: cur.x, y1: cur.y, x2: x, y2: y});

        cur.x = x;
        cur.y = y;
        break;

      case 'H':
        var x = +p.shift();

        if (isRelative) {
          x += cur.x;
        }

        segments.push({cmd: "line", x1: cur.x, y1: cur.y, x2: x, y2: cur.y});

        cur.x = x;
        break;

      case 'V':
        var y = +p.shift();

        if (isRelative) {
          y += cur.y;
        }

        segments.push({cmd: "line", x1: cur.x, y1: cur.y, x2: cur.x, y2: y});

        cur.y = y;
        break;

      case 'Z':
        if (start) {
          segments.push({cmd: "line", x1: cur.x, y1: cur.y, x2: start.x, y2: start.y});
          cur.x = start.x;
          cur.y = start.y;
        }
        start = null;
        cmd = null; // No implicit commands after path close
        break;

      case 'C':

        var x1 = +p.shift();
        var y1 = +p.shift();

        var x2 = +p.shift();
        var y2 = +p.shift();

        var x = +p.shift();
        var y = +p.shift();

        if (isRelative) {
          x1 += cur.x;
          y1 += cur.y;

          x2 += cur.x;
          y2 += cur.y;

          x += cur.x;
          y += cur.y;
        }

        segments.push({
          cmd: "cubic",
          x0: cur.x, y0: cur.y, // Start
          x1: x1, y1: y1, // Control 1
          x2: x2, y2: y2, // Control 2
          x3: x, y3: y, // End
          bezier: new Bezier(cur.x, cur.y, x1, y1, x2, y2, x, y)
        });

        cur.x = x;
        cur.y = y;
        break;

      case 'S':

        // First control point is the reflection of the previous command.

        if (prevCmd !== 'C' && prevCmd !== 'S') {
          // If prev command was not C or S, assume first control point is coincident with current point
          var x1 = cur.x;
          var y1 = cur.y;
        } else {
          // The first control point is assumed to be the reflection of the second control point of the previous command relative to current point
          var x1 = cur.x + cur.x - segments[segments.length - 1].x2;
          var y1 = cur.y + cur.y - segments[segments.length - 1].y2;
        }

        var x2 = +p.shift();
        var y2 = +p.shift();

        var x = +p.shift();
        var y = +p.shift();

        if (isRelative) {
          x2 += cur.x;
          y2 += cur.y;

          x += cur.x;
          y += cur.y;
        }

        segments.push({
          cmd: "cubic",
          x0: cur.x, y0: cur.y, // Start
          x1: x1, y1: y1, // Control 1
          x2: x2, y2: y2, // Control 2
          x3: x, y3: y, // End
          bezier: new Bezier(cur.x, cur.y, x1, y1, x2, y2, x, y)
        });

        cur.x = x;
        cur.y = y;
        break;

      case 'Q':

        var x1 = +p.shift();
        var y1 = +p.shift();

        var x = +p.shift();
        var y = +p.shift();


        if (isRelative) {
          x1 += cur.x;
          y1 += cur.y;

          x += cur.x;
          y += cur.y;
        }

        // Quadratic Bezier
        segments.push({
          cmd: "quadratic",
          x0: cur.x, y0: cur.y, // Start
          x1: x1, y1: y1, // Control 1
          x2: x, y2: y, // End
          bezier: new Bezier(cur.x, cur.y, x1, y1, x, y)
        });

        cur.x = x;
        cur.y = y;
        break;

      case 'T':

        // Control point is the reflection of the previous command.

        if (prevCmd !== 'Q' && prevCmd !== 'T') {
          // If prev command was not C or S, assume first control point is coincident with current point
          var x1 = cur.x;
          var y1 = cur.y;
        } else {
          // The first control point is assumed to be the reflection of the second control point of the previous command relative to current point
          var x1 = cur.x + cur.x - segments[segments.length - 1].x1;
          var y1 = cur.y + cur.y - segments[segments.length - 1].y1;
        }

        var x = +p.shift();
        var y = +p.shift();

        if (isRelative) {
          x += cur.x;
          y += cur.y;
        }

        segments.push({
          cmd: "quadratic",
          x0: cur.x, y0: cur.y, // Start
          x1: x1, y1: y1, // Control 1
          x2: x, y2: y, // End
          bezier: new Bezier(cur.x, cur.y, x1, y1, x, y)
        });

        cur.x = x;
        cur.y = y;
        break;


      case 'A':

        var rx = +p.shift();
        var ry = +p.shift();

        var axisRotation = +p.shift();
        var largeArcFlag = +p.shift();
        var sweepFlag = +p.shift();

        var x = +p.shift();
        var y = +p.shift();

        if (isRelative) {
          x += cur.x;
          y += cur.y;
        }

        segments.push({
          cmd: "arc",

          rx: rx, ry: ry, // Radius

          axisRotation: axisRotation,
          largeArcFlag: largeArcFlag,
          sweepFlag: sweepFlag,

          x: x, y: y // End
        });

        cur.x = x;
        cur.y = y;
        break;

      default:
        throw new Error('Invalid SVG command ' + cmd);
    }
  }
  return segments;
}
