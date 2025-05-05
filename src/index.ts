import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import path from 'path';
import { mapRoutes } from './maps/routes';
import { commandRoutes } from './commands/routes';
import { commandSetRoutes } from './command-sets/routes';
import { robotRoutes } from './robots/routes';
import { TerrainType } from './maps/models';
import { CommandType } from './commands/models';
import { Direction } from './robots/models';

const server = Fastify({
  logger: true
});

// Register plugins
server.register(cors, {
  origin: true
});

// Register Swagger
server.register(swagger, {
  openapi: {
    info: {
      title: 'Robot Simulation API',
      description: 'API for controlling and simulating robots on a map',
      version: '1.0.0'
    },
    tags: [
      { name: 'maps', description: 'Map management endpoints' },
      { name: 'commands', description: 'Command management endpoints' },
      { name: 'command-sets', description: 'Command set management endpoints' },
      { name: 'robots', description: 'Robot management endpoints' }
    ],
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'apiKey',
          in: 'header'
        }
      },
      schemas: {
        TerrainType: {
          type: 'string',
          enum: ['flat', 'rocky', 'crater', 'slope']
        },
        CommandType: {
          type: 'string',
          enum: ['MOVE', 'LEFT', 'RIGHT', 'REPORT']
        },
        Direction: {
          type: 'string',
          enum: Object.values(Direction)
        },
        Position: {
          type: 'object',
          properties: {
            x: { type: 'integer', description: 'X coordinate' },
            y: { type: 'integer', description: 'Y coordinate' },
            direction: { $ref: '#/components/schemas/Direction' }
          }
        },
        Map: {
          type: 'object',
          required: ['id', 'name', 'width', 'height'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            width: { type: 'integer', minimum: 1 },
            height: { type: 'integer', minimum: 1 },
            terrain: { 
              type: 'array', 
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/TerrainType' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateMapDto: {
          type: 'object',
          required: ['name', 'width', 'height'],
          properties: {
            name: { type: 'string' },
            width: { type: 'integer', minimum: 1 },
            height: { type: 'integer', minimum: 1 },
            terrain: {
              type: 'array',
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/TerrainType' }
              }
            }
          }
        },
        Command: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { $ref: '#/components/schemas/CommandType' },
            parameter: { 
              oneOf: [
                { type: 'integer' },
                { type: 'string' }
              ]
            },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateCommandDto: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { $ref: '#/components/schemas/CommandType' },
            parameter: { 
              oneOf: [
                { type: 'integer' },
                { type: 'string' }
              ]
            },
            description: { type: 'string' }
          }
        },
        CommandSet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            commandIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateCommandSetDto: {
          type: 'object',
          required: ['name', 'commandIds'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            commandIds: { type: 'array', items: { type: 'string', format: 'uuid' } }
          }
        },
        Robot: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            mapId: { type: 'string', format: 'uuid' },
            position: { $ref: '#/components/schemas/Position' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateRobotDto: {
          type: 'object',
          required: ['name', 'mapId'],
          properties: {
            name: { type: 'string' },
            mapId: { type: 'string', format: 'uuid' },
            position: { $ref: '#/components/schemas/Position' }
          }
        },
        MovementResult: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            newPosition: { $ref: '#/components/schemas/Position' },
            message: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }
});

// Register Swagger UI
server.register(swaggerUI, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  }
});

// Serve static files for frontend
server.register(staticFiles, {
  root: path.join(__dirname, '../public'),
  prefix: '/'
});

// Register routes
server.register(mapRoutes, { prefix: '/maps' });
server.register(commandRoutes, { prefix: '/commands' });
server.register(commandSetRoutes, { prefix: '/command-sets' });
server.register(robotRoutes, { prefix: '/robots' });

// Root route for frontend
server.get('/', (request, reply) => {
  return reply.sendFile('index.html');
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    const address = server.server.address();
    const port = typeof address === 'string' ? address : address?.port;
    console.log(`Server listening on ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();