// Command Sets Bounded Context - Routes
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { commandSetRepository } from './repository';
import { CreateCommandSetDto } from './models';
import { commandRepository } from '../commands/repository';
import { robotRepository } from '../robots/repository';
import { errorOutput } from '../libs/utils';

export async function commandSetRoutes(fastify: FastifyInstance) {
  // Get all command sets
  const getAllCommandSetsOpts: RouteShorthandOptions = {
    schema: {
      tags: ['command-sets'],
      description: 'Get all command sets',
      response: {
        200: {
          type: 'array',
          items: { $ref: '#/components/schemas/CommandSet' },
          description: 'List of all command sets'
        }
      }
    }
  };
  
  fastify.get('/', getAllCommandSetsOpts, async (request, reply) => {
    const commandSets = commandSetRepository.findAll();
    return commandSets;
  });

  // Get command set by ID
  const getCommandSetByIdOpts: RouteShorthandOptions = {
    schema: {
      tags: ['command-sets'],
      description: 'Get a command set by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Command Set ID' }
        }
      },
      response: {
        200: { $ref: '#/components/schemas/CommandSet' },
        404: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.get('/:id', getCommandSetByIdOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const commandSet = commandSetRepository.findById(id);
    
    if (!commandSet) {
      reply.code(404).send({ error: 'Command set not found' });
      return;
    }
    
    return commandSet;
  });

  // Get command set with expanded commands
  const getExpandedCommandSetOpts: RouteShorthandOptions = {
    schema: {
      tags: ['command-sets'],
      description: 'Get a command set with expanded command details',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Command Set ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          allOf: [
            { $ref: '#/components/schemas/CommandSet' },
            {
              type: 'object',
              properties: {
                commands: { type: 'array', items: { $ref: '#/components/schemas/Command' } }
              }
            }
          ]
        },
        404: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.get('/:id/expanded', getExpandedCommandSetOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const commandSet = commandSetRepository.findById(id);
    
    if (!commandSet) {
      reply.code(404).send({ error: 'Command set not found' });
      return;
    }
    
    // Expand command IDs to full command objects
    const expandedCommands = commandSet.commandIds
      .map(commandId => commandRepository.findById(commandId))
      .filter(command => command !== undefined);
    
    return {
      ...commandSet,
      commands: expandedCommands
    };
  });

  // Create a new command set
  const createCommandSetOpts: RouteShorthandOptions = {
    schema: {
      tags: ['command-sets'],
      description: 'Create a new command set',
      body: { $ref: '#/components/schemas/CreateCommandSetDto' },
      response: {
        201: { $ref: '#/components/schemas/CommandSet' },
        400: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.post('/', createCommandSetOpts, async (request, reply) => {
    try {
      const commandSetData = request.body as CreateCommandSetDto;
      
      // Basic validation
      if (!commandSetData.name || !commandSetData.commandIds || commandSetData.commandIds.length === 0) {
        reply.code(400).send({ error: 'Name and at least one command ID are required' });
        return;
      }
      
      const newCommandSet = commandSetRepository.create(commandSetData);
      reply.code(201).send(newCommandSet);
    } catch (error) {
      errorOutput(error, reply, 400);
    }
  });

  // Update a command set
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const commandSetData = request.body as Partial<CreateCommandSetDto>;
      
      const updatedCommandSet = commandSetRepository.update(id, commandSetData);
      
      if (!updatedCommandSet) {
        reply.code(404).send({ error: 'Command set not found' });
        return;
      }
      
      return updatedCommandSet;
    } catch (error) {
      errorOutput(error, reply, 400);
    }
  });

  // Delete a command set
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = commandSetRepository.delete(id);
    
    if (!deleted) {
      reply.code(404).send({ error: 'Command set not found' });
      return;
    }
    
    reply.code(204).send();
  });

  // Execute a command set on a robot
  const executeCommandSetOpts: RouteShorthandOptions = {
    schema: {
      tags: ['command-sets'],
      description: 'Execute a command set on a robot',
      params: {
        type: 'object',
        required: ['id', 'robotId'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Command Set ID' },
          robotId: { type: 'string', format: 'uuid', description: 'Robot ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            commandSetName: { type: 'string' },
            robotName: { type: 'string' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  command: { type: 'string' },
                  parameter: {
                    oneOf: [
                      { type: 'integer' },
                      { type: 'string' },
                      { type: 'null' }
                    ]
                  },
                  result: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      newPosition: { $ref: '#/components/schemas/Position' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/schemas/Error' },
        404: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.post('/:id/execute/:robotId', executeCommandSetOpts, async (request, reply) => {
    const { id, robotId } = request.params as { id: string, robotId: string };
    
    // Get command set
    const commandSet = commandSetRepository.findById(id);
    if (!commandSet) {
      reply.code(404).send({ error: 'Command set not found' });
      return;
    }
    
    // Get robot
    const robot = robotRepository.findById(robotId);
    if (!robot) {
      reply.code(404).send({ error: 'Robot not found' });
      return;
    }
    
    // Get all commands in the set
    const commands = commandSet.commandIds.map(commandId => {
      const command = commandRepository.findById(commandId);
      if (!command) {
        throw new Error(`Command with ID ${commandId} not found`);
      }
      return command;
    });
    
    // Execute commands sequentially
    const results = [];
    let allSuccessful = true;
    
    for (const command of commands) {
      const result = robotRepository.executeCommand(robotId, command);
      results.push({
        command: command.type,
        parameter: command.parameter,
        result
      });
      
      if (!result.success) {
        allSuccessful = false;
        break;
      }
    }
    
    return {
      success: allSuccessful,
      commandSetName: commandSet.name,
      robotName: robot.name,
      results
    };
  });
}