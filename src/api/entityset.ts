import { FeatureToolsBridge } from '../bridge';
import { Entity, EntitySet, Relationship } from '../types/entityset';

export class EntitySetAPI {
  private bridge: FeatureToolsBridge;
  
  constructor(bridge: FeatureToolsBridge) {
    this.bridge = bridge;
  }
  
  /**
   * Create a new EntitySet
   */
  async create(id: string): Promise<EntitySet> {
    return this.bridge.callFunction<EntitySet>('ft_create_entityset', { id });
  }
  
  /**
   * Add entity to the EntitySet
   */
  async addEntity(
    entityset: EntitySet,
    entity: Entity
  ): Promise<EntitySet> {
    return this.bridge.callFunction<EntitySet>('ft_add_entity', {
      entityset,
      entity_id: entity.id,
      dataframe: entity.df,
      index: entity.index,
      time_index: entity.time_index,
      variable_types: entity.variable_types
    });
  }
  
  /**
   * Add relationship to the EntitySet
   */
  async addRelationship(
    entityset: EntitySet,
    relationship: Relationship
  ): Promise<EntitySet> {
    return this.bridge.callFunction<EntitySet>('ft_add_relationship', {
      entityset,
      relationship
    });
  }
} 