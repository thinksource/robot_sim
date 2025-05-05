# Lunar Robot Simulation System

## System Overview

The Lunar Robot Simulation System is a web application for simulating robot operations on the lunar surface. The system allows users to create maps, deploy robots, send commands, and observe the behavior of robots in a simulated lunar environment.

## System Architecture

The system adopts a front-end and back-end separation architecture:

- **Backend**: RESTful API service built with Node.js and Fastify framework

- **Front-end**: Web interface built with native HTML, CSS and JavaScript

The system adopts the idea of ​​domain-driven design (DDD) and divides the functions into the following bounded contexts:

1. **Maps**: Manage the terrain on the lunar surface

2. **Robots**: Manage robots and their positions and states on the map

3. **Commands**: Define various operations that robots can perform

4. **Command Sets**: Combine multiple commands into reusable sequences

## Features

- Create and manage lunar surface maps, including different types of terrain

- Create and manage robots, set their initial position and direction

- Send basic commands to robots: forward, turn left, turn right, report position

- Create command sequences to execute multiple commands at a time

- Create and manage reusable command sets
- Real-time visualization of the robot's position and movement on the map

## User Guide

### Map Management

1. Select an existing map from the drop-down menu or click the "Create New Map" button

2. When creating a map, you need to specify the name, width and height

3. After the map is created, it will be displayed in the simulation area

### Robot Management

1. Select an existing robot from the drop-down menu or click the "Create New Robot" button

2. When creating a robot, you need to specify the name and the map where it is located

3. After the robot is created, it will be displayed on the map, with the initial position in the center of the map, facing north

### Command Execution

1. After selecting a robot, you can use the command button to send a single command:

- Forward: The robot moves one square in the current direction

- Turn Left: The robot rotates 90 degrees to the left

- Turn Right: The robot rotates 90 degrees to the right

- Report Position: Displays the robot's current position and direction

2. Command Sequence: Enter multiple commands in the text area, one per line, and click the "Execute Sequence" button
Command Format Example:
```
MOVE 2
LEFT
MOVE 1
REPORT
```

### Command set management

1. Select an existing command set from the drop-down menu, or click the "Create new command set" button

2. When creating a command set, you need to specify the name, description, and included commands

3. After selecting the robot and command set, click the "Execute command set" button

## Start the system

1. Make sure the Node.js environment is installed

2. Install dependencies: `npm install`

3. Start the server: `npm start`

4. Visit in the browser: `http://localhost:3000`

## System extension

The system is designed to support the following extensions:

- Add new terrain types and corresponding movement rules
- Implement more complex robot types with different capabilities
- Add new command types
- Implement multi-robot collaboration functions
- Add tasks and target systems