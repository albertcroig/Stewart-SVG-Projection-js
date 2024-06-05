# Stewart Platform - Project SVG onto wall

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

Simulate the projection of drawing an SVG onto a wall with a laser attached to a Stewart Platform and download the servo angles to make it happen in real life.

## Table of Contents
- [Introduction](#introduction)
- [Installation](#installation)
- [Changes in Behaviour and Simulation](#changes-in-behaviour-and-simulation)
- [Display](#display)
- [Files and Organization](#files-and-organization)
- [In-code Customization](#in-code-customization)
- [Contribution Guidelines](#contribution-guidelines)
- [Issue Reporting](#issue-reporting)
- [Acknowledgements](#acknowledgements)
- [Contact Information](#contact-information)
- [Copyright and Licensing](#copyright-and-licensing)

## Introduction

This project is the result of my Bachelor Thesis, for Odisee - Design and Production Technology.

[Stewart Platforms](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/) are used for motion platforms with six dimensions of freedom. This is a modification of the original [Stewart.js](https://github.com/rawify/Stewart.js) repository by Robert Eisele, where you can simulate Stewart Platforms as well as use the calculated angles to drive a real platform.

The idea is to attach a laser pointer to the platform so that it moves with it, projecting the laser onto a wall. With some trigonometry, the platform's translation and rotation can be calculated to display any shape on the wall. Robert's code and mathematical development serve as the foundation, from which we can find the angles of the servo motors for a specific position and rotation of the platform.

The main goal is to have the laser attached to the platform draw shapes with specific requirements. The process is as follows:
1. Define the platform parameters (rod length, horn length, base and platform size, servo range, etc.).
2. Specify the wall distance from the platform, the desired size of the projection, and the center-point of rotation.
3. Run the simulation to calculate the servo angles and steps. Download the resulting file with the data.
4. Use the file with the servo angles on a real Stewart Platform to achieve the desired result.

The primary modification to the source code is the SVG drawing feature. In Robert Eisele's library, an SVG plotter reads SVG paths and transforms them into a series of movements for the platform. However, it originally only drew shapes on the horizontal plane above the platform. To project SVGs onto the wall, several tweaks and implementations have been made. Check out the [mathematical description and code implementation](/extra-documentation/mathematical-description-and-implementation.md) to find out the technical aspects about how it was achieved.

## Installation
Follow these steps to install and set up the project on your local machine.

### Prerequisites
Before beginning, ensure you have met the following requirements:

- You have installed Node.js (v14.x or higher) and npm (v6.x or higher).
- You have a working internet connection.
- You have Git installed.

### Clone the Repository
Open any command line interface (like Git Bash), navigate to your desired directory, and run:

```
git clone https://github.com/albertcroig/Stewart.js.git
cd Stewart.js
```

### Install Dependencies
Install the required dependencies using npm:
```
npm install
```
After that, replace the "bezier-js" folder in the "node_modules" directory with the one in the root directory.

## Changes in Behaviour and Simulation

This project focuses on the SVG drawing feature of the original software, removing most of the original features (predefined animations, Xbox controller support, etc.). The simulation visualization has been changed to show projections on the wall and enhance user interaction. The following additions have been made:

**Platform**
- Labels for the x, y, and z axes (platform and base).
- Every servo labeled with its corresponding number.
- A "ball" attached to a black line from the platform's coordinate origin to represent the center-point of rotation.
- A violet laser pointing towards the wall.

**Wall**
- A light brown wall positioned according to the "wall distance" and automatically scaled according to the size of the drawing.
- The selected SVG is drawn in the center of the wall. Users can toggle the drawing visualization (press spacebar) to toggle visibility. To toggle between the end result and the live drawing process, press "d". The former is not recommended on slow or old machines due to high processing demands.

**Simulation**
- During the animation, the platform moves around the specified center of rotation, using translation and rotation movements. Check the [mathematical description file](/extra-documentation/mathematical-description-and-implementation.md) for more information.

## Display

![Stewart-Platform](https://github.com/albertcroig/Stewart.js/blob/development/res/graphical-interface.png?raw=true "Stewart Platform Interface Visualization")

A significant addition to the original source code is the graphical interface. Several options to control the animation and platform characteristics have been added, as well as other useful features.

Check the demo on the [live github page](https://albertcroig.github.io/Stewart-SVG-Projection-js/) to give it a try.

There are three main sections on the browser display.

1. **Top Section**: Loaded SVGs (clickable to run their corresponding animation) and current servo motor angles (in radians and degrees).
2. **Left Section**: Simulation of the platform.
3. **Right Section**: Options and functionalities related to the animation and servo angles.

### Available Functions
![Use-of-features](https://github.com/albertcroig/Stewart.js/blob/development/res/feature-use.png?raw=true "Demonstration use of some features")
Screenshot demonstrating the use of the following features: camera angles, text to svg, tweak parameters.

**Live Display of Servo Angles and Laser State**

A small window in the top-right corner shows real-time values of each servo motor's angle and the laser's state (on/off). When any servo is out of the predefined angle range, it shows as "Out of range".

**Convert Text to SVG**

Enter any text and it will be automatically scaled, positioned and converted to an SVG, and the animation will be run on the simulation side.
- Two font types: regular font and hand-drawn.
- To force a line break, enter the character "\\" between words.
- Press enter or click the "Draw" button to run the animation.
- Once the text is entered, it appears in the Loaded SVGs section for later use.

*Note: This functionality does not support accents and some special characters.*

**Tweak Paramaters**

Apart from the main platform parameters (rod length, horn length, size, etc.) that can be modified within the code, some can be adjusted on the fly. Enter the desired values and click the "Apply Changes" button or press enter. A new animation will start with the updated values.

- Distance to wall: Distance from the origin to the wall's center (in mm).
- Rotation axis offset: Distance from the origin to the platform's center of rotation (in mm).
- Drawing size: Size of the drawing projected onto the wall (default is 300 mm x 300 mm).
  - Max size: Calculates the maximum possible size (with some slack for safety) for the animation without the servos going out of range. *Note: This can take several seconds for complex SVGs due to recursive simulation.*
- Drawing speed: Speed of the animation (in units per second). Higher speeds reduce precision but only affect visual quality.

**Change Camera Position**

Click buttons to view the simulation from different angles during the animation.

**Servo Angles of Current Animation**

The current animation is defined as either the one running or the last one that ran. Two buttons relate to the servo angles of that animation:

- Download formatted servo angles: Download a text file with all animation steps and servo angles. By default, the file is formatted as a C++ object with servo angles adapted to Arduino pulses. Additional information and original angles are included in the comments of the generated file for an easy integration into a C++ script for an Arduino board. Check out the [real-life platform documentation file](/extra-documentation/real-life-platform.md) for an overall better understanding of this file content.
  Options:
    - Original angles: Download only the original servo angles (in radians).
    - Remove redundant rows: Remove duplicate and transition rows where the laser is off, reducing file size. Only works when original angles is unchecked.
- Log highest servo angles: Log the highest angle of each servo for the animation to the browser's console (press F12, then go to the console tab).

## Files and Organization

### Extra documentation
Inside the [extra-documentation](/extra-documentation) folder, can be found three documentation files that get deeper into some of the concepts closely related to this software.

### Original Code
The repository includes Robert's original code inside the [original_code](/original_code) directory. Inside the [commented](/original_code/commented/) directory, you can check the commented version of the original code for a better understanding of it, as well as an [explanatory file for the original code](extra-documentation/original-code-documentation.pdf), documenting the code procedure and functions. If anything is unclear, check this to resolve any doubts.

### Modified Code
The root directory contains all of this project's files, also thoroughly commented for clarity.

The original "stewart.js" file has been split into two files: "animation.js" and "platform.js", each containing relevant object information and functions. Visualization and interaction with the display are split into "default.html" (structure and info), "style.css" (styling and formatting), and "main.js" (logic). The basic functionality is taken from the "default.html" file in the original repo. Additionally, "textToSvg.js" handles the Text to SVG functionality.

## In-code Customization

### Add SVG Paths
The predefined SVG paths are initialized every time the browser loads. They are stored inside the global variable called `SVGS`, which is an array of objects. Each object represents an SVG and has the following keys:

- **name**
- **path**
- **box**

To add a new SVG path, simply add an object to the SVGS array. Type a short description in the name key, copy the SVG path into the path key and set its corresponding bounding box in the box key. Follow the pattern below:

```
name: "Description of the svg"
path: "M ... Z",
box: [x0, y0, width, height]
```
Replace x0, y0, width, and height with the values of your SVG bounding box.

### Platform Options
The platform visualization is designed to draw in millimeters. The following options can be passed as an object into the `initHexagonal` function of the platform object. If no key is passed to the function, the default values will be chosen.

+ **wallDistance**: Distance from the origin to the wall's center. Default=820
+ **rotationAxisOffset**: Distance from the origin to the platform's center of rotation. The closer it is to the platform's coordinate origin, the larger the maximum size of the drawing. Default=150

The default values of the following parameters are the same as the real-life platform of my project. Change them according to your own platform's characteristics to avoid unexpected results.

- **rodLength**: The length of the rod attached to the servo horn and the platform. Default=130
- **hornLength**: The length of the servo horn attached to the motor shaft and the rod. Default=40
- **hornDirection**: The horn direction indicates if the servo horn is rotated to the left or to the right. 0=right, 1=left, Default=0
- **servoRange**: A valid range for the servo motors to rotate. A typical low-cost servo has 180° working space. The value is an array [minAngle, maxAngle]. Default=[-pi/3, pi/3]
- **servoRangeVisible**: A boolean if the servo range should be visible in the drawing. Default=false
- **baseRadius + baseRadiusOuter**: When a hexagonal stewart platform is used, the `baseRadiusOuter` is used to draw the base plate in accordance to the [description](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/). Default for radius=100.8 and for outerRadius=140
- **platformRadius + platformRadiusOuter**: When a hexagonal stewart platform is used, the `platformRadiusOuter` is used to draw the platform plate in accordance to the [description](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/). Default for radius=107.1 and for outerRadius=73
- **shaftDistance + anchorDistance**: Indicates the distance from the middle of a side to attach the rod anchors. Default for shaftDistance=20 and for anchorDistance=22.5
- **platformTurn**: A boolean for hexagonal platforms to indicate if the platform shall look into the same direction as the base plate. Default=false

If you want to take this to a real-life Stewart Platform, check out my [real-life platform documentation file](/extra-documentation/real-life-platform.md) to know further about how to correctly measure the platform's dimensions.

### Animation Options

Modify the following options in the animation.js file, within the animation object's constructor function:
- **drawingSize**: Size of the drawing projected onto the wall. Default value is 300, so the size of the drawing window is a square of 300mmx300mm. Default=300
- **drawingSpeed**: Speed of the animation (in units per second) of the animation. Take in account that, as it gets increased, the drawing of the SVG becomes less precise. However, it's only a visual matter. Default=0.1
- **realDraw**: Determine if the path drawing is going to start as the end result or as the live draw. Default=true

The following next option is located inside the `drawPath` function in the `Animation.prototype`.
- **steps**: Number of vertices in the path shapes (for end result drawing). Increase for better resolution, decrease for better performance. Default=700

### Download Servo Angles Options (for Arduino Board)

The following options are located inside the `getAnimationAnglesBtn` click event in the main.js script.

- **steps**: Number of steps to calculate. More steps increase precision (up to a limit). Default=2500 with "remove redundant" option, 2050 without.

- **calibrationData**: Each servo has its own calibration values that have to be found in a real life test. Modify the arrays of this object according to your platform servos. Each position of the elements in the array corresponds to the servo number.
  - **middlePos**: 
  - **amplitude**:
  - **direction**: What is considered positive angles. In this case, it should remain the same for everyone because it is hard coded like that, where the uneven indexes have a mirrored rotation value. Default=[1, -1, 1, -1, 1, -1]

Check out [my real-life platform documentation file]() to know further about the calibration data.

- **addDigitalOut**: Add a first column for the digital output for more customization, with all values as default 0x0. Default=false

When remove redundant rows option is checked and original values unchecked, there are two extra options for better laser control. These are necessary due to the imperfections of the laser activation. It's a way to avoid undesired laser activation.
- **leadingZeros**: Add steps in the beginning preventing laser from activating before we want it to. Default=10
- **zerosToKeep**: Keep steps where laser is off (when passing from an SVG closed path shape to another) preventing laser from activating in between. Should be an even number, minimum 2. Default=12

## Contribution Guidelines

I welcome contributions! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

### Contribution ideas

- Find a more efficient way to calculate animation max size (With more use mathematics, instead of recursiveness)
- Allow live modification (whille the animation is running) of platform parameters: drawing size, rotation axis offset, etc. It could lead to some interesting results.

## Issue Reporting

If you encounter any issues or bugs, please report them by creating an issue on the [GitHub Issues page](https://github.com/albertcroig/Stewart.js/issues).

### Issues detected

- The center of rotation, which is represented with a black ball, has a slight undesired movement (specially when the size of the drawing is large), probably because of the interpolation. It should be fixed in space.
- The length of the laser pointer doesn't adapt correctly when it's moving in a straight line. My hypothesis is that this issue is also related to linear interpolation issues.
- The graphical interface falls apart at very great distances. At around 7000 mm of wallDistance, the wall just disappears. There's probably not an easy solution to this, since I suspect its a p5.js native limitation.
- Path drawing is not perfect. When an animation is running and you use the browser (switch between tabs, minimize, etc.) the drawing adopts weird shapes and cuts itself.

## Acknowledgements

This project includes code from these open source projects:

- **Stewart.js** by Robert Eisele (rawify), licensed under MIT. See https://github.com/rawify/Stewart.js.
- **hesheytextjs** by James T (techninja), licensed under MIT. See https://github.com/techninja/hersheytextjs.

## Contact Information

For questions or further discussion, you can reach me at [albertcastellanosrg@gmail.com](mailto:albertcastellanosrg@gmail.com).

## Copyright and Licensing

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
