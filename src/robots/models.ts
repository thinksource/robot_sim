// Robots Bounded Context - Models
import { v4 as uuidv4 } from 'uuid';
import { Map } from '../maps/models';

// Direction enum
export enum Direction {
  NORTH = 'NORTH',
  EAST = 'EAST',
  SOUTH = 'SOUTH',
  WEST = 'WEST'
}

// Position interface
export interface Position {
  x: number;
  y: number;
  direction: Direction;
}

// Robot model
export interface Robot {
  id: string;
  name: string;
  mapId: string;
  position: Position;
  createdAt: Date;
}

// DTO for creating a new robot
export interface CreateRobotDto {
  name: string;
  mapId: string;
  position: Position;
}

// Robot factory function
export function createRobot(dto: CreateRobotDto, map: Map): Robot {
  const { name, mapId, position } = dto;
  
  // Default position is center of map, facing NORTH
  const defaultPosition: Position = {
    x: Math.floor(map.width / 2),
    y: Math.floor(map.height / 2),
    direction: Direction.NORTH
  };
  
  // Merge provided position with defaults
  const robotPosition: Position = {
    ...defaultPosition,
    ...position
  };
  
  // Validate position is within map boundaries
  if (robotPosition.x < 0 || robotPosition.x >= map.width || 
      robotPosition.y < 0 || robotPosition.y >= map.height) {
    throw new Error('Robot position must be within map boundaries');
  }
  
  return {
    id: uuidv4(),
    name,
    mapId,
    position: robotPosition,
    createdAt: new Date()
  };
}

// Movement result interface
export interface MovementResult {
  success: boolean;
  newPosition?: Position;
  message: string;
}