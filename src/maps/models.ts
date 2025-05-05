// Maps Bounded Context - Models
import { v4 as uuidv4 } from 'uuid';

// Valid terrain types
export type TerrainType = 'flat' | 'rocky' | 'crater' | 'slope';

// Map model
export interface Map {
  id: string;
  name: string;
  width: number;
  height: number;
  terrain: TerrainType[][];
  createdAt: Date;
}

// DTO for creating a new map
export interface CreateMapDto {
  name: string;
  width: number;
  height: number;
  terrain?: TerrainType[][];
}

// Map factory function
export function createMap(dto: CreateMapDto): Map {
  const { name, width, height, terrain } = dto;
  
  // Validate dimensions
  if (width <= 0 || height <= 0) {
    throw new Error('Map dimensions must be positive numbers');
  }
  
  // Generate terrain if not provided
  const generatedTerrain: TerrainType[][] = terrain || generateDefaultTerrain(width, height);
  
  // Validate terrain dimensions
  if (generatedTerrain.length !== height || generatedTerrain.some(row => row.length !== width)) {
    throw new Error('Terrain dimensions must match map dimensions');
  }
  
  return {
    id: uuidv4(),
    name,
    width,
    height,
    terrain: generatedTerrain,
    createdAt: new Date()
  };
}

// Helper function to generate default terrain
function generateDefaultTerrain(width: number, height: number): TerrainType[][] {
  const terrainTypes: TerrainType[] = ['flat', 'rocky', 'crater', 'slope'];
  const terrain: TerrainType[][] = [];
  
  for (let y = 0; y < height; y++) {
    const row: TerrainType[] = [];
    for (let x = 0; x < width; x++) {
      // Default to mostly flat terrain with some random variations
      const randomValue = Math.random();
      if (randomValue < 0.5) {
        row.push('flat');
      } else if (randomValue < 0.6) {
        row.push('rocky');
      } else if (randomValue < 0.9) {
        row.push('crater');
      } else {
        row.push('slope');
      }
    }
    terrain.push(row);
  }
  
  return terrain;
}