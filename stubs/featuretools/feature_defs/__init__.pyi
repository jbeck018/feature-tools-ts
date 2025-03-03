from typing import Any, Dict, List, Optional, Set, Tuple, Union
import pandas as pd
from datetime import datetime

from ..primitives.standard import PrimitiveBase, TransformPrimitive, AggregationPrimitive

class FeatureBase:
    """Base class for all features in Featuretools."""
    entity_id: str
    name: str
    primitive: Optional[PrimitiveBase]
    
    def __init__(self, entity_id: str, name: str, primitive: Optional[PrimitiveBase] = None) -> None: ...
    
    def get_name(self) -> str: ...
    
    def get_feature_names(self) -> List[str]: ...
    
    def get_dependencies(self, deep: bool = False) -> List["FeatureBase"]: ...
    
    def get_depth(self) -> int: ...
    
    def __repr__(self) -> str: ...

class IdentityFeature(FeatureBase):
    """A feature that directly represents a variable in an entity."""
    variable_id: str
    
    def __init__(self, entity_id: str, variable_id: str) -> None: ...

class DirectFeature(FeatureBase):
    """
    A feature that represents a feature from a related entity.
    
    A DirectFeature is a feature from a related entity, accessed via a relationship
    path. For example, if we have a Customer entity with a feature "age", and an
    Order entity with a relationship to Customer, we can create a DirectFeature
    in the Order entity to access the customer's age.
    """
    base_feature: FeatureBase
    relationship_path: List[str]
    
    def __init__(self, base_feature: FeatureBase, relationship_path: List[str]) -> None: ...

class TransformFeature(FeatureBase):
    """
    A feature that applies a transform primitive to one or more input features.
    
    A TransformFeature represents the result of applying a transform primitive to
    one or more input features from the same entity. For example, we can create a
    TransformFeature to calculate the absolute value of a numeric feature.
    """
    primitive: TransformPrimitive
    base_features: List[FeatureBase]
    
    def __init__(self, base_features: List[FeatureBase], primitive: TransformPrimitive) -> None: ...

class AggregationFeature(FeatureBase):
    """
    A feature that applies an aggregation primitive to a related entity.
    
    An AggregationFeature represents the result of applying an aggregation primitive
    to one or more features from a related entity. For example, we can create an
    AggregationFeature to calculate the average order amount for each customer.
    """
    primitive: AggregationPrimitive
    base_features: List[FeatureBase]
    relationship_path: List[str]
    
    def __init__(self, base_features: List[FeatureBase], relationship_path: List[str], primitive: AggregationPrimitive) -> None: ...

class GroupByTransformFeature(FeatureBase):
    """
    A feature that applies a transform primitive to a group of related instances.
    
    A GroupByTransformFeature represents the result of applying a transform primitive
    to a group of related instances, grouped by a specified feature. For example,
    we can create a GroupByTransformFeature to calculate the rank of each order
    amount within a customer's orders.
    """
    primitive: TransformPrimitive
    base_features: List[FeatureBase]
    groupby: FeatureBase
    
    def __init__(self, base_features: List[FeatureBase], primitive: TransformPrimitive, groupby: FeatureBase) -> None: ...

class FeatureOutputSlice(FeatureBase):
    """
    A feature that represents a slice of a multi-output feature.
    
    A FeatureOutputSlice represents a specific output of a feature that returns
    multiple values. For example, if a feature returns a vector, a FeatureOutputSlice
    can represent a specific element of that vector.
    """
    base_feature: FeatureBase
    n: int
    
    def __init__(self, base_feature: FeatureBase, n: int) -> None: ...

def Feature(
    base: Union[str, Tuple[str, str], FeatureBase],
    entity_id: Optional[str] = None,
    parent_entity_id: Optional[str] = None,
    primitive: Optional[PrimitiveBase] = None,
    use_previous: Optional[Union[bool, int, str, dict]] = None,
    where: Optional[FeatureBase] = None
) -> FeatureBase:
    """
    Create a feature from a base feature or variable.
    
    This function is a convenience wrapper for creating different types of features.
    It can create IdentityFeature, DirectFeature, TransformFeature, or AggregationFeature
    depending on the arguments provided.
    
    Args:
        base: The base feature or variable to use.
        entity_id: The ID of the entity to create the feature for.
        parent_entity_id: The ID of the parent entity for a DirectFeature.
        primitive: The primitive to apply to the base feature.
        use_previous: Specifies a time window for time-dependent features.
        where: A feature to use as a where clause for the feature.
        
    Returns:
        A feature of the appropriate type.
    """
    ... 