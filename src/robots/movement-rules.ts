// Robots Bounded Context - Movement Rules
import { Position, Direction, MovementResult } from './models';
import { Map, TerrainType } from '../maps/models';

// Movement rule interface
export interface MovementRule {
  canMove(position: Position, map: Map, steps?: number): MovementResult;
}

// Base movement rule - checks map boundaries
export class BoundaryRule implements MovementRule {
  canMove(position: Position, map: Map, steps: number = 1): MovementResult {
    const { x, y, direction } = position;
    let newX = x;
    let newY = y;
    
    // Calculate new position based on direction
    switch (direction) {
      case Direction.NORTH:
        newY = y - steps;
        break;
      case Direction.EAST:
        newX = x + steps;
        break;
      case Direction.SOUTH:
        newY = y + steps;
        break;
      case Direction.WEST:
        newX = x - steps;
        break;
    }
    
    // Check if new position is within map boundaries
    if (newX < 0 || newX >= map.width || newY < 0 || newY >= map.height) {
      return {
        success: false,
        message: 'Movement would go outside map boundaries'
      };
    }
    
    return {
      success: true,
      newPosition: { x: newX, y: newY, direction },
      message: 'Movement within boundaries'
    };
  }
}

// Terrain rule - checks if terrain is passable
export class TerrainRule implements MovementRule {
  canMove(position: Position, map: Map, steps: number = 1): MovementResult {
    // First check boundaries
    const boundaryResult = new BoundaryRule().canMove(position, map, steps);
    if (!boundaryResult.success) {
      return boundaryResult;
    }
    
    const newPosition = boundaryResult.newPosition!;
    const terrain = map.terrain[newPosition.y][newPosition.x];
    
    // Check terrain type
    if (terrain === 'rocky') {
      return {
        success: false,
        message: 'Cannot move onto rocky terrain'
      };
    }
    
    if (terrain === 'crater') {
      return {
        success: false,
        message: 'Cannot move into a crater'
      };
    }
    
    // Slope terrain slows movement (could be extended for more complex rules)
    if (terrain === 'slope') {
      return {
        success: true,
        newPosition,
        message: 'Moving onto slope terrain'
      };
    }
    
    // Flat terrain is always passable
    return {
      success: true,
      newPosition,
      message: 'Movement successful'
    };
  }
}

// Movement rule chain - applies all rules in sequence
export class MovementRuleChain {
  private rules: MovementRule[] = [];
  
  constructor() {
    // Default rules
    this.rules.push(new BoundaryRule());
    this.rules.push(new TerrainRule());
  }
  
  // Add a new rule to the chain
  addRule(rule: MovementRule): void {
    this.rules.push(rule);
  }
  
  // Apply all rules in sequence
  canMove(position: Position, map: Map, steps: number = 1): MovementResult {
    for (const rule of this.rules) {
      const result = rule.canMove(position, map, steps);
      if (!result.success) {
        return result;
      }
    }
    
    // If all rules pass, use the result from the last rule
    return this.rules[this.rules.length - 1].canMove(position, map, steps);
  }
}

// Singleton instance
export const movementRules = new MovementRuleChain();