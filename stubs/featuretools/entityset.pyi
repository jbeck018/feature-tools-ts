from typing import Any, Dict, List, Optional, Set, Tuple, Union, Callable
from datetime import datetime
import pandas as pd

class Entity:
    """
    A class to represent a table in an EntitySet.
    
    An Entity is a table of data with a unique index column. Entities contain
    variables that describe the instances in the index column.
    """
    id: str
    df: pd.DataFrame
    index: str
    time_index: Optional[str]
    variable_types: Dict[str, str]
    
    def __init__(
        self, 
        id: str, 
        df: pd.DataFrame, 
        index: str, 
        time_index: Optional[str] = None, 
        variable_types: Optional[Dict[str, str]] = None
    ) -> None: ...
    
    def add_variable(self, variable_id: str, type_name: str) -> None: ...
    
    def delete_variable(self, variable_id: str) -> None: ...
    
    def get_column_names(self) -> List[str]: ...
    
    def get_index(self) -> pd.Index: ...
    
    def update_data(self, df: pd.DataFrame, already_sorted: bool = False) -> None: ...

class Relationship:
    """
    A class to represent a relationship between two entities in an EntitySet.
    
    A relationship connects a parent entity to a child entity via a parent variable
    and a child variable.
    """
    parent_entity: str
    parent_variable: str
    child_entity: str
    child_variable: str
    
    def __init__(
        self, 
        parent_entity: str, 
        parent_variable: str, 
        child_entity: str, 
        child_variable: str
    ) -> None: ...

class EntitySet:
    """
    A collection of entities and relationships between them.
    
    The EntitySet class represents a dataset and provides the fundamental building
    blocks for feature engineering. It consists of multiple entities connected by
    relationships, where each entity represents a dataframe with a unique ID.
    
    Attributes:
        id: The identifier for the EntitySet.
        entities: A dictionary of entities in this EntitySet.
        relationships: A list of relationships between entities in this EntitySet.
    """
    id: str
    entities: Dict[str, Entity]
    relationships: List[Relationship]
    
    def __init__(self, id: str, entities: Optional[Dict[str, Entity]] = None, relationships: Optional[List[Relationship]] = None) -> None: ...
    
    def add_entity(self, entity_id: str, df: pd.DataFrame, index: str, time_index: Optional[str] = None, variable_types: Optional[Dict[str, str]] = None) -> Entity:
        """
        Add a new entity to the EntitySet.
        
        Args:
            entity_id: The ID of the new entity.
            df: The dataframe to use for the entity.
            index: The name of the column that uniquely identifies each row.
            time_index: The name of the column containing the time index.
            variable_types: Dictionary mapping column names to variable types.
            
        Returns:
            The created Entity object.
        """
        ...
    
    def add_relationship(self, parent_entity: str, parent_variable: str, child_entity: str, child_variable: str) -> Relationship:
        """
        Create a new relationship between entities.
        
        Args:
            parent_entity: The ID of the parent entity.
            parent_variable: The variable ID in the parent entity.
            child_entity: The ID of the child entity.
            child_variable: The variable ID in the child entity.
            
        Returns:
            The created Relationship object.
        """
        ...
    
    def delete_entity(self, entity_id: str) -> None:
        """
        Delete an entity from the EntitySet.
        
        Args:
            entity_id: The ID of the entity to delete.
        """
        ...
    
    def delete_relationship(self, relationship: Relationship) -> None:
        """
        Delete a relationship from the EntitySet.
        
        Args:
            relationship: The relationship object to delete.
        """
        ...
    
    def get_entity(self, entity_id: str) -> Entity:
        """
        Get an entity from the EntitySet.
        
        Args:
            entity_id: The ID of the entity to get.
            
        Returns:
            The Entity object.
        """
        ...
    
    def find_entity_by_dataframe(self, df: pd.DataFrame) -> Optional[Entity]:
        """
        Find an entity in the EntitySet that uses the given dataframe.
        
        Args:
            df: The dataframe to search for.
            
        Returns:
            The Entity that contains the dataframe, or None if not found.
        """
        ...
    
    def find_forward_paths(self, start_entity_id: str, goal_entity_id: str) -> List[List[Relationship]]:
        """
        Find all paths from start entity to goal entity that follow relationships.
        
        Args:
            start_entity_id: The ID of the entity to start from.
            goal_entity_id: The ID of the entity to reach.
            
        Returns:
            A list of paths, where each path is a list of relationships.
        """
        ...
    
    def get_forward_entities(self, entity_id: str, deep: bool = False) -> List[str]:
        """
        Get entities that are in a forward relationship with the given entity.
        
        Args:
            entity_id: The ID of the entity to start from.
            deep: If True, recursively find forward entities.
            
        Returns:
            A list of entity IDs that are forward related to the given entity.
        """
        ...
    
    def get_backward_entities(self, entity_id: str, deep: bool = False) -> List[str]:
        """
        Get entities that are in a backward relationship with the given entity.
        
        Args:
            entity_id: The ID of the entity to start from.
            deep: If True, recursively find backward entities.
            
        Returns:
            A list of entity IDs that are backward related to the given entity.
        """
        ...
    
    def get_dataframe(self, entity_id: str, variables: Optional[List[str]] = None, time_last: Optional[datetime] = None, 
                     training_window: Optional[str] = None, iloc: Optional[slice] = None) -> pd.DataFrame:
        """
        Get the dataframe for the specified entity, with optional filtering.
        
        Args:
            entity_id: The ID of the entity.
            variables: The list of variable IDs to include.
            time_last: The latest time to include data for.
            training_window: The training window to use.
            iloc: The slice to use for the dataframe.
            
        Returns:
            The filtered dataframe.
        """
        ...
    
    def normalize_entity(self, base_entity_id: str, new_entity_id: str, index: Optional[str] = None,
                         additional_variables: Optional[List[str]] = None, make_time_index: bool = False,
                         new_entity_time_index: Optional[str] = None, copy_variables: Optional[List[str]] = None,
                         variable_types: Optional[Dict[str, str]] = None) -> None:
        """
        Create a new normalized entity from an existing entity.
        
        Args:
            base_entity_id: The ID of the entity to normalize.
            new_entity_id: The ID of the new entity to create.
            index: The name of the column to use as the index.
            additional_variables: The list of additional variable IDs to add.
            make_time_index: Whether to add a time index to the new entity.
            new_entity_time_index: The name of the time index column.
            copy_variables: The list of variable IDs to copy from the base entity.
            variable_types: Dictionary mapping column names to variable types.
        """
        ...
    
    def get_relationship_list(self) -> List[Relationship]:
        """
        Get a list of all relationships in the EntitySet.
        
        Returns:
            A list of all relationships.
        """
        ...
    
    def plot(self, to_file: Optional[str] = None) -> None:
        """
        Plot the EntitySet as a network graph.
        
        Args:
            to_file: If specified, save the plot to this file.
        """
        ...
    
    def description(self) -> str:
        """
        Get a description of the EntitySet.
        
        Returns:
            A string describing the EntitySet, including entities and relationships.
        """
        ... 