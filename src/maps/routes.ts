// Maps Bounded Context - Routes
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { mapRepository } from './repository';
import { CreateMapDto } from './models';
import { errorOutput } from '../libs/utils';

export async function mapRoutes(fastify: FastifyInstance) {
  // Get all maps
  const getAllMapsOpts: RouteShorthandOptions = {
    schema: {
      tags: ['maps'],
      description: 'Get all available maps',
      response: {
        200: {
          type: 'array',
          items: { $ref: '#/components/schemas/Map' },
          description: 'List of all maps'
        }
      }
    }
  };
  
  fastify.get('/', getAllMapsOpts, async (request, reply) => {
    const maps = mapRepository.findAll();
    return maps;
  });

  // Get map by ID
  const getMapByIdOpts: RouteShorthandOptions = {
    schema: {
      tags: ['maps'],
      description: 'Get a map by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Map ID' }
        }
      },
      response: {
        200: { $ref: '#/components/schemas/Map' },
        404: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.get('/:id', getMapByIdOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const map = mapRepository.findById(id);
    
    if (!map) {
      reply.code(404).send({ error: 'Map not found' });
      return;
    }
    
    return map;
  });

  // Create a new map
  const createMapOpts: RouteShorthandOptions = {
    schema: {
      tags: ['maps'],
      description: 'Create a new map',
      body: { $ref: '#/components/schemas/CreateMapDto' },
      response: {
        201: { $ref: '#/components/schemas/Map' },
        400: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.post('/', createMapOpts, async (request, reply) => {
    try {
      const mapData = request.body as CreateMapDto;
      
      // Basic validation
      if (!mapData.name || !mapData.width || !mapData.height) {
        reply.code(400).send({ error: 'Name, width, and height are required' });
        return;
      }
      
      const newMap = mapRepository.create(mapData);
      reply.code(201).send(newMap);
    } catch (error) {
      errorOutput(error, reply, 400);
    }
  });

  // Update a map
  const updateMapOpts: RouteShorthandOptions = {
    schema: {
      tags: ['maps'],
      description: 'Update an existing map',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Map ID' }
        }
      },
      body: { $ref: '#/components/schemas/CreateMapDto' },
      response: {
        200: { $ref: '#/components/schemas/Map' },
        404: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.put('/:id', updateMapOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const mapData = request.body as Partial<CreateMapDto>;
    
    const updatedMap = mapRepository.update(id, mapData);
    
    if (!updatedMap) {
      reply.code(404).send({ error: 'Map not found' });
      return;
    }
    
    return updatedMap;
  });

  // Delete a map
  const deleteMapOpts: RouteShorthandOptions = {
    schema: {
      tags: ['maps'],
      description: 'Delete a map',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Map ID' }
        }
      },
      response: {
        204: {
          type: 'null',
          description: 'Map successfully deleted'
        },
        404: { $ref: '#/components/schemas/Error' }
      }
    }
  };
  
  fastify.delete('/:id', deleteMapOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = mapRepository.delete(id);
    
    if (!deleted) {
      reply.code(404).send({ error: 'Map not found' });
      return;
    }
    
    reply.code(204).send();
  });
}