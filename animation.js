/**
 * @license Stewart.js v1.0.1 17/02/2019
 * https://raw.org/research/inverse-kinematics-of-a-stewart-platform/
 *
 * Copyright (c) 2019, Robert Eisele (robert@raw.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

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
  this.translation = [0, 0, 0, 0];

  this.servoAngles = []
  this.getServos = false
  this.servoAnglesToPrint = []

  // The 'start' method is called with the argument 'wobble' to initiate a specific type of animation
  this.start('wobble');
}

// This function is called when clicking at an SVG image displayed on screen, through the onclick event located in the
// createSVGImage function in the main html script.
// The purpose of this function is to take an SVG path string and convert it into a series of 3D animation
// steps. The animation steps are then returned for further use. Check parseSVGPath() at line 44 for parsing SVG path to individual
// segments for animation. 
Animation.SVG = function(svg, box) {

  const PERSEC = 0.014;  // Speed of animation (5units per sec)
  const L = 0;         // Lower value for the z-coordinate
  const H = 10;    // Higher value for the z-coordinate

  const SCREEN_SIZE = 150; // 80x80

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

  function calculateMovements(x, y, z) {
    let rotationAxisOffset = platform.rotationAxisOffset
    let wallDistance = platform.wallDistance

    let movements = {}
    let theta, beta
    let xTrans, yTrans, zTrans

    theta = -Math.asin(z/(rotationAxisOffset + wallDistance))
    beta = Math.asin(y/(rotationAxisOffset + wallDistance))

    let rotY = theta === 0 ? 0 : 1
    let rotZ = beta === 0 ? 0 : 1
    let laserState = x !== 0 ? 0 : 1

    xTrans = 2 * rotationAxisOffset - rotationAxisOffset * Math.cos(theta) - rotationAxisOffset * Math.cos(beta)
    //console.log(theta)
    yTrans = rotationAxisOffset * Math.sin(beta)
    zTrans = -rotationAxisOffset * Math.sin(theta)

    movements = {
      x: xTrans,
      y: yTrans,
      z: zTrans,
      rotY: rotY,
      rotZ: rotZ,
      theta: theta,
      beta: beta,
      laserState: laserState
    }
    return movements
  }

  return {   // Return the normalized object for animation.
    duration: duration,
    pathVisible: true,
    next: null,
    fn: function(pct) {

      var pctStart = 0;  // Variable for starting progress of animation (initialize to 0%)
      
      for (var i = 1; i < data.length; i++) {  // For every step of the animation

        var p = data[i];  // from now on p = current step of animation
        var pctEnd = pctStart + p.t / duration; // calculate the percentage of animation transcurred up until this step

        if (pctStart <= pct && pct < pctEnd) {  // Execute code below only for step in selected pct (percentage) range.
          //console.log(pctStart)
          var scale = (pct - pctStart) / (pctEnd - pctStart); // Variable scale to calculate how far the animation is in selected step. (0 to 1)
          var prev = i === 0 ? data[0] : data[i - 1];  // Previous step, if i = 0 (meaning first step of animation), previous step is same step, otherwise its i-1

          var movements = calculateMovements(p.x, p.y, p.z)
          var prevMovements = calculateMovements(prev.x, prev.y, prev.z)

          // Set the new location with previous' step location + its difference multiplied by completion progress of step.
          this.translation[0] = prevMovements.x + (movements.x - prevMovements.x) * scale; 
          this.translation[1] = prevMovements.y + (movements.y - prevMovements.y) * scale;
          this.translation[2] = prevMovements.z + (movements.z - prevMovements.z) * scale;
          this.translation[3] = movements.laserState;
          this.orientation = Quaternion.fromAxisAngle([0, movements.rotY, 0], prevMovements.theta + (movements.theta - prevMovements.theta) * scale).mul(Quaternion.fromAxisAngle([0, 0, movements.rotZ], prevMovements.beta + (movements.beta - prevMovements.beta) * scale))
          //console.log(movements.beta)
          return; // Once the if condition is true, there is no need to continue with the loop, so return.
        }
        pctStart = pctEnd; // Assign the start pct to the end pct for continuing the loop.
      }

      // Set to last element in chain, that isn't considered on the for loop.
      var lastMovements = calculateMovements(data[data.length-1].x, data[data.length-1].y, data[data.length-1].z)
      this.translation[0] = lastMovements.x;
      this.translation[1] = lastMovements.y;
      this.translation[2] = lastMovements.z;
      this.translation[3] = lastMovements.laserState;
      this.orientation = Quaternion.fromAxisAngle([0, lastMovements.rotY, 0], lastMovements.theta).mul(Quaternion.fromAxisAngle([0, 0, lastMovements.rotZ], lastMovements.beta))
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
  
  downloadServoAngles: function(data, originalValues) {

    function adaptDataArduino(rawData) {

      // Remove first steps (where the pointer moves to starting shape position)
      let indexToCut = 0
      for (let i = 0; i < rawData.length; i++) {
        if (rawData[i][6] === 0) {
          if (rawData[i+1][6] === 1) {
            indexToCut = i
            break;
          }
        }
      }
      rawData.splice(0, indexToCut + 1)

      // Apply mathematical operations to map servo angles into real-life servo arduino angles    
      let operation
      const modifiedData = []
      
      for (let i = 0; i < rawData.length; i++) {
        const modifiedColumn = []
        for (let j = 0; j < rawData[i].length; j++) {
          // Operations depending on servo number. The left part servos (0, 2, 4) will round down and the right part ones (1, 3, 5) will round up
          // so that all tend to go down in the end and are a bit more synchronized.
          switch (j) {
            case 0:
              operation = (x) => Math.floor(308.5 + x * 187.5 * 2 / Math.PI);
              break;
            case 1:
              operation = (x) => Math.ceil(313.5 - 1 * x * 185.5 * 2 / Math.PI);
              break;
            case 2:
              operation = (x) => Math.floor(303.5 + x * 190.5 * 2 / Math.PI);
              break;
            case 3:
              operation = (x) => Math.ceil(319.0 - 1 * x * 185.0 * 2 / Math.PI);
              break;
            case 4:
              operation = (x) => Math.floor(304.5 + x * 185.5 * 2 / Math.PI);
              break;
            case 5:
              operation = (x) => Math.ceil(325.0 - 1 * x * 186.0 * 2 / Math.PI);
              break;
            // For the laser on/off, we offset the value one step so that it gets turned off later.
            case 6:
              operation = () => i===0 ? rawData[i][j] : rawData[i-1][j];
              break;
          }
          modifiedColumn.push(operation(rawData[i][j]))
        }
        modifiedData.push(modifiedColumn)
      }

      // Copy last row and set laser value to 0 (off)
      const lastRow = [...modifiedData[modifiedData.length-1]]
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
      modifiedData.push(newRow)
      return modifiedData
    }

    function addHeaderAndSteps(myData, isAdapted) {
      let header = []

      if (isAdapted) {
        header = ['Step', 'DigitalIn','Servo 0', 'Servo 1', 'Servo 2', 'Servo 3', 'Servo 4', 'Servo 5']

        // Put last column into first position
        for (let i = 0; i < myData.length; i++) {
          const subarray = myData[i];
          subarray.unshift(subarray.pop())
        }

        // Create index column starting from 1
        myData.forEach((row, index) => row.unshift(index+1));
      }
      else {
        header = ['Step', 'Servo 0', 'Servo 1', 'Servo 2', 'Servo 3', 'Servo 4', 'Servo 5', 'Laser on/off'];
        // Create index column starting from 0
        myData.forEach((row, index) => row.unshift(index));
      }

      // Add header to the data
      myData.unshift(header);
    }

    function performDownload(tableToDownload, isAdapted) {
      // Convert data to text
      let text
      if (isAdapted) {
        const headerText = tableToDownload.shift().join('\t,\t')
        const bodyText = tableToDownload.map(row => row.join('\t,\t')).join('},\n{')
        text = headerText + '\n' + '{' + bodyText + '}'
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

    if (!originalValues) {
      data = adaptDataArduino(data)
    }
    addHeaderAndSteps(data, !originalValues);
    performDownload(data, !originalValues)
  },

  // Toggles visibility of the path
  toggleVisiblePath: function() {
    this.pathVisible = !this.pathVisible;
  },

  // Draws a red line from the origin of the platform throughout the animation path. 
  drawPath: function(p) {

    // If path visibility is off, then end the function here (don't draw path)
    if (!this.pathVisible || !this.cur.pathVisible)
      return;

    // Draw path shape with p.beginShape()
    p.beginShape();         // Tell the program I want to draw a shape with some vertices
    p.noFill();             // Background of shape transparent
    p.stroke(255, 0, 0);    // Contour of shape color red
    var steps = 500;       // Number of vertices of the shape
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
      if (this.getServos != false) {
        //console.log('Animation started!')
        this.servoAnglesToPrint = this.servoAngles
        this.servoAngles = []
      }
      this.getServos = true
      this._start(this.fn[t], this.fn[t].next); 
    }
  },
  // This function is called by the "start" function and when clicking an svg image in the webpage, executed with the html code.
  // This function is responsible for setting the necessary parameters for the execution of the animation.
  // It takes in two parameters: the object containing the info about the animation to start, and the name
  // (as string) of the next animation.
  _start: function(play, next) {
    // Checks if the play object has a start method in it. if it does, it calls the method passing current animation
    // as argument (this)
    if (play.start) {
      play.start.call(this);
    }
    this.cur = play;              // Sets current animation to passed play object.
    this.next = next;             // Sets next animation to passed next string.
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
    }

    // Call fn function inside animation object to update this.translation and this.orientation, passing
    // as argument the elapsed variable.
    // Info on call() method: https://www.w3schools.com/js/js_function_call.asp
    this.cur.fn.call(this, elapsed, p);

    // If the animation is completed and there is a next animation, then start the next animation.
    if (elapsed === 1 && this.cur.duration !== 0 && this.next !== null) {
      this.start(this.next);
    }

    if (elapsed !== 1) {
      this.servoAngles.push(platform.getServoAngles(this.translation));
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
    circle: {
      duration: 7000,
      pathVisible: false,
      next: 'circle',
      fn: function(pct) {

        let wallDistance = platform.wallDistance
        let radius = 100 // 10 cm
        let angleFromRadius = Math.atan(radius / wallDistance)

        let x = 0
        let y = 0
        let z = 1

        let b = angleFromRadius * Math.cos(2*Math.PI*pct)
        //console.log("Platform's rotation is "+ Math.round(b*180/Math.PI*100)/100 + ' degrees.')

        // Separate animation in 4 parts. 
        if (pct < 1 / 4) {           // If completion percentage is < 25%         
          z = 1;
          x = 1;
          y = 1;                   
        } else if (pct < 1 / 2) {    // If completion percentage is > 25% and < 50%
          z = 1
          x = -1
          y = -1     
        } else if (pct < 3 / 4) {    // If completion percentage is > 50% and < 75%
          z = 1 
          x = 1
          y = 1
        } else {                     // If completion percentage is > 75% and < 100%
          z = 1
          x = 1
          y = 1                     
        }
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
    }
  },

  // Object that simply binds the names of the predefined animations to their corresponding keys in the keyboard
  map: {
    q: "square",
    w: "wobble",
    r: "rotate",
    t: "tilt",
  }
};
