// Maps Bounded Context - Repository
import { Map, CreateMapDto, createMap } from './models';

// In-memory storage for maps
class MapRepository {
  private maps: Map[] = [];

  // Create a new map
  create(dto: CreateMapDto): Map {
    const map = createMap(dto);
    this.maps.push(map);
    return map;
  }

  // Get all maps
  findAll(): Map[] {
    return [...this.maps];
  }

  // Get map by ID
  findById(id: string): Map | undefined {
    return this.maps.find(map => map.id === id);
  }

  // Update map
  update(id: string, dto: Partial<CreateMapDto>): Map | undefined {
    const index = this.maps.findIndex(map => map.id === id);
    if (index === -1) return undefined;

    const updatedMap = {
      ...this.maps[index],
      ...dto,
      // Don't update ID or createdAt
      id: this.maps[index].id,
      createdAt: this.maps[index].createdAt
    };

    this.maps[index] = updatedMap;
    return updatedMap;
  }

  // Delete map
  delete(id: string): boolean {
    const initialLength = this.maps.length;
    this.maps = this.maps.filter(map => map.id !== id);
    return this.maps.length !== initialLength;
  }
}

// Singleton instance
export const mapRepository = new MapRepository();