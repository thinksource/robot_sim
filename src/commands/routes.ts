// Commands Bounded Context - Routes
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { commandRepository } from './repository';
import { CreateCommandDto } from './models';
import { errorOutput } from '../libs/utils';

export async function commandRoutes(fastify: FastifyInstance) {
  // Get all commands
  const getAllCommandsOpts: RouteShorthandOptions = {
    schema: {
      tags: ['commands'],
      description: 'Get all available commands',
      response: {
        200: {
          type: 'array',
          items: { $ref: '#/components/schemas/Command' },
          description: 'List of all commands'
        }
      }
    }
  };
  
  fastify.get('/', getAllCommandsOpts, async (request, reply) => {
    const commands = commandRepository.findAll();
    return commands;
  });

  // Get command by ID
  const getCommandByIdOpts: RouteShorthandOptions = {
    schema: {
      tags: ['commands'],
      description: 'Get a command by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Command ID' }
        }
      },
      response: {
        200: { $ref: '#/components/schemas/Command' },
        404: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.get('/:id', getCommandByIdOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const command = commandRepository.findById(id);
    
    if (!command) {
      reply.code(404).send({ error: 'Command not found' });
      return;
    }
    
    return command;
  });

  // Create a new command
  const createCommandOpts: RouteShorthandOptions = {
    schema: {
      tags: ['commands'],
      description: 'Create a new command',
      body: { $ref: '#/components/schemas/CreateCommandDto' },
      response: {
        201: { $ref: '#/components/schemas/Command' },
        400: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.post('/', createCommandOpts, async (request, reply) => {
    try {
      const commandData = request.body as CreateCommandDto;
      
      // Basic validation
      if (!commandData.type) {
        reply.code(400).send({ error: 'Command type is required' });
        return;
      }
      
      const newCommand = commandRepository.create(commandData);
      reply.code(201).send(newCommand);
    } catch (error) {
      errorOutput(error, reply, 400);
    }
  });

  // Update a command
  const updateCommandOpts: RouteShorthandOptions = {
    schema: {
      tags: ['commands'],
      description: 'Update an existing command',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Command ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['move', 'turn', 'scan'] },
          parameter: { 
            oneOf: [
              { type: 'integer' },
              { type: 'string' }
            ]
          },
          description: { type: 'string' }
        }
      },
      response: {
        200: { $ref: '#/components/schemas/Command' },
        404: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.put('/:id', updateCommandOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const commandData = request.body as Partial<CreateCommandDto>;
    
    const updatedCommand = commandRepository.update(id, commandData);
    
    if (!updatedCommand) {
      reply.code(404).send({ error: 'Command not found' });
      return;
    }
    
    return updatedCommand;
  });

  // Delete a command
  const deleteCommandOpts: RouteShorthandOptions = {
    schema: {
      tags: ['commands'],
      description: 'Delete a command',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Command ID' }
        }
      },
      response: {
        204: {
          type: 'null',
          description: 'Command successfully deleted'
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  };
  
  fastify.delete('/:id', deleteCommandOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = commandRepository.delete(id);
    
    if (!deleted) {
      reply.code(404).send({ error: 'Command not found' });
      return;
    }
    
    reply.code(204).send();
  });
}