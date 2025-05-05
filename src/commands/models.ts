// Commands Bounded Context - Models
import { v4 as uuidv4 } from 'uuid';

// Command types
export enum CommandType {
  MOVE = 'MOVE',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  REPORT = 'REPORT',
}

// Command model
export interface Command {
  id: string;
  type: CommandType;
  parameter?: number | string;
  description: string;
  createdAt: Date;
}

// DTO for creating a new command
export interface CreateCommandDto {
  type: CommandType;
  parameter?: number;
  description?: string;
}

// Command factory function
export function createCommand(dto: CreateCommandDto): Command {
  const { type, parameter, description } = dto;
  
  // Validate command type
  if (!Object.values(CommandType).includes(type as any)) {
    throw new Error(`Invalid command type: ${type}`);
  }
  
  // Generate description if not provided
  let commandDescription = description || '';
  if (!commandDescription) {
    switch (type) {
      case 'MOVE':
        const steps = parameter || 1;
        commandDescription = `Move forward ${steps} step(s)`;
        break;
      case 'LEFT':
        commandDescription = 'Turn left (90 degrees counter-clockwise)';
        break;
      case 'RIGHT':
        commandDescription = 'Turn right (90 degrees clockwise)';
        break;
      case 'REPORT':
        commandDescription = 'Report current position and direction';
        break;
    }
  }
  
  return {
    id: uuidv4(),
    type,
    parameter,
    description: commandDescription,
    createdAt: new Date()
  };
}
