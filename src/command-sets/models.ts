// Command Sets Bounded Context - Models
import { v4 as uuidv4 } from 'uuid';
import { Command } from '../commands/models';

// Command Set model
export interface CommandSet {
  id: string;
  name: string;
  description: string;
  commandIds: string[];
  createdAt: Date;
}

// DTO for creating a new command set
export interface CreateCommandSetDto {
  name: string;
  description?: string;
  commandIds: string[];
}

// Command Set factory function
export function createCommandSet(dto: CreateCommandSetDto): CommandSet {
  const { name, description, commandIds } = dto;
  
  // Validate required fields
  if (!name) {
    throw new Error('Command set name is required');
  }
  
  if (!commandIds || !Array.isArray(commandIds) || commandIds.length === 0) {
    throw new Error('Command set must include at least one command');
  }
  
  return {
    id: uuidv4(),
    name,
    description: description || `Command set: ${name}`,
    commandIds,
    createdAt: new Date()
  };
}