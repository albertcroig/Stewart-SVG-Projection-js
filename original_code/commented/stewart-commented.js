/**
 * @license Stewart.js v1.0.1 17/02/2019
 * https://raw.org/research/inverse-kinematics-of-a-stewart-platform/
 *
 * Copyright (c) 2019, Robert Eisele (robert@raw.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

// Start an anonymous function that takes a parameter named "root" and executes itself: IIFE (immeditaely invoked function expressions)
// An IIFE creates a private scope for the function's code and any variables it declares. This prevents them
// from unintentionally affecting or conflicting with variables and functions in the global namespace (usually the
// window object in browsers).
// https://www.udacity.com/blog/2023/03/immediately-invoked-function-expressions-iife-in-javascript.html
(function(root) {

  // Get the vertices of the "hexagonal" plates, used for both the base and the platform. We have 3 arguments:
  // inner radious, outer radious and the rotation of the plate.
  // Called by: Stewart.initHexagonal, Stewart.initCircular.
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
  // Called by the Animation.SVG function.
  // Parse an SVG path string and extract its individual
  // segments along with their parameters. The function processes the path string character by character, identifying 
  // commands (e.g., M, L, C, Q, A) and their associated parameters.
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

  // Constructor function for the Animation object that has a platform object as argument. Constructors are used to
  // create and initialize an object instance of a class. 
  // https://rollbar.com/blog/javascript-constructors/#:~:text=A%20constructor%20is%20a%20special,for%20any%20existing%20object%20properties.
  function Animation(platform) {

    // 'this.platform' holds the Stewart Platform object associated with the animation
    this.platform = platform;

    // 'this.orientation' represents the orientation of the animation using a Quaternion
    // Quaternion.ONE is an identity quaternion, indicating no rotation
    this.orientation = Quaternion.ONE;

    // 'this.translation' is a 3D array representing the translation of the animation in x, y, and z directions
    this.translation = [0, 0, 0];

    this.servoAngles = []

    // The 'start' method is called with the argument 'wobble' to initiate a specific type of animation
    this.start('wobble');
  }


  // This function is called when clicking at an SVG image displayed on screen, through the onclick event located in the
  // createSVGImage function in the main html script.
  // The purpose of this function is to take an SVG path string and convert it into a series of 3D animation
  // steps. The animation steps are then returned for further use. Check parseSVGPath() at line 44 for parsing SVG path to individual
  // segments for animation. 
  Animation.SVG = function(svg, box) {

    const PERSEC = 0.05;  // Speed of animation (5units per sec)
    const L = 0;         // Lower value for the z-coordinate
    const H = 0 - 10;    // Higher value for the z-coordinate

    const SCREEN_SIZE = 80; // 80x80

    var cur = {x: box.width / 2, y: box.height / 2, z: L};  // Current position in the SVG path, initialized to the center of the provided bounding box (box)
    var ret = [];        // Array to store animation steps

    // This function calculates the relative position of the given coordinates within the bounding box and adds an animation step to the ret array.
    // It calculates the relative position of the current position (cur) and updates it with the given coordinates (x, y, z).
    function move(x, y, z) {
      
      // Desired position relative to the bounding box, and scaling it to the screen size, then centering it in screen.
      var relX = (x - box.x) / box.width * SCREEN_SIZE - SCREEN_SIZE / 2;
      var relY = (y - box.y) / box.height * SCREEN_SIZE - SCREEN_SIZE / 2;

      // Current position relative to the bounding box, and scaling it to the screen size, then centering it in screen.
      var relCurX = (cur.x - box.x) / box.width * SCREEN_SIZE - SCREEN_SIZE / 2;
      var relCurY = (cur.y - box.y) / box.height * SCREEN_SIZE - SCREEN_SIZE / 2;

      // Push desired position to array, as well as origin command and animation time. Time is calculated subtracting
      // desired position by current position, then dividing by speed. (distance / distance/time = time)
      ret.push({orig: s.cmd, x: relX, y: relY, z: z, t: Math.hypot(relX - relCurX, relY - relCurY, z - cur.z) / PERSEC});

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
          move(cur.x, cur.y, H);
          move(s.x, s.y, H);
          move(s.x, s.y, L);
          break;
        case 'line':
          move(s.x2, s.y2, L);
          break;
        case 'quadratic':
        case 'cubic':
          var b = s.bezier.getLUT();

          for (var j = 0; j < b.length; j++) {
            move(b[j].x, b[j].y, L);
          }
          break;
        case 'arc':
          // https://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
          var x1 = cur.x;
          var y1 = cur.y;

          var x2 = s.x;
          var y2 = s.y;

          var axisRotation = s.axisRotation;
          var largeArcFlag = s.largeArcFlag;
          var sweepFlag = s.sweepFlag;

          var rx = s.rx;
          var ry = s.ry;

          // Step 1: x1', y1'
          var x1_ = Math.cos(axisRotation) * (x1 - x2) / 2.0 + Math.sin(axisRotation) * (y1 - y2) / 2.0;
          var y1_ = -Math.sin(axisRotation) * (x1 - x2) / 2.0 + Math.cos(axisRotation) * (y1 - y2) / 2.0;

          // Step 2: cx', cy'
          var s = (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt((rx * rx * ry * ry - rx * rx * y1_ * y1_ - ry * ry * x1_ * x1_) / (rx * rx * y1_ * y1_ + ry * ry * x1_ * x1_));

          var cx_ = s * rx * y1_ / ry;
          var cy_ = s * -ry * x1_ / rx;

          // Step 3: cx, cy
          var cx = (x1 + x2) / 2.0 + Math.cos(axisRotation) * cx_ - Math.sin(axisRotation) * cy_;
          var cy = (y1 + y2) / 2.0 + Math.sin(axisRotation) * cx_ + Math.cos(axisRotation) * cy_;


          // Step 4:

          var angleBetween = function(ux, uy, vx, vy) {

            var cosPhi = (ux * vx + uy * vy) / Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));

            return (ux * vy < uy * vx ? -1 : 1) * Math.acos(cosPhi);
          };

          // initial angle
          var theta1 = angleBetween(
                  1, 0,
                  (x1_ - cx_) / rx, (y1_ - cy_) / ry);

          // angle delta
          var thetad = angleBetween(
                  (x1_ - cx_) / rx, (y1_ - cy_) / ry,
                  (-x1_ - cx_) / rx, (-y1_ - cy_) / ry);

          if (sweepFlag === 0 && thetad > 0) {
            thetad -= 2 * Math.PI;
          } else if (sweepFlag === 1 && thetad < 0) {
            thetad += 2 * Math.PI;
          }

          var steps = Math.ceil(Math.abs(thetad * Math.max(rx, ry)) / 2); // every two degree
          for (var j = 0; j <= steps; j++) {
            var phi = theta1 + thetad * (j / steps);

            var x = rx * Math.cos(phi);
            var y = ry * Math.sin(phi);

            var x_ = x * Math.cos(axisRotation) - y * Math.sin(axisRotation);
            var y_ = x * Math.sin(axisRotation) + y * Math.cos(axisRotation);

            move(cx + x_, cy + y_, L);
          }
      }
    }
    //console.log(Animation.Interpolate(ret))
    //console.log(ret)
    return Animation.Interpolate(ret);
  };

  // This function is called by Animation.SVG function.
  // It creates the "normalized" animation type object that needs to be passed as argument to the _start function. This
  // takes as argument the array that stores the animation steps, created by the Animation.SVG function.
  Animation.Interpolate = function(data) {

    var duration = 0; // Initialize duration variable to 0
    for (var i = 1; i < data.length; i++) {  // Add all the durations of the whole animation steps together
      duration += data[i].t;
    }

    return {   // Return the normalized object for animation.
      duration: duration,
      pathVisible: true,
      next: null,
      fn: function(pct) {

        this.orientation = Quaternion.ONE;  // Don't modify orientation

        var pctStart = 0;  // Variable for starting progress of animation (initialize to 0%)

        for (var i = 1; i < data.length; i++) {  // For every step of the animation

          var p = data[i];  // from now on p = current step of animation

          var pctEnd = pctStart + p.t / duration; // calculate the percentage of animation transcurred up until this step

          if (pctStart <= pct && pct < pctEnd) {  // Execute code below only for step in selected pct (percentage) range.

            var scale = (pct - pctStart) / (pctEnd - pctStart); // Variable scale to calculate how far the animation is in selected step. (0 to 1)

            var prev = i === 0 ? data[0] : data[i - 1];  // Previous step, if i = 0 (meaning first step of animation), previous step is same step, otherwise its i-1

            // Set the new location with previous' step location + its difference multiplied by completion progress of step.
            this.translation[0] = prev.x + (p.x - prev.x) * scale; 
            this.translation[1] = prev.y + (p.y - prev.y) * scale;
            this.translation[2] = prev.z + (p.z - prev.z) * scale;

            return; // Once the if condition is true, there is no need to continue with the loop, so return.
          }
          pctStart = pctEnd; // Assign the start pct to the end pct for continuing the loop.
        }

        // Set to last element in chain, that isn't considered on the for loop.
        this.translation[0] = data[data.length - 1].x;
        this.translation[1] = data[data.length - 1].y;
        this.translation[2] = data[data.length - 1].z;
      },

    };
  };

  // We use prototype in order to add methods that intrinsically belong to an object.
  // We define this methods ONCE inside the prototype, and every instance of an object will check the prototype
  // to run the method. If we hardcoded it inside the Animation constructor, then the same method would be defined
  // for every instance of object, wasting memory.
  // https://www.youtube.com/watch?v=4jb4AYEyhRc
  Animation.prototype = {
    cur: null,          // Current animation step
    next: null,         // Next animation step
    startTime: 0,
    platform: null,
    translation: null,
    orientation: null,
    pathVisible: true,  // Initialize visible path to true, then it can change depending on the type of animation or user's interaction.
    
    // Toggles visibility of the path
    toggleVisiblePath: function() {
      this.pathVisible = !this.pathVisible;
    },
    drawPath: function(p) {

      // If path visibility is off, then end the function here (don't draw path)
      if (!this.pathVisible || !this.cur.pathVisible)
        return;

      // Draw path shape with p.beginShape()
      p.beginShape();         // Tell the program I want to draw a shape with some vertices
      p.noFill();             // Background of shape transparent
      p.stroke(255, 0, 0);    // Contour of shape color red
      var steps = 1000;       // Number of vertices of the shape
      for (var i = 0; i <= steps; i++) {  // For every vertex, define its position
        // Calls the fn function inside the current animation object and passes as argument i/steps, which represents the progress
        // ratio of the animation (0 to 1). This sets a value for this.translation
        this.cur.fn.call(this, i / steps, p); 

        // Once defined the position and rotaton of the vertex of "this", create a vertex.
        p.vertex(this.translation[0], this.translation[1], this.translation[2] + this.platform.T0[2]);
      }
      p.endShape();
    },

    // This function is called when creating the animation object, passing 'wobble' (default) as argument. It's also called
    // when pressing a key using the document.onkeydown(e) function of the html file script.
    // It takes as parameter t the type of animation: could be 'wobble','tilt', etc.
    // Its purpose is to initialize the animation, only for the predefined animations.
    // This function executes to initialize all predefined animations. SVG's animations directly use the _start function.
    start: function(t) {      

      // This if statement checks if the passed parameter is inside the object "map", defined at the end of this prototype.
      // Then, if you pass the argument as 'w', this converts it to 'wobble'. If you pass it as 'wobble', it stays like this.
      if (this.map[t]) { 
        t = this.map[t]; 
      }

      // Here it checks if the t parameter is within the defined animations, with the fn object, that contains all the defined
      // animations. If the passed parameter is not in it, then it console logs "Failed" and ends the function, as the passed parameter is wrong.
      // If the t parameter is within the fn object (defined animation), then it executes the _start function to start with the animation.
      // The _start function executed here passes as parameters the object related to the corresponding animation, and the name of the next animation.
      if (!this.fn[t]) {
        console.log("Failed ", t);
        return;
      } else {
        this._start(this.fn[t], this.fn[t].next); 
      }
    },

    // This function is called by the "start" function and when clicking an svg image in the webpage, executed with the html code.
    // This function is responsible for setting the necessary parameters for the execution of the animation.
    // It takes in two parameters: the object containing the info about the animation to start, and the name
    // (as string) of the next animation.
    _start: function(play, next) {
      // Checks if the play object has a start method in it. if it does, it calls the method.
      if (play.start) {
        play.start.call(this);
      }
      this.cur = play;              // Sets current animation to passed play object.
      this.next = next;             // Sets next animation to passed next string.
      this.startTime = Date.now();  // Sets start time of animation to right now.
    },
    moveTo: function(nt, no, time, next) {

      var ot = this.translation.slice();
      var oo = this.orientation.clone();
      var tw = oo.slerp(no);

      this.cur = {
        duration: time,
        pathVisible: false,
        fn: function(pct) {
          this.orientation = tw(pct);
          this.translation = [
            ot[0] + pct * (nt[0] - ot[0]),
            ot[1] + pct * (nt[1] - ot[1]),
            ot[2] + pct * (nt[2] - ot[2])
          ];
        }
      };
      this.startTime = Date.now();
      this.next = next;
    },

    // This function updates the platform position of current animation. Calculating the elapsed time and applying necessary changes
    // depending on it.
    // Called by: p.draw function on main HTML script.
    update: function(p) {

      // Set now variable to current date and time
      var now = Date.now();

      // Elapsed variable represents percentage of completion of the animation: 0 to 1, being 1 100% completed.
      var elapsed = (now - this.startTime) / this.cur.duration;

      // As the update function is called 60 times per second, whenever the elapsed time goes over 1, it will not be
      // by much of a difference. So adjust it to 1 and then make corresponding adjustments.
      if (elapsed > 1)
        elapsed = 1;

      // Call fn function inside animation object to update this.translation and this.orientation, passing
      // as argument the elapsed variable.
      // Info on call() method: https://www.w3schools.com/js/js_function_call.asp
      this.cur.fn.call(this, elapsed, p);

      // If the animation is completed and there is a next animation, then start the next animation.
      if (elapsed === 1 && this.cur.duration !== 0 && this.next !== null) {
        this.start(this.next);
      }

      // Update platform position calling update function and passing on new position and orientation.
      this.platform.update(this.translation, this.orientation);
    },

    // This fn object contains all the predefined animations. Each animation inside this object is another object, with the needed
    // parameters to run the other functions: duration of the animation, visibility of the path, and next animation (same animation,
    // so that it executes in a loop). The last parameter of the animation object is, for most cases, a function (also called fn, do not confuse)
    // containing the data of the movements. Its argument is pct, which stands for percentage of animation completion (0 to 1).
    fn: {
      rotate: {
        duration: 4000,  // 4 seconds
        pathVisible: false,
        next: 'rotate',
        fn: function(pct) {

          // Calculate angle that platform needs to rotate depending on completion percentage
          // Math.pow() function: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow
          // Visualize angles in geogebra: https://www.geogebra.org/graphing; f(x)=((sen^(5)(x*2 π-8 π))/(2))
          var b = Math.pow(Math.sin(pct * Math.PI * 2 - Math.PI * 8), 5) / 2;
          // console.log('Platform is rotating by '+ Math.round(b*180/Math.PI*1000)/1000 + ' degrees.')

          // Set movement = 0 since the platform only rotates
          this.translation[0] = 0; // Set x movement = 0
          this.translation[1] = 0; // Set y movement = 0
          this.translation[2] = 0; // Set z movement = 0

          // Set orientation only to z axis and move by b angle.
          this.orientation = Quaternion.fromAxisAngle([0, 0, 1], b); 
        }
      },
      tilt: {
        duration: 7000,
        pathVisible: false,
        next: 'tilt',
        fn: function(pct) {

          var a = 0; // Angle a, used to calculate rotation vector x and y.
          var z = 0; // z component of rotation vector

          // Separate animation in 4 parts. 
          if (pct < 1 / 4) {           // If completion percentage is < 25%
            pct = pct * 4;          
            a = 0;                     // a = 0, z = 0, x = 0, y = -1
          } else if (pct < 1 / 2) {    // If completion percentage is > 25% and < 50%
            pct = (pct - 1 / 4) * 4;
            a = 1 * Math.PI / 3;       // a = 60º, z = 0, x = 0.87, y = -1/2
          } else if (pct < 3 / 4) {    // If completion percentage is > 50% and < 75%
            pct = (pct - 1 / 2) * 4;
            a = 2 * Math.PI / 3;       // a = 120º, z = 0, x = 0.87, y = 1/2
          } else {                     // If completion percentage is > 75% and < 100%
            pct = (pct - 3 / 4) * 4;
            z = 1;                     // a = 0, z = 1, x = 0, y = -1
          }

          var x = 0;
          var y = 0;

          if (z === 0) {
            x = Math.sin(a);
            y = -Math.cos(a);
          }

          var b = Math.pow(Math.sin(pct * Math.PI * 2 - Math.PI * 8), 5) / 3;  // Angle taken from rotate animation
          //console.log('Platform is rotating by '+ Math.round(b*180/Math.PI*1000)/1000 + ' degrees.')

          // Set movement = 0 since the platform only rotates
          this.translation[0] = 0; // Set x movement = 0
          this.translation[1] = 0; // Set y movement = 0
          this.translation[2] = 0; // Set z movement = 0

          this.orientation = Quaternion.fromAxisAngle([x, y, z], b);
        }
      },
      square: (function() {
        var tmp = Animation.Interpolate([
          {x: -30, y: -30, z: 0 + 10, t: 0},
          {x: -30, y: 30, z: 0, t: 1000},
          {x: 30, y: 30, z: +10, t: 1000},
          {x: 30, y: -30, z: 0, t: 1000},
          {x: -30, y: -30, z: 0 + 10, t: 1000},
        ]);
        tmp.next = "square";
        return tmp;
      })(),
      wobble: {
        duration: 3000,
        pathVisible: false,
        next: 'wobble',
        fn: function(pct) {

          var b = pct * 2 * Math.PI;

          this.translation[0] = Math.cos(-b) * 13;
          this.translation[1] = Math.sin(-b) * 13;
          this.translation[2] = 0;
          this.orientation = new Quaternion(-13, -Math.cos(b), Math.sin(b), 0).normalize();
        }
      },
      breathe: {
        duration: 5000,
        pathVisible: false,
        next: 'breathe',
        fn: function(pct) {

          var y = (Math.exp(Math.sin(2 * Math.PI * pct) - 1)) / (Math.E * Math.E - 1);

          this.translation = [0, 0, y * 50];
          this.orientation = Quaternion.ONE;
        }
      },
      eight: {
        duration: 3500,
        pathVisible: true,
        next: 'eight',
        fn: function(pct) {
          var t = (-0.5 + 2.0 * pct) * Math.PI;
          this.translation = [Math.cos(t) * 30, Math.sin(t) * Math.cos(t) * 30, 0];
          this.orientation = Quaternion.ONE;
        }
      },
      lissajous: {
        duration: 10000,
        pathVisible: true,
        next: 'lissajous',
        fn: function(pct) {
          this.translation = [(Math.sin(3 * pct * 2 * Math.PI) * 30), (Math.sin(pct * 2 * 2 * Math.PI) * 30), 0];
          this.orientation = Quaternion.ONE;
        }
      },
      helical: {
        duration: 5000,
        pathVisible: true,
        next: null,
        fn: function(pct) {
          pct = 1 - pct;
          this.translation = [(Math.cos(pct * Math.PI * 8) * 20), (Math.sin(pct * Math.PI * 8) * 20), pct * 20];
          this.orientation = Quaternion.ONE;
        }
      },
      mouse: {
        duration: 0,
        pathVisible: false,
        next: null,
        fn: function(pct, p) {
          this.translation = [(p.mouseX - 512) / 10, (p.mouseY - 382) / 10, 0];
          this.orientation = Quaternion.ONE;
        }
      }, /*
       perlin: (function() {
       
       var xoff = 0;
       var yoff = 0;
       
       
       return {
       duration: 0,
       fn: function(none, p) {
       
       var b = p.noise(xoff, xoff) * 2 * Math.PI;
       
       this.translation[0] = Math.cos(-b) * 13;
       this.translation[1] = Math.sin(-b) * 13;
       this.translation[2] = 0;
       this.orientation = new Quaternion(-13, -Math.cos(b), Math.sin(b), 0).normalize();
       
       
       xoff += 0.0001;
       yoff += 0.0001;
       }
       }
       })(),*/
      gamepad: (function() {

        var gamepadActive = false;
        if (root.addEventListener) {
          root.addEventListener("gamepadconnected", function(e) {
            gamepadActive = true;
          });

          root.addEventListener("gamepaddisconnected", function(e) {
            gamepadActive = false;
          });
        }

        return {
          duration: 0,
          pathVisible: false,
          next: null,
          start: function() {
            this.orientation = Quaternion.ONE;
            this.translation = [0, 0, 0];
            if (gamepadActive) {
              alert("Use the joysticks and L1 button");
            } else {
              alert("Plug in a Playstation or Xbox controller and use the joysticks");
            }
          },
          fn: function() {

            if (!gamepadActive) {
              return;
            }

            var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
            var buttons = gamepads[0].buttons;
            var axes = gamepads[0].axes;

            if (buttons[6].value) { // Is L1 pressed?
              // Rotate around Z axis with joystick 2 left-right
              this.orientation = Quaternion.fromAxisAngle([0, 0, 1], -axes[3] * Math.PI / 6);
              this.translation = [0, 0, 0];
            } else {
              // Control with both joysticks
              var b = Math.atan2(-axes[3], -axes[2]);
              this.translation = [axes[1] * 30, axes[0] * 30, 0];
              this.orientation = new Quaternion(-13, -Math.cos(b), Math.sin(b), 0).normalize();
            }
          }
        };
      })()
    },

    // Object that simply binds the names of the predefined animations to their corresponding keys in the keyboard
    map: {
      q: "square",
      w: "wobble",
      e: "eight",
      r: "rotate",
      t: "tilt",
      y: "lissajous",

      m: "mouse",
      g: "gamepad",
      b: "breathe",
      h: "helical",
      p: "perlin"
    }
  };

  // Constructor function for the stewart platform object.
  function Stewart() {}

  Stewart.prototype = {
    translation: null,
    orientation: null,

    drawBasePlate: null,
    drawPlatformPlate: null,

    rodLength: 0,
    hornLength: 0,
    hornDirection: 0,
    servoRange: null,
    servoRangeVisible: false,

    sinBeta: [], // Sin of Pan angle of motors in base plate
    cosBeta: [], // Cos of Pan angle of motors in base plate
    B: [], // base joints in base frame
    P: [], // platform joints in platform frame

    q: [], // vector from base origin to Pk
    l: [], // vector from B to P
    H: [], // servo horn end to mount the rod

    T0: [], // Initial offset

    // Function to initialize the stewart platform
    init: function(opts) {

      // Set initial parameters for the Stewart platform
      this.rodLength = opts.rodLength;
      this.hornLength = opts.hornLength;
      this.hornDirection = opts.hornDirection;
      this.drawBasePlate = opts.drawBasePlate;
      this.drawPlatformPlate = opts.drawPlatformPlate;
      this.servoRange = opts.servoRange;
      this.servoRangeVisible = opts.servoRangeVisible;

      // Initialize arrays to store base and platform joints, sinBeta, cosBeta, q, l, and H
      this.B = [];       // base joints in base frame
      this.P = [];       // platform joints in platform frame
      this.q = [];       // vector from base origin to Pk
      this.l = [];       // vector from B to P
      this.H = [];       // servo horn end to mount the rod
      this.sinBeta = []; // Sin of Pan angle of motors in base plate
      this.cosBeta = []; // Cos of Pan angle of motors in base plate

      // Get the legs configuration using the provided function
      var legs = opts.getLegs.call(this);

      // Initialize arrays based on the legs configuration
      for (var i = 0; i < legs.length; i++) {
        this.B.push(legs[i].baseJoint);
        this.P.push(legs[i].platformJoint);
        this.sinBeta.push(Math.sin(legs[i].motorRotation));
        this.cosBeta.push(Math.cos(legs[i].motorRotation));
        this.q.push([0, 0, 0]);
        this.l.push([0, 0, 0]);
        this.H.push([0, 0, 0]);
      }

      // Set the initial offset T0 based on absolute height or rod and horn lengths
      if (opts.absoluteHeight) {
        this.T0 = [0, 0, 0];
      } else {
        // Relative height measure formula on paper: z = sqrt(d^2+h^2-(px-bx)^2-(py-by)^2)
        this.T0 = [0, 0, Math.sqrt(this.rodLength * this.rodLength + this.hornLength * this.hornLength
                  - Math.pow(this.P[0][0] - this.B[0][0], 2)
                  - Math.pow(this.P[0][1] - this.B[0][1], 2))];
      }

    },

    // Initiate circular disposition of both base and platform
    initCircular: function(opts) {

      if (!opts)
        opts = {};

      var baseRadius = opts.baseRadius || 80; // 8cm
      var platformRadius = opts.platformRadius || 50; // 5cm

      // Circle segment s = alpha_deg / 180 * pi * R <=> alpha_deg = s / R / pi * 180 <=> alpha_rad = s / R
      var shaftDistance = (opts.shaftDistance || 20) / baseRadius;
      var anchorDistance = (opts.anchorDistance || 20) / baseRadius;

      var rodLength = opts.rodLength || 130;

      var hornLength = opts.hornLength || 50;
      var hornDirection = opts.hornDirection || 0;

      var servoRange = opts.servoRange || [-Math.PI / 2, Math.PI / 2];
      var servoRangeVisible = opts.servoRangeVisible === undefined ? false : opts.servoRangeVisible;

      this.init({
        rodLength: rodLength,
        hornLength: hornLength,
        hornDirection: hornDirection,
        servoRange: servoRange,
        servoRangeVisible: servoRangeVisible,

        getLegs: function() {
          var legs = [];
          for (var i = 0; i < 6; i++) {

            var pm = Math.pow(-1, i);
            var phiCut = (1 + i - i % 2) * Math.PI / 3;

            var phiB = (i + i % 2) * Math.PI / 3 + pm * shaftDistance / 2;
            var phiP = phiCut - pm * anchorDistance / 2;

            legs.push({
              baseJoint: [Math.cos(phiB) * baseRadius, Math.sin(phiB) * baseRadius, 0],
              platformJoint: [Math.cos(phiP) * platformRadius, Math.sin(phiP) * platformRadius, 0],
              motorRotation: phiB + ((i + hornDirection) % 2) * Math.PI + Math.PI / 2
            });
          }
          return legs;
        },
        drawBasePlate: function(p) {
          p.stroke(0);
          p.fill(0xFE, 0xF1, 0x35);
          p.ellipse(0, 0, 2 * baseRadius, 2 * baseRadius);
        },
        drawPlatformPlate: function(p) {
          p.stroke(0);
          p.fill(0x2A, 0xEC, 0xFD);
          p.ellipse(0, 0, 2 * platformRadius, 2 * platformRadius);
        }
      });
    },

    // This function is called once from the html script in the p.setup() function.
    // This function initializes the Stewart platform with a hexagonal configuration, defining the base and platform geometry along with other parameters.
    // It also uses the init function to set up the common configuration for the Stewart platform.
    initHexagonal: function(opts) {

      // Set default values if opts is not provided
      if (!opts)
        opts = {};

      // Define parameters for the hexagonal configuration
      var baseRadius = opts.baseRadius || 80; // 8cm
      var baseRadiusOuter = opts.baseRadiusOuter || 110; // 11cm
      var platformRadius = opts.platformRadius || 50; // 5cm
      var platformRadiusOuter = opts.platformRadiusOuter || 80; // 8cm

      // If opts.platformTurn is undefined, set platformTurn to true; otherwise, set it to the value of opts.platformTurn
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator
      var platformTurn = opts.platformTurn === undefined ? true : opts.platformTurn;

      var rodLength = opts.rodLength || 130;          // length of the rod connected to servo
      var hornLength = opts.hornLength || 40;         // length of servo
      var hornDirection = opts.hornDirection || 0;    // beta angle of servo

      var shaftDistance = opts.shaftDistance || 20;   // Distance between servos fixing points on base on each side
      var anchorDistance = opts.anchorDistance || 20; // Distance between servos fixing points on platform on each side
  
      // Generate points for the hexagonal base plate and platform plate
      var baseInts = getHexPlate(baseRadius, baseRadiusOuter, 0);  // Base vertices
      var platformInts = getHexPlate(platformRadius, platformRadiusOuter, platformTurn ? Math.PI : 0);  // Platform vertices

      // Define servo range and visibility
      var servoRange = opts.servoRange || [-Math.PI / 2, Math.PI / 2];
      var servoRangeVisible = opts.servoRangeVisible === undefined ? false : opts.servoRangeVisible;

      // Execute init function with specific opts argument as anonymous object for hexagonal configuration
      this.init({
        rodLength: rodLength,
        hornLength: hornLength,
        hornDirection: hornDirection,
        servoRange: servoRange,
        servoRangeVisible: servoRangeVisible,
        getLegs: function() { // Define getLegs function for hexagonal configuration
          var legs = [];
          var basePoints = [];
          var platPoints = [];
          var motorAngle = [];

          // For every leg (from i=0 to i=5)
          for (var i = 0; i < 6; i++) {

            var midK = i | 1;  // Get the next odd number from i. ex: if i=0, then midK=1, i=2:midK=3
            var baseCx = baseInts[midK].x;  // Get x value of one of the vertex of the base
            var baseCy = baseInts[midK].y;  // Get y value of one of the vertex of the base
            var baseNx = baseInts[(midK + 1) % 6].x;  // Get x value of the next vertex
            var baseNY = baseInts[(midK + 1) % 6].y;  // Get y value of the next vertex

            // Do the same with the platform
            var platCx = platformInts[midK].x;
            var platCy = platformInts[midK].y;
            var platNx = platformInts[(midK + 1) % 6].x;
            var platNY = platformInts[(midK + 1) % 6].y;

            var baseDX = baseNx - baseCx; // Subtract current vertex and next vertex to get X Length of base side
            var baseDY = baseNY - baseCy; // Subtract current vertex and next vertex to get Y Length of base side

            // Math.hypot method: https://www.w3schools.com/python/ref_math_hypot.asp#:~:text=The%20math.,x%20%2B%20y*y).
            var lenBaseSide = Math.hypot(baseDX, baseDY); // Total length of base side

            var pm = Math.pow(-1, i); //(-1)^i, if i=0, pm=1, otherwise pm=-1

            var baseMidX = (baseCx + baseNx) / 2; // Get X midpoint of the base side
            var baseMidY = (baseCy + baseNY) / 2; // Get Y midpoint of the base side

            var platMidX = (platCx + platNx) / 2; // Get X midpoint of the platform side
            var platMidY = (platCy + platNY) / 2; // Get Y midpoint of the platform side

            baseDX /= lenBaseSide; // calculate cos(alpha) or sin(alpha), depending on the angle          
            baseDY /= lenBaseSide; // calculate cos(alpha) or sin(alpha), depending on the angle          

            // calculate base and platform points 
            basePoints.push([baseMidX + baseDX * shaftDistance * pm, baseMidY + baseDY * shaftDistance * pm, 0]); 
            platPoints.push([platMidX + baseDX * anchorDistance * pm, platMidY + baseDY * anchorDistance * pm, 0]);
            motorAngle.push(Math.atan2(baseDY, baseDX) + ((i + hornDirection) % 2) * Math.PI);
          }

          var platformIndex = [0, 1, 2, 3, 4, 5];

          if (platformTurn) {
            platformIndex = [4, 3, 0, 5, 2, 1];
          }

          for (var i = 0; i < basePoints.length; i++) {
            legs.push({
              baseJoint: basePoints[i],
              platformJoint: platPoints[platformIndex[i]],
              motorRotation: motorAngle[i]
            });
          }

          return legs;
        },
        drawBasePlate: function(p) { // Called periodically, draw the plate of the platform using the base vertex retrieved with getHexPlate
          p.stroke(0);
          p.fill(0xFE, 0xF1, 0x35);

          p.beginShape();
          for (var i = 0; i < baseInts.length; i++) {
            p.vertex(baseInts[i].x, baseInts[i].y);
          }
          p.endShape(p.CLOSE);
        },
        drawPlatformPlate: function(p) { // Called periodically, draw the plate of the platform using the base vertex retrieved with getHexPlate
          p.stroke(0);
          p.fill(0x2A, 0xEC, 0xFD);

          p.beginShape();
          for (var i = 0; i < platformInts.length; i++) {
            p.vertex(platformInts[i].x, platformInts[i].y);
          }
          p.endShape(p.CLOSE);
        }
      });
    },
    // This function is called from the main html script, on the draw function. So it's called continuously.
    // Draw the coordinate system axes and also draw the base plate and the platform plate, as well as all other objects:
    // legs, base joints, platform joints.
    draw: (function() {

      // Defining the function to draw a cone, used later for the cooridnate axes.
      function drawCone(p, radius, h) {

        var sides = 12;
        var angle = 0;
        var angleIncrement = 2 * Math.PI / sides;
        p.beginShape(p.TRIANGLE_STRIP);
        for (var i = 0; i <= sides; i++) {
          p.vertex(0, 0, 0);
          p.vertex(radius * Math.cos(angle), h, radius * Math.sin(angle));
          angle += angleIncrement;
        }
        p.endShape();

        angle = 0;
        p.beginShape(p.TRIANGLE_FAN);

        p.vertex(0, h, 0);
        for (var i = 0; i < sides + 1; i++) {
          p.vertex(radius * Math.cos(angle), h, radius * Math.sin(angle));
          angle += angleIncrement;
        }
        p.endShape();
      }

      // Defining the function to draw the frame: containing the 3 lines and the 3 cones.
      function drawFrame(p) {

        var w = 40;
        var ch = 10; // cone head

        // Draw 3 lines
        p.push();
        p.strokeWeight(2);
        p.stroke(255, 0, 0); // rot=x
        p.line(0, 0, 0, w, 0, 0);
        p.stroke(0, 255, 0); // grün=y
        p.line(0, 0, 0, 0, w, 0);
        p.stroke(0, 0, 255); // blau=z
        p.line(0, 0, 0, 0, 0, w);
        p.pop();

        // Red Cone
        p.push();
        p.noStroke();
        p.fill(255, 0, 0);
        p.rotateZ(Math.PI / 2);
        p.translate(0, -w - ch, 0);
        drawCone(p, 3, ch);
        p.pop();

        // Green Cone
        p.push();
        p.noStroke();
        p.fill(0, 255, 0);
        p.rotateX(-Math.PI);
        p.translate(0, -w - ch, 0);
        drawCone(p, 3, ch);
        p.pop();

        // Blue Cone
        p.push();
        p.noStroke();
        p.fill(0, 0, 255);
        p.rotateX(-Math.PI / 2);
        p.translate(0, -w - ch, 0);
        drawCone(p, 3, ch);
        p.pop();
      }

      // Using a return function to define the statements of draw, not necessary.
      return function(p) {

        // Base Frame
        drawFrame(p);

        // Base plate
        p.push();
        this.drawBasePlate.call(this, p);

        // Platform plate
        p.translate(this.translation[0], this.translation[1], this.translation[2] + this.T0[2]);

        p.applyMatrix.apply(p, this.orientation.conjugate().toMatrix4()); //IMPORTANT

        this.drawPlatformPlate.call(this, p);

        // Platform Frame
        drawFrame(p);
        p.pop();

        for (var i = 0; i < this.B.length; i++) {
          // Base Joints
          p.push();
          p.translate(this.B[i][0], this.B[i][1], this.B[i][2]);
          p.noStroke();
          p.fill(0);
          p.sphere(3);
          p.pop();

          // Platform Joints
          p.push();
          p.translate(this.q[i][0], this.q[i][1], this.q[i][2]);
          p.noStroke();
          p.fill(255, 0, 0);
          p.sphere(3);
          p.pop();

          // A -> q rods
          p.push();
          p.stroke(255, 0, 0);
          p.strokeWeight(1);
          p.line(this.H[i][0], this.H[i][1], this.H[i][2], this.q[i][0], this.q[i][1], this.q[i][2]);
          //p.pop();

          // Base -> A rods
          //p.push();
          p.stroke(0);
          // p.strokeWeight(1);
          p.line(this.B[i][0], this.B[i][1], this.B[i][2], this.H[i][0], this.H[i][1], this.H[i][2]);
          p.pop();

          if (this.servoRangeVisible) {
            p.push();
            p.translate(this.B[i][0], this.B[i][1], this.B[i][2]);
            p.rotateX(Math.PI / 2);
            p.rotateY(Math.atan2(this.H[i][1] - this.B[i][1], this.H[i][0] - this.B[i][0]));
            p.fill('rgba(255,0,0,0.1)');
            p.noStroke();
            p.arc(0, 0, 2 * this.hornLength, 2 * this.hornLength, this.servoRange[0], this.servoRange[1], p.PIE);
            p.pop();
          }
        }
      };

    })(),
    // It's called by the function animation.update() from the animation object. And this function is called constantly because
    // it's located in the draw function in the main html script. 
    // Updates the position of the elements in the system, based on the translation and orientation calculated by the animation object.
    update: function(translation, orientation) {

      var hornLength = this.hornLength;
      var rodLength = this.rodLength;

      var q = this.q;     // vector from base origin to Pk
      var l = this.l;     // vector from B to P
      var B = this.B;     // base joints in base frame
      var P = this.P;     // platform joints in platform frame
      var H = this.H;     // servo horn end to mount the rod
      var z = this.T0[2]; // Initial offset

      this.translation = translation;
      this.orientation = orientation;

      // Calculate H, q and l
      for (var i = 0; i < B.length; i++) {

        // Performing a quaternion rotation based on orientation to vector pk (see paper)
        var o = orientation.rotateVector(P[i]);

        // Simplifying variable names so they can be referenced faster
        var li = l[i];
        var qi = q[i];
        var Hi = H[i];
        var Bi = B[i];

        // Vector from base origin to Pk (platform joint), using formula in paper: qk = T + R x pk x R(conjugate)
        qi[0] = translation[0] + o[0];      // x value
        qi[1] = translation[1] + o[1];      // y value
        qi[2] = translation[2] + o[2] + z;  // z value

        // Vector from B to P (from base anchor to platform anchor), using formula in paper: lk = qk - bk = T + R x pk x R(conjugate) - bk
        li[0] = qi[0] - Bi[0];
        li[1] = qi[1] - Bi[1];
        li[2] = qi[2] - Bi[2];

        // Calculating parameters from the trigonometric identity, see paper. Where d = rodLength and h = hornLength
        var gk = li[0] * li[0] + li[1] * li[1] + li[2] * li[2] - rodLength * rodLength + hornLength * hornLength;
        var ek = 2 * hornLength * li[2];
        var fk = 2 * hornLength * (this.cosBeta[i] * li[0] + this.sinBeta[i] * li[1]);

        // Applying last formulas
        var sqSum = ek * ek + fk * fk;
        var sqrt1 = Math.sqrt(1 - gk * gk / sqSum);
        var sqrt2 = Math.sqrt(sqSum);
        var sinAlpha = (gk * ek) / sqSum - (fk * sqrt1) / sqrt2;
        var cosAlpha = (gk * fk) / sqSum + (ek * sqrt1) / sqrt2;

        // Calculate endpoint of sevo horn that intersects with servo rod.
        Hi[0] = Bi[0] + hornLength * cosAlpha * this.cosBeta[i];
        Hi[1] = Bi[1] + hornLength * cosAlpha * this.sinBeta[i];
        Hi[2] = Bi[2] + hornLength * sinAlpha;
      }
    },

    // While not necessary for the execution of the visual representation, this function is strictly essential if we want
    // to work with a real prototype, since the only variable we are going to enter to the servos is the value of their rotation.
    // This calculates each of the angles the servos have to rotate to accomplish a specific position of the horn edge (H), 
    // using basic trigonometric functions described in the paper.
    getServoAngles: function() {
      var ret = [];
      for (var i = 0; i < this.B.length; i++) {
        ret[i] = Math.asin((this.H[i][2] - this.B[i][2]) / this.hornLength);
        if (isNaN(ret[i])) {
          // Rod too short
          ret[i] = null;
        } else if (!(this.servoRange[0] <= ret[i] && ret[i] <= this.servoRange[1])) {
          // Out of range
          ret[i] = null;
        }

      }
      return ret;
    }
  };


  // Defining a module that can be used in both CommonJS and AMD environments. It leverages
  // the exports object for exports in CommonJS and relies on the global root variable in 
  // non-CommonJS environments (potentially AMD).
  if (typeof exports === "object") {
    Object.defineProperty(exports, "__esModule", {'value': true});
    Stewart['default'] = Stewart;
    Stewart['Stewart'] = Stewart;
    Stewart['Animation'] = Animation;
    module['exports'] = Stewart;
  } else {
    root.Animation = Animation;
    root.Stewart = Stewart;
  }
})(this); //(this) executes the anonymous function, with itself as parameter.

