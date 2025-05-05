// Robots Bounded Context - Routes
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { robotRepository } from './repository';
import { CreateRobotDto } from './models';
import { Command } from '../commands/models';
import { errorOutput } from '../libs/utils';

export async function robotRoutes(fastify: FastifyInstance) {
  // Get all robots
  const getAllRobotsOpts: RouteShorthandOptions = {
    schema: {
      tags: ['robots'],
      description: 'Get all robots',
      response: {
        200: {
          type: 'array',
          items: { $ref: '#/components/schemas/Robot' },
          description: 'List of all robots'
        }
      }
    }
  };
  
  fastify.get('/', getAllRobotsOpts, async (request, reply) => {
    const robots = robotRepository.findAll();
    return robots;
  });

  // Get robot by ID
  const getRobotByIdOpts: RouteShorthandOptions = {
    schema: {
      tags: ['robots'],
      description: 'Get a robot by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Robot ID' }
        }
      },
      response: {
        200: { $ref: '#/components/schemas/Robot' },
        404: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.get('/:id', getRobotByIdOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const robot = robotRepository.findById(id);
    
    if (!robot) {
      reply.code(404).send({ error: 'Robot not found' });
      return;
    }
    
    return robot;
  });

  // Create a new robot
  const createRobotOpts: RouteShorthandOptions = {
    schema: {
      tags: ['robots'],
      description: 'Create a new robot',
      body: { $ref: '#/components/schemas/CreateRobotDto' },
      response: {
        201: { $ref: '#/components/schemas/Robot' },
        400: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.post('/', createRobotOpts, async (request, reply) => {
    try {
      const robotData = request.body as CreateRobotDto;
      
      // Basic validation
      if (!robotData.name || !robotData.mapId) {
        reply.code(400).send({ error: 'Name and mapId are required' });
        return;
      }
      
      const newRobot = robotRepository.create(robotData);
      reply.code(201).send(newRobot);
    } catch (error) {
      errorOutput(error, reply, 400);
    }
  });

  // Update a robot
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const robotData = request.body as Partial<CreateRobotDto>;
    
    const updatedRobot = robotRepository.update(id, robotData);
    
    if (!updatedRobot) {
      reply.code(404).send({ error: 'Robot not found' });
      return;
    }
    
    return updatedRobot;
  });

  // Delete a robot
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const success = robotRepository.delete(id);
    
    if (!success) {
      reply.code(404).send({ error: 'Robot not found' });
      return;
    }
    
    reply.code(204).send();
  });

  // Execute a command on a robot
  const executeCommandOpts: RouteShorthandOptions = {
    schema: {
      tags: ['robots'],
      description: 'Execute a command on a robot',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Robot ID' }
        }
      },
      body: { $ref: '#/components/schemas/Command' },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            newPosition: {
              type: 'object',
              properties: {
                x: { type: 'integer' },
                y: { type: 'integer' },
                direction: { type: 'string', enum: ['north', 'east', 'south', 'west'] }
              }
            }
          }
        },
        400: { $ref: '#/components/schemas/Error' },
        404: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.post('/:id/execute', executeCommandOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const command = request.body as Command;
    
    if (!command || !command.type) {
      reply.code(400).send({ error: 'Valid command is required' });
      return;
    }
    
    const result = robotRepository.executeCommand(id, command);
    
    if (!result.success) {
      reply.code(400).send({ error: result.message });
      return;
    }
    
    return result;
  });

  // Execute a sequence of commands on a robot
  const executeSequenceOpts: RouteShorthandOptions = {
    schema: {
      tags: ['robots'],
      description: 'Execute a sequence of commands on a robot',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Robot ID' }
        }
      },
      body: {
        type: 'array',
        items: { $ref: '#/components/schemas/Command' },
        description: 'Array of commands to execute in sequence'
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                  newPosition: { $ref: '#/components/schemas/Position' }
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
  
  fastify.post('/:id/execute-sequence', executeSequenceOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const commands = request.body as Command[];
    
    if (!Array.isArray(commands) || commands.length === 0) {
      reply.code(400).send({ error: 'Valid commands array is required' });
      return;
    }
    
    // Validate robot exists
    const robot = robotRepository.findById(id);
    if (!robot) {
      reply.code(404).send({ error: 'Robot not found' });
      return;
    }
    
    const results = [];
    let allSuccessful = true;
    
    for (const command of commands) {
      const result = robotRepository.executeCommand(id, command);
      results.push(result);
      
      if (!result.success) {
        allSuccessful = false;
        break;
      }
    }
    
    return {
      success: allSuccessful,
      results
    };
  });
}