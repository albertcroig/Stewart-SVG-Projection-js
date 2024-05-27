# Stewart Platform - Project SVG onto wall

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

Simulate the projection of drawing an SVG onto a wall with a laser attached to a Stewart Platform and download the servo angles to make it happen in real life.

## Introduction

This project is the result of my Bachelor Thesis, for Odisee - Design and Production Technology.

[Stewart Platforms](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/) are used for motion platforms with six dimensions of freedom. This is a modification of the original [Stewart.js](https://github.com/rawify/Stewart.js) repository by Robert Eisele, where you can simulate Stewart Platforms as well as use the calculated angles to drive a real platform.

This software is based on the idea of attaching a laser pointer into an existing platform so that it moves with it. That way, the laser will point to wherever the platform moves. With some trigonometry, the translation and rotation of the platform can be calculated in order to achieve a projection of whatever shape we want onto a wall. Robert's code and mathematical development is used as a starting point, from which we can find the angles of the servo motors for a certain position and rotation of the platform.

The main goal, then, is to have the laser attached to the platform draw shapes onto a wall with some specific requirements. The process to follow is the following:
1. Define the platform with its corresponding parameters (rod length, horn length, base and platform size, servo range, etc.).
2. Tell the program how far away is the wall from the platform, the desired size of the projection and the center-point of rotation (point of reference).
3. Run the simulation to calculate the angles of each of the servos and the number of steps. Download the resulting file containing the information.
5. Use the file with the servo angles in a real-life Stewart Platform and obtain the desired result.

The main functionality that has been modified from the source code is the SVG drawing. In Robert Eisele's library, there is an SVG plotter that can read SVG paths and transform them into a series of movements for the platform. However, it could only draw the shapes in the horizontal plane, right on top of the platform. With the mentioned objective of projecting the SVG's onto the wall, some tweaks and implementations have been made to the original code.

## Installation
Follow these steps to install and set up the project on your local machine.

### Prerequisites
Before you begin, ensure you have met the following requirements:

- You have installed Node.js (v14.x or higher) and npm (v6.x or higher).
- You have a working internet connection.
- You have Git installed.

### Clone the Repository
Open any command line interface application (like Git Bash), navigate to the directory you want to store the project in, and run the following:

```
git clone https://github.com/albertcroig/Stewart.js.git
cd Stewart.js
```

### Install dependencies
Install the required dependencies using npm:
```
npm install
```
After that, replace the "bezier-js" folder in the "node_modules" directory by the one in the root directory.

## Changes on behaviour and simulation

As stated before, this project is focused on the SVG drawing part of the original software, that way, most of the original features have been removed (predefined animations, xbox controller, etc.). The visualization of the simulation has been changed in order to see its projections onto the wall and enhance user-interaction. These are the following additions:

Platform
- Letters (x,y,z) for both axes (platform and base).
- Every servo labeled with its corresponding number.
- A "ball" attached to a red line coming from the platform's coordinate origin to represent the center-point of platform's rotation.
- A violet laser pointing towards the wall.

Wall
- Spherical wall in a light brown color, positioned according to the "wall distance" and scaled according to the "rotation axis offset".
- In the center of the wall, the selected SVG will be drawn. The user has the option to toggle the drawing visualization (press spacebar), to see the end-result or to see the drawing process live (press "d"). The former one is not recommended in slow or old machines, since it takes more processing memory.

Simulation
- During the animation, the platform will move around the specified center of rotation, using translation and rotation movements to project the drawing onto the wall.

## Display

![Stewart-Platform](https://github.com/albertcroig/Stewart.js/blob/development/res/graphical-interface.png?raw=true "Stewart Platform Visualization")

An important addition to the original source code is the graphical interface. Several options to control the characteristics of the animation and platform, as well as other useful implementations have been added.

Check the demo on the [live github page](https://albertcroig.github.io/Stewart.js/) to give it a try.

There are three main sections on the browser display.

1. On the top section are located the loaded SVG's (that can be clicked to run their corresponding animation), as well as the current angles for the servo motors (in radians and degrees). 
2. On the left part there's the simulation of the platform.
3. On the right part there's a set of options and functionalities related to the animation and the servo angles.

### Available functions
![Use-of-features](https://github.com/albertcroig/Stewart.js/blob/development/res/feature-use.png?raw=true "Demonstration use of some features")
Screenshot demonstrating the use of the following features: camera angles, text to svg, tweak parameters.

**Live display of servo angles and laser-state**

A small window on the top-right of the screen shows real-time values of the angle of each servo-motor, as well as the state of the laser (on/off). When any of the servos is out of the predefined range of angles, it shows as "Out of range".

**Convert text to SVG**

Enter any text and it will be automatically scaled, positioned and converted to an SVG, and the animation will be run on the simulation side.
- There are two types of fonts: regular font and hand-drawing like font.
- To force a line break, enter the character "\" in between the words where you want it to happen.
- Press enter or click the "Draw" button in order to run the animation.
- Once the text is entered, it will be shown in the Loaded SVG's section for later use.

*Warning: This functionality does not support accents and some special characters.*

**Tweak paramaters**

Apart from the main platform parameters (rod length, horn length, size, etc.) that can be modified within the code, there's the option to modify some of them on the fly. Just enter the desired values and click the "Apply Changes" button or press enter. Then, a new animation will start with the newly defined values.

- Distance to wall: distance in the x axis (in mm) from the origin to the center of the wall.
- Rotation axis offset: distance in the x axis (in mm) from the origin to the center of rotation of the platform.
- Drawing size: size of the drawing projected onto the wall. Default value is 300, so the size of the drawing window is a square of 300mmx300mm.
  - Max size: there is an button that calculates the maximum size possible for that animation (without servo's going out of range).
    *Warning: It can take several seconds to run for complex SVG's, since it's a recursive function that simulates the animation over and over.*
- Drawing speed: speed of the animation (in units per second) of the animation. Take in account that, as it gets increased, the drawing of the SVG becomes less precise. However, it's only a visual matter.

**Change camera position**

Different angles of the simulation can be visualized during the animation by clicking the buttons, switching the view to the pre-defined camera positions.

**Servo angles of current animation**

The current animation is the one that is running at the moment or the one that has last run. There are two buttons related to the servo angles of that animation.
- Download formatted servo angles:  Download a text file with all the steps of the animation and the servo angles for each step. By default, the content of the file is formatted as a C++ object, and the servo angles are adapted to arduino pulses (having in mind the range of the real servos). All the extra information, as well as the original angles, are added as commentary, so that it can be copied and pasted directly onto the C++ script, that will later be run by the arduino board.
  Options:
    - Original angles: Select this to download the text file only with the original servo angles (in radians).
    - Remove redundant rows: Only works when original angles is not selected. Select it to remove the redundant rows: duplicate rows (which are a lot, considering that the pulses for the arduino board are integers, and the approximations are far from accurate), and transition rows (when the laser activation is zero, which means it's moving from the end of a shape to the beginning of another one).
- Log highest servo angles: Quick way to visualize the highest angle of each of the servos for the animation. When clicked, it logs them onto the browser's console (press F12, then go to console tab to open the console).

## Files and organization

This repository includes the original files of Robert's original code in the "original_commented" directory. In the root directory there are all the other files related to this project. All of them are heavily commented for better clarity and understanding of the code.

Since the lines of code have been greatly increased, I opted for splitting the original file (stewart.js) into two different ones: "animation.js" and "platform.js". Each containing the corresponding object information and its functions. Visualization and interaction with the display is splitted in three files: "default.html" (structure and info of the browser), "style.css" (styling and formatting) and "main.js" (logic). The basic functionality is taken from the "default.html" file in the original repo. Apart from those, I found it suitable to add one more file that takes care of the Text to SVG functionality: "textToSvg.js".

## Options
The default values can be changed implicitly in the code.

### Platform options
The platform visualization is meant to draw a platform in milimeters. The following options are available when running the `initHexagonal` function of the platform object.

+ **wallDistance**: distance in the x axis from the origin to the center of the wall. Default=820
+ **rotationAxisOffset**: distance in the x axis from the origin to the center of rotation of the platform. Default=250

- **rodLength**: The length of the rod attached to the servo horn and the platform. Default=130
- **hornLength**: The length of the servo horn attached to the motor shaft and the rod. Default=50
- **hornDirection**: The horn direction indicates if the servo horn is rotated to the left or to the right. 0=right, 1=left, Default=0
- **servoRange**: A valid range for the servo motors to rotate. A typical low-cost servo has 180° working space. The value is an array [minAngle, maxAngle]. Default=[-pi/2, pi/2]
- **servoRangeVisible**: A boolean if the servo range should be visible in the drawing. Default=false
- **baseRadius + baseRadiusOuter**: When a hexagonal stewart platform is used, the `baseRadiusOuter` is used to draw the base plate in accordance to the [description](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/).
- **platformRadius + platformRadiusOuter**: When a hexagonal stewart platform is used, the `platformRadiusOuter` is used to draw the platform plate in accordance to the [description](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/).
- **shaftDistance + ankerDistance**: For a circular platform this indicates the radial distance of pairs of rod ankers between the shafts on the base plate and the platform plate. For hexagonal platforms this indicates the distance from the middle of a side to attach the rod ankers. Default=20
- **platformTurn**: A boolean for hexagonal platforms to indicate if the platform shall look into the same direction as the base plate. Default=true

### Animation options
These options can be modified at the animation.js file, when the constructor function of the animation object is defined.

- **drawingSize**: Size of the drawing projected onto the wall. Default value is 300, so the size of the drawing window is a square of 300mmx300mm. Default=300
- **drawingSpeed**: Speed of the animation (in units per second) of the animation. Take in account that, as it gets increased, the drawing of the SVG becomes less precise. However, it's only a visual matter. Default=0.1
- **realDraw**: Determine if the path drawing is going to start as the end result or as the live draw. Default=false

### Servo calibration values (for arduino board)
Each servo has its own calibration values that have to be found in a real life test. This variable is an object and can is located inside Animation.prototype, on the downloadServoAngles function. Modify the arrays on it according to your platform servos. Each position of the elements in the array corresponds to the servo number.

- **middlePos**: 
- **amplitude**:
- **direction**: What is considered positive angles. In this case, it should remain the same for everyone because it is hard coded like that, where the uneven indexes have a mirrored rotation value. Default=[1, -1, 1, -1, 1, -1]

## Acknowledgements
This project includes code from other open source projects:

- **Stewart.js** by Robert Eisele (rawify), licensed under MIT. See https://github.com/rawify/Stewart.js.
- **hesheytextjs** by James T (techninja), licensed under MIT. See (https://github.com/techninja/hersheytextjs).

## Copyright and licensing
Copyright (c) 2024, Albert Castellanos Roig
Licensed under the MIT license.
