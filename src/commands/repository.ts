// Commands Bounded Context - Repository
import { Command, CreateCommandDto, createCommand, CommandType } from './models';

// In-memory storage for commands
class CommandRepository {
  private commands: Command[] = [];

  // Create a new command
  create(dto: CreateCommandDto): Command {
    const command = createCommand(dto);
    this.commands.push(command);
    return command;
  }

  // Get all commands
  findAll(): Command[] {
    return [...this.commands];
  }

  // Get command by ID
  findById(id: string): Command | undefined {
    return this.commands.find(command => command.id === id);
  }

  // Update command
  update(id: string, dto: Partial<CreateCommandDto>): Command | undefined {
    const index = this.commands.findIndex(command => command.id === id);
    if (index === -1) return undefined;

    const updatedCommand = {
      ...this.commands[index],
      ...dto,
      // Don't update ID or createdAt
      id: this.commands[index].id,
      createdAt: this.commands[index].createdAt
    };

    this.commands[index] = updatedCommand;
    return updatedCommand;
  }

  // Delete command
  delete(id: string): boolean {
    const initialLength = this.commands.length;
    this.commands = this.commands.filter(command => command.id !== id);
    return this.commands.length !== initialLength;
  }

  // Initialize with default commands
  initializeDefaults() {
    if (this.commands.length === 0) {
      this.create({ type: CommandType.MOVE, parameter: 1 });
      this.create({ type: CommandType.LEFT });
      this.create({ type: CommandType.RIGHT });
      this.create({ type: CommandType.REPORT });
    }
  }
}

// Singleton instance
export const commandRepository = new CommandRepository();

// Initialize default commands
commandRepository.initializeDefaults();