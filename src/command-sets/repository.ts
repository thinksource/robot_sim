// Command Sets Bounded Context - Repository
import { CommandSet, CreateCommandSetDto, createCommandSet } from './models';
import { commandRepository } from '../commands/repository';

// In-memory storage for command sets
class CommandSetRepository {
  private commandSets: CommandSet[] = [];

  // Create a new command set
  create(dto: CreateCommandSetDto): CommandSet {
    // Validate that all command IDs exist
    for (const commandId of dto.commandIds) {
      if (!commandRepository.findById(commandId)) {
        throw new Error(`Command with ID ${commandId} not found`);
      }
    }
    
    const commandSet = createCommandSet(dto);
    this.commandSets.push(commandSet);
    return commandSet;
  }

  // Get all command sets
  findAll(): CommandSet[] {
    return [...this.commandSets];
  }

  // Get command set by ID
  findById(id: string): CommandSet | undefined {
    return this.commandSets.find(set => set.id === id);
  }

  // Update command set
  update(id: string, dto: Partial<CreateCommandSetDto>): CommandSet | undefined {
    const index = this.commandSets.findIndex(set => set.id === id);
    if (index === -1) return undefined;

    // Validate command IDs if provided
    if (dto.commandIds) {
      for (const commandId of dto.commandIds) {
        if (!commandRepository.findById(commandId)) {
          throw new Error(`Command with ID ${commandId} not found`);
        }
      }
    }

    const updatedCommandSet = {
      ...this.commandSets[index],
      ...dto,
      // Don't update ID or createdAt
      id: this.commandSets[index].id,
      createdAt: this.commandSets[index].createdAt
    };

    this.commandSets[index] = updatedCommandSet;
    return updatedCommandSet;
  }

  // Delete command set
  delete(id: string): boolean {
    const initialLength = this.commandSets.length;
    this.commandSets = this.commandSets.filter(set => set.id !== id);
    return this.commandSets.length !== initialLength;
  }
}

// Singleton instance
export const commandSetRepository = new CommandSetRepository();