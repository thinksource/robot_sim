// Robots Bounded Context - Repository
import { Robot, CreateRobotDto, createRobot, Position, Direction, MovementResult } from './models';
import { mapRepository } from '../maps/repository';
import { movementRules } from './movement-rules';
import { Command } from '../commands/models';

// In-memory storage for robots
class RobotRepository {
  private robots: Robot[] = [];

  // Create a new robot
  create(dto: CreateRobotDto): Robot {
    const map = mapRepository.findById(dto.mapId);
    if (!map) {
      throw new Error(`Map with ID ${dto.mapId} not found`);
    }
    
    const robot = createRobot(dto, map);
    this.robots.push(robot);
    return robot;
  }

  // Get all robots
  findAll(): Robot[] {
    return [...this.robots];
  }

  // Get robot by ID
  findById(id: string): Robot | undefined {
    return this.robots.find(robot => robot.id === id);
  }

  // Update robot
  update(id: string, dto: Partial<CreateRobotDto>): Robot {
    const index = this.robots.findIndex(robot => robot.id === id);
    if (index === -1) {
      throw new Error(`Robot with ID ${id} not found`);
    }

    const updatedRobot = {
      ...this.robots[index],
      ...dto,
      // Don't update ID or createdAt
      id: this.robots[index].id,
      createdAt: this.robots[index].createdAt
    };

    this.robots[index] = updatedRobot;
    return updatedRobot;
  }

  // Update robot position
  updatePosition(id: string, position: Position): Robot | undefined {
    const index = this.robots.findIndex(robot => robot.id === id);
    if (index === -1) return undefined;

    const updatedRobot = {
      ...this.robots[index],
      position
    };

    this.robots[index] = updatedRobot;
    return updatedRobot;
  }

  // Delete robot
  delete(id: string): boolean {
    const initialLength = this.robots.length;
    this.robots = this.robots.filter(robot => robot.id !== id);
    return this.robots.length !== initialLength;
  }

  // Execute a command on a robot
  executeCommand(robotId: string, command: Command): MovementResult {
    const robot = this.findById(robotId);
    if (!robot) {
      return { success: false, message: `Robot with ID ${robotId} not found` };
    }

    const map = mapRepository.findById(robot.mapId);
    if (!map) {
      return { success: false, message: `Map with ID ${robot.mapId} not found` };
    }

    const { position } = robot;
    let newPosition: Position = { ...position };
    let result: MovementResult;

    switch (command.type) {
      case 'MOVE':
        const steps = command.parameter ? Number(command.parameter) : 1;
        result = movementRules.canMove(position, map, steps);
        if (result.success && result.newPosition) {
          this.updatePosition(robotId, result.newPosition);
        }
        return result;

      case 'LEFT':
        // Rotate counter-clockwise
        switch (position.direction) {
          case Direction.NORTH: newPosition.direction = Direction.WEST; break;
          case Direction.EAST: newPosition.direction = Direction.NORTH; break;
          case Direction.SOUTH: newPosition.direction = Direction.EAST; break;
          case Direction.WEST: newPosition.direction = Direction.SOUTH; break;
        }
        this.updatePosition(robotId, newPosition);
        return { success: true, newPosition, message: 'Turned left' };

      case 'RIGHT':
        // Rotate clockwise
        switch (position.direction) {
          case Direction.NORTH: newPosition.direction = Direction.EAST; break;
          case Direction.EAST: newPosition.direction = Direction.SOUTH; break;
          case Direction.SOUTH: newPosition.direction = Direction.WEST; break;
          case Direction.WEST: newPosition.direction = Direction.NORTH; break;
        }
        this.updatePosition(robotId, newPosition);
        return { success: true, newPosition, message: 'Turned right' };

      case 'REPORT':
        return {
          success: true,
          newPosition: position,
          message: `Position: (${position.x}, ${position.y}), Facing: ${position.direction}`
        };

      default:
        return { success: false, message: `Unknown command: ${command.type}` };
    }
  }
}

// Singleton instance
export const robotRepository = new RobotRepository();