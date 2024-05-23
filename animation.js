/**
 * @license animation.js v1.0.0 23/05/2024
 * 
 * This file is part of the Stewart.js project which has been split and modified.
 *
 * Original code from Stewart.js:
 * Stewart.js v1.0.1 17/02/2019
 * https://raw.org/research/inverse-kinematics-of-a-stewart-platform/
 * 
 * Copyright (c) 2023, Robert Eisele (robert@raw.org)
 * Licensed under the MIT License.
 *
 * Modifications in this file by Albert Castellanos Roig (albertcastellanosrg@gmail.com), 2024
 * Licensed under the MIT License.
 */

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

// Constructor function for the Animation object that has a platform object as argument. Constructors are used to
// create and initialize an object instance of a class. 
// https://rollbar.com/blog/javascript-constructors/#:~:text=A%20constructor%20is%20a%20special,for%20any%20existing%20object%20properties.
function Animation(platform) {

  // 'this.platform' holds the Stewart Platform object associated with the animation object.
  this.platform = platform;

  // 'this.orientation' represents the orientation of the platform using a Quaternion
  // Quaternion.ONE is an identity quaternion, indicating no rotation
  this.orientation = Quaternion.ONE;

  // 'this.translation' is a 4-element array representing the translation of the animation in x, y, and z directions. The fourht element represents the state of the laser (1-on, 2-off)
  this.translation = [0, 0, 0, 0];


  this.drawingSize = 300 // Size of the drawing that will be projected onto the wall (300mmx300mm)
  this.drawingSpeed = 0.1 // Speed of animation (10 units per sec)

  this.currentPathPos = [0, 0, 0, 0] // 2D Array of length 4 that stores the drawing path of the animation, used for drawing the path as the animation progresses.
  this.currentPath = [[],[],[],[]]
  this.realDraw = false
  this.stopDrawingPath = false // Boolean variable 
}

// This function is called when clicking at an SVG image displayed on screen, through the onclick event located in the
// createSVGImage function in the main html script.
// The purpose of this function is to take an SVG path string and convert it into a series of 3D animation
// steps. The animation steps are then returned for further use. Check parseSVGPath() at line 44 for parsing SVG path to individual
// segments for animation. 
Animation.SVG = function(svg, box, size, speed) {

  const PERSEC = speed;  
  const L = 0;         // Lower value for the x-coordinate
  const H = 10;    // Higher value for the x-coordinate

  const SCREEN_SIZE = size;

  var cur = {x: L, y: box.width / 2, z: box.height / 2};  // Current position in the SVG path, initialized to the center of the provided bounding box (box)
  var ret = [];        // Array to store animation steps

  // This function calculates the relative position of the given coordinates within the bounding box and adds an animation step to the ret array.
  // It calculates the relative position of the current position (cur) and updates it with the given coordinates (x, y, z).
  function move(x, y, z) {
    
    // Desired position relative to the bounding box, and scaling it to the screen size, then centering it in screen.
    var relY = (y - box.y) / box.width * SCREEN_SIZE - SCREEN_SIZE / 2;
    var relZ = (z - box.x) / box.height * SCREEN_SIZE - SCREEN_SIZE / 2;

    // Current position relative to the bounding box, and scaling it to the screen size, then centering it in screen.
    var relCurY = (cur.y - box.y) / box.width * SCREEN_SIZE - SCREEN_SIZE / 2;
    var relCurZ = (cur.z - box.x) / box.height * SCREEN_SIZE - SCREEN_SIZE / 2;

    // Push desired position to array, as well as origin command and animation time. Time is calculated subtracting
    // desired position by current position, then dividing by speed. (distance / distance/time = time)
    ret.push({orig: s.cmd, x: x, y: relY, z: -relZ, t: Math.hypot(x - cur.x, relY - relCurY, relZ - relCurZ) / PERSEC});

    // Convert current position to desired position to continue with following movements and keep the loop going.
    cur.x = x;
    cur.y = y;
    cur.z = z;
  }

  // Assign the returned steps from parseSVGPath to variable seg
  var seg = parseSVGPath(svg);
  
  // Loop through every step of seg
  for (var i = 0; i < seg.length; i++) {

    // Assign current step to variable s
    var s = seg[i];

    // Switch statement to perform certain actions based on command name
    switch (s.cmd) {
      case 'move':
        //console.log(cur.z)
        move(H, cur.y, cur.z);
        move(H, s.y, s.z);
        move(L, s.y, s.z);
        break;
      case 'line':
        move(L, s.y2, s.z2);
        break;
      case 'quadratic':
      case 'cubic':
        var b = s.bezier.getLUT();

        for (var j = 0; j < b.length; j++) {
          move(L, b[j].x, b[j].y);
        }
        break;
      case 'arc':
        // https://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
        var y1 = cur.y;
        var z1 = cur.z;

        var y2 = s.y;
        var z2 = s.z;

        var axisRotation = s.axisRotation;
        var largeArcFlag = s.largeArcFlag;
        var sweepFlag = s.sweepFlag;

        var ry = s.ry;
        var rz = s.rz;

        // Step 1: y1', z1'
        var y1_ = Math.cos(axisRotation) * (y1 - y2) / 2.0 + Math.sin(axisRotation) * (z1 - z2) / 2.0;
        var z1_ = -Math.sin(axisRotation) * (y1 - y2) / 2.0 + Math.cos(axisRotation) * (z1 - z2) / 2.0;

        // Step 2: cy', cz'
        var s = (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt((ry * ry * rz * rz - ry * ry * z1_ * z1_ - rz * rz * y1_ * y1_) / (ry * ry * z1_ * z1_ + rz * rz * y1_ * y1_));

        var cy_ = s * ry * z1_ / rz;
        var cz_ = s * -rz * y1_ / ry;

        // Step 3: cy, cz
        var cy = (y1 + y2) / 2.0 + Math.cos(axisRotation) * cy_ - Math.sin(axisRotation) * cz_;
        var cz = (z1 + z2) / 2.0 + Math.sin(axisRotation) * cy_ + Math.cos(axisRotation) * cz_;


        // Step 4:

        var angleBetween = function(uy, uz, vy, vz) {

          var cosPhi = (uy * vy + uz * vz) / Math.sqrt((uy * uy + uz * uz) * (vy * vy + vz * vz));

          return (uy * vz < uz * vy ? -1 : 1) * Math.acos(cosPhi);
        };

        // initial angle
        var theta1 = angleBetween(
                1, 0,
                (y1_ - cy_) / ry, (z1_ - cz_) / rz);

        // angle delta
        var thetad = angleBetween(
                (y1_ - cy_) / ry, (z1_ - cz_) / rz,
                (-y1_ - cy_) / ry, (-z1_ - cz_) / rz);

        if (sweepFlag === 0 && thetad > 0) {
          thetad -= 2 * Math.PI;
        } else if (sweepFlag === 1 && thetad < 0) {
          thetad += 2 * Math.PI;
        }

        var steps = Math.ceil(Math.abs(thetad * Math.max(ry, rz)) / 2); // every two degree
        for (var j = 0; j <= steps; j++) {
          var phi = theta1 + thetad * (j / steps);

          var y = ry * Math.cos(phi);
          var z = rz * Math.sin(phi);

          var y_ = y * Math.cos(axisRotation) - z * Math.sin(axisRotation);
          var z_ = y * Math.sin(axisRotation) + z * Math.cos(axisRotation);

          move(L, cy + y_, cz + z_);
        }
    }
  }

  return Animation.Interpolate(ret, svg, box);
};

// This function is called by Animation.SVG function.
// It creates the "normalized" animation type object that needs to be passed as argument to the _start function. This
// takes as argument the array that stores the animation steps, created by the Animation.SVG function.
Animation.Interpolate = function(data, svgPath, box) {

  // Get desired y and z coordinates and calculate rotation and translation needed to accomplish them into wall projection
  const calculateMovements = function(x, y, z) {
    let rotationAxisOffset = platform.rotationAxisOffset
    let wallDistance = platform.wallDistance

    let movements = {}
    let theta, beta
    let xTrans, yTrans, zTrans

    theta = -Math.asin(z/(rotationAxisOffset + wallDistance))
    beta = Math.asin(y/(rotationAxisOffset + wallDistance))

    let laserState = x !== 0 ? 0 : 1

    xTrans = -(rotationAxisOffset - rotationAxisOffset * Math.cos(theta) * Math.cos(beta))
    yTrans = rotationAxisOffset * Math.sin(beta)
    zTrans = -rotationAxisOffset * Math.sin(theta)
  
    movements = {
      x: xTrans,
      y: yTrans,
      z: zTrans,
      theta: theta,
      beta: beta,
      laserState: laserState
    }
    return movements
  }

  // Find required position knowing its desired position and its current position, interpolating with scale for smoothness.
  const interpolateWithPrevious = function(previous, desired, scale) {
    return previous + (desired - previous) * scale
  }

  var duration = 0; // Initialize duration variable to 0
  for (var i = 1; i < data.length; i++) {  // Add all the durations of the whole animation steps together
    duration += data[i].t;
  }

  return {   // Return the normalized object for animation.
    duration: duration,
    svg: {svgPath, box},
    path: function(pct, addToCurrentPath) {

      const xValue = function(movement) {
        return (platform.rotationAxisOffset + platform.wallDistance) * (Math.cos(movement.theta) * Math.cos(movement.beta)) - platform.rotationAxisOffset
      }

      var pctStart = 0;  // Variable for starting progress of animation (initialize to 0%)
      for (var i = 1; i < data.length; i++) {  // For every step of the animation

        var p = data[i];  // from now on p = current step of animation
        var pctEnd = pctStart + p.t / duration; // calculate the percentage of animation transcurred up until this step

        if (pctStart <= pct && pct < pctEnd) {  // Execute code below only for step in selected pct (percentage) range.
          //console.log(pctStart)
          var scale = (pct - pctStart) / (pctEnd - pctStart); // Variable scale to calculate how far the animation is in selected step. (0 to 1)
          var prev = i === 0 ? data[0] : data[i - 1];  // Previous step, if i = 0 (meaning first step of animation), previous step is same step, otherwise its i-1

          // Calculate movements and previous movements according to distance to wall and rotation axis offset.
          var movements = calculateMovements(p.x, p.y, p.z)
          var prevMovements = calculateMovements(prev.x, prev.y, prev.z)

          if (!this.stopDrawingPath && addToCurrentPath) {
            this.currentPath[0].push(interpolateWithPrevious(xValue(prevMovements), xValue(movements), scale))                    
            this.currentPath[1].push(interpolateWithPrevious(prev.y, p.y, scale))
            this.currentPath[2].push(interpolateWithPrevious(prev.z, p.z, scale))
            this.currentPath[3].push(movements.laserState)
          }
    
          this.currentPathPos[0] = (interpolateWithPrevious(xValue(prevMovements), xValue(movements), scale))                    
          this.currentPathPos[1] = (interpolateWithPrevious(prev.y, p.y, scale))
          this.currentPathPos[2] = (interpolateWithPrevious(prev.z, p.z, scale))
          this.currentPathPos[3] = (movements.laserState)
    
          return; // Once the if condition is true, there is no need to continue with the loop, so return.
        }
        pctStart = pctEnd; // Assign the start pct to the end pct for continuing the loop.
      }

      // Set to last element in chain, that isn't considered on the for loop.
      var lastMovements = calculateMovements(data[data.length-1].x, data[data.length-1].y, data[data.length-1].z)

      if (!this.stopDrawingPath && addToCurrentPath) {
        this.currentPath[0].push(xValue(lastMovements))
        this.currentPath[1].push(data[data.length-1].y)
        this.currentPath[2].push(data[data.length-1].z)
        this.currentPath[3].push(lastMovements.laserState)
      }

      this.currentPathPos[0] = (xValue(lastMovements))
      this.currentPathPos[1] = (data[data.length-1].y)
      this.currentPathPos[2] = (data[data.length-1].z)
      this.currentPathPos[3] = (lastMovements.laserState)

    },    
    fn: function(pct) {

      var pctStart = 0;  // Variable for starting progress of animation (initialize to 0%)
      
      for (var i = 1; i < data.length; i++) {  // For every step of the animation

        var p = data[i];  // from now on p = current step of animation
        var pctEnd = pctStart + p.t / duration; // calculate the percentage of animation transcurred up until this step

        if (pctStart <= pct && pct < pctEnd) {  // Execute code below only for step in selected pct (percentage) range.
          //console.log(pctStart)
          var scale = (pct - pctStart) / (pctEnd - pctStart); // Variable scale to calculate how far the animation is in selected step. (0 to 1)
          var prev = i === 0 ? data[0] : data[i - 1];  // Previous step, if i = 0 (meaning first step of animation), previous step is same step, otherwise its i-1

          // Calculate movements and previous movements according to distance to wall and rotation axis offset.
          var movements = calculateMovements(p.x, p.y, p.z)
          var prevMovements = calculateMovements(prev.x, prev.y, prev.z)

          // Set the new location with previous' step location + its difference multiplied by completion progress of step.
          this.translation[0] = interpolateWithPrevious(prevMovements.x, movements.x, scale)
          this.translation[1] = interpolateWithPrevious(prevMovements.y, movements.y, scale)
          this.translation[2] = interpolateWithPrevious(prevMovements.z, movements.z, scale)
          this.translation[3] = movements.laserState;
      
          this.orientation = Quaternion.fromAxisAngle([0, 1, 0], prevMovements.theta + (movements.theta - prevMovements.theta) * scale).mul(Quaternion.fromAxisAngle([0, 0, 1], prevMovements.beta + (movements.beta - prevMovements.beta) * scale))
          return; // Once the if condition is true, there is no need to continue with the loop, so return.
        }
        pctStart = pctEnd; // Assign the start pct to the end pct for continuing the loop.
      }

      // Set to last element in chain, that isn't considered on the for loop.
      var lastMovements = calculateMovements(data[data.length-1].x, data[data.length-1].y, data[data.length-1].z)

      // For movements
      this.translation[0] = lastMovements.x;
      this.translation[1] = lastMovements.y;
      this.translation[2] = lastMovements.z;
      this.translation[3] = lastMovements.laserState;
      this.orientation = Quaternion.fromAxisAngle([0, 1, 0], lastMovements.theta).mul(Quaternion.fromAxisAngle([0, 0, 1], lastMovements.beta))
    },
  };
};

// We use prototype in order to add methods that intrinsically belong to an object.
// We define this methods ONCE inside the prototype, and every instance of an object will check the prototype
// to run the method. If we hardcoded it inside the Animation constructor, then the same method would be defined
// for every instance of object, wasting memory.
// https://www.youtube.com/watch?v=4jb4AYEyhRc
Animation.prototype = {
  cur: null,          // Current animation
  startTime: 0,
  platform: null,
  translation: null,
  orientation: null,
  pathVisible: true,  // Initialize visible path to true, then it can change depending on user's interaction.
  
  downloadServoAngles: function(data, originalValues, removeRedundant) {

    const calibrationData = {
      middlePos: [305, 313, 297, 313, 303, 317],
      amplitude: [186, 186, 186, 186, 186, 186],
      direction: [1, -1, 1, -1, 1, -1]
    }  
    
    function adaptDataArduino(rawData) {

      // Apply mathematical operations to map servo angles into real-life servo arduino angles  
      for (let i = 0; i < rawData.length; i++) {
        for (let j = 0; j < rawData[i].length; j++) {
          if (j !== 6) {
            if (calibrationData.direction[j] === -1) {
              rawData[i][j] = Math.floor(calibrationData.middlePos[j] -1 * rawData[i][j] * calibrationData.amplitude[j] * 2 / Math.PI)
            }
            else {
              rawData[i][j] = Math.ceil(calibrationData.middlePos[j] + rawData[i][j] * calibrationData.amplitude[j] * 2 / Math.PI)
            }
          }
        }
      }

      // Remove redundant rows if option is checked (duplicates and when laser activation is off)

      if (removeRedundant) {
        const indexesToRemove = []
        for (let i = 0; i < rawData.length-1; i++) {
          if (i !== 0) {
            if (rawData[i].every((value, index) => value === rawData[i-1][index])) {
              indexesToRemove.push(i)
            }
            else if (rawData[i][6] == 0 && rawData[i+1][6] == 0 && rawData[i-1][6] == 0) {
              indexesToRemove.push(i)
            }
          }
        }
        rawData = rawData.filter((_, index) => !indexesToRemove.includes(index));
        console.log(indexesToRemove.length + ' redundant rows removed.')
      }

      return rawData
    }

    function addHeaderAndSteps(myData, isAdapted) {
      let header = []

      if (isAdapted) {
        header = ['DigitalIn','Servo 0', 'Servo 1', 'Servo 2', 'Servo 3', 'Servo 4', 'Servo 5', 'Step', 'Original Angles']

        // Put last column into first position
        for (let i = 0; i < myData.length; i++) {
          const subarray = myData[i];
          subarray.unshift(subarray.pop())
        }

        for (let i =0; i<myData.length; i++) {
          myData[i][6] += '\t}'
        }
        // Add step number (commented)
        myData.forEach((row, index) => row.push('// ' + (index+1) + '\t' + originalAngles[index].join('\t')));
      }
      else {
        header = ['Step', 'Servo 0', 'Servo 1', 'Servo 2', 'Servo 3', 'Servo 4', 'Servo 5', 'Laser on/off'];
        // Create index column starting from 0
        myData.forEach((row, index) => row.unshift(index));
      }

      // Add header to the data
      myData.unshift(calibrationData.middlePos, calibrationData.amplitude, calibrationData.direction, header);
    }

    function performDownload(tableToDownload, isAdapted) {
      // Convert data to text
      let text

      if (isAdapted) {
        let order = [' Middle pos:', ' Amplitude:', ' Direction:', '\t']
        let headerText = '//\t\tCalibration values'
        for (i=0; i < 4; i++) {
          headerText += '\n//'+ order[i] +'\t' + tableToDownload.shift().join('\t,\t')
        }
        const bodyText = tableToDownload.map(row => row.join('\t,\t')).join('\n{')
        text = headerText + '\n' + '{' + bodyText
        const lastComma = text.lastIndexOf(",");
        text = text.substring(0, lastComma) + text.substring(lastComma + 1)
      }
      else {
        text = tableToDownload.map(row => row.join('\t')).join('\n');
      }

      // Create a Blob containing the array data as text
      const blob = new Blob([text], { type: 'text/plain' });

      // Create a temporary anchor element
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);

      // Set the file name
      anchor.download = isAdapted ? 'adaptedServoAngles.txt' : 'servoAngles.txt';

      // Append the anchor element to the document body
      document.body.appendChild(anchor);

      // Trigger a click event on the anchor element
      anchor.click();

      // Remove the anchor element from the document body
      document.body.removeChild(anchor);
    }

    // Applying initial modifications to data (remove first steps and offset laser activation by 1 step), and set laser to 0 at last row

    // Remove first steps (where the pointer moves to starting shape position)
    let indexToCut = 0
    for (let i = 0; i < data.length; i++) {
      if (data[i][6] === 0) {
        if (data[i+1][6] === 1) {
          indexToCut = i
          break;
        }
      }
    }
    data.splice(0, indexToCut + 1)

    // For the laser on/off, we offset the value *one step* so that it gets turned off later.
    let activationArr = []
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        activationArr.push(0)
      }
      else if (i === 1) {
        activationArr.push(data[i][6])
      }
      else {
        activationArr.push(data[i-2][6])
      }
    }
    for (let i = 0; i < data.length; i++) {
      data[i][6] = activationArr[i]
    }

    // Copy last row and set laser value to 0 (off)
    const lastRow = [...data[data.length-1]]
    const newRow = []
    for (let i = 0; i < lastRow.length; i++) {
      const colValue = lastRow[i]
      if (i === 6) {
        newRow.push(0)
      }
      else {
        newRow.push(colValue)
      }
    }
    data.push(newRow)
    
    // Store original angles in a variable for later use
    let originalAngles = []
    for (var i = 0; i < data.length; i++) {
      originalAngles[i] = data[i].slice();
    }

    if (!originalValues) {
      data = adaptDataArduino(data)
    }
    addHeaderAndSteps(data, !originalValues);
    performDownload(data, !originalValues)
  },

  // Draws a red line from the origin of the platform throughout the animation path. 
  drawPath: function(p) {
    if (!this.pathVisible) {
      return
    }

    function drawShapes(pathArr) {
      let isShapeBeginning = false
      p.beginShape();         // Tell the program I want to draw a shape with some vertices
      p.noFill();             // Background of shape transparent
      p.stroke(255, 0, 0);    // Contour of shape color red
      // console.log(pathArr)
      for (let i=0; i < pathArr[0].length; i++) {

        if (pathArr[3][i-1] !== 0) {
          if (isShapeBeginning) {
            p.beginShape();
            if (!this.realDraw) {
              p.vertex(pathArr[0][i-1], pathArr[1][i-1], pathArr[2][i-1] + platform.T0[2])
            }
          }
          p.vertex(pathArr[0][i], pathArr[1][i], pathArr[2][i] + platform.T0[2])
          isShapeBeginning = false
        }
        else {
          p.endShape();
          isShapeBeginning = true
        }
      }
      p.vertex(pathArr[0][pathArr[0].length-1], pathArr[1][pathArr[0].length-1], pathArr[2][pathArr[0].length-1] + platform.T0[2])
      p.endShape();
    }

    if (this.realDraw) {
      drawShapes(this.currentPath)
    }
    else {
      let drawingPath = [[],[],[],[]]
      const steps = 600
      for (var i = 0; i <= steps; i++) {  // For every vertex, define its position
          this.cur.path.call(this, i / steps, false); 
          drawingPath[0].push(this.currentPathPos[0])
          drawingPath[1].push(this.currentPathPos[1])
          drawingPath[2].push(this.currentPathPos[2])
          drawingPath[3].push(this.currentPathPos[3])
      } 
      drawShapes(drawingPath)
    }

  },

  // This function is called by the "start" function and when clicking an svg image in the webpage, executed with the html code.
  // This function is responsible for setting the necessary parameters for the execution of the animation.
  // It takes as parameter the object containing the info about the animation to start.
  _start: function(play) {
    // Checks if the play object has a start method in it. if it does, it calls the method passing current animation
    // as argument (this)
    if (play.start) {
      play.start.call(this);
    }
    this.cur = play;              // Sets current animation to passed play object.
    this.startTime = Date.now();  // Sets start time of animation to right now.
  },

  // This function updates the platform position and rotation of current animation. Calculating the elapsed time
  // and applying necessary changes depending on it.
  // Called by: p.draw function on main HTML script.
  update: function(p) {

    // Set now variable to current date and time
    var now = Date.now();

    // Elapsed variable represents percentage of completion of the animation: 0 to 1, being 1 100% completed.
    var elapsed = (now - this.startTime) / this.cur.duration;

    // As the update function is called 60 times per second, whenever the elapsed time goes over 1, it will not be
    // by much of a difference. So adjust it to 1 and then make corresponding adjustments.
    if (elapsed > 1) {
      elapsed = 1
      this.stopDrawingPath = true
    }

    // Call fn function inside animation object to update this.translation and this.orientation, passing
    // as argument the elapsed variable.
    // Info on call() method: https://www.w3schools.com/js/js_function_call.asp
    this.cur.fn.call(this, elapsed, p);
    this.cur.path.call(this, elapsed, p)

    // Update platform position calling update function and passing on new position and orientation.
    this.platform.update(this.translation, this.orientation);
    
  }
};
