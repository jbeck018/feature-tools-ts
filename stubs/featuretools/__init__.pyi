from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union, Sequence
import pandas as pd
import numpy as np
from datetime import datetime

from .entityset import Entity, EntitySet, Relationship
from .primitives.standard import (
    # Base classes
    PrimitiveBase, TransformPrimitive, AggregationPrimitive,
    
    # Transform primitives
    Absolute, AddNumeric, SubtractNumeric, MultiplyNumeric, DivideNumeric,
    Negate, CumSum, CumMax, CumMin, PercentChange, TimeSince,
    Day, Month, Year, Weekday, Hour, Minute, Second,
    IsNull, NotNull, StringLength, Contains, NumWords,
    
    # Aggregation primitives
    Sum, Min, Max, Mean, Median, Count, NumUnique, Mode,
    StandardDeviation, Variance, Skew, Kurtosis, Percentile,
    NMostCommon, NMostUnique, FirstTimeSince, LastTimeSince,
    TimeSinceLast, AvgTimeBetween
)

# Core functions
def dfs(
    entityset: EntitySet,
    target_entity: str,
    agg_primitives: Optional[List[Union[str, AggregationPrimitive]]] = None,
    trans_primitives: Optional[List[Union[str, TransformPrimitive]]] = None,
    allowed_paths: Optional[List[List[str]]] = None,
    max_depth: Optional[int] = None,
    ignore_entities: Optional[List[str]] = None,
    ignore_variables: Optional[Dict[str, List[str]]] = None,
    seed_features: Optional[List[Any]] = None,
    drop_contains: Optional[List[str]] = None,
    drop_exact: Optional[List[str]] = None,
    where_primitives: Optional[List[str]] = None,
    max_features: Optional[int] = None,
    cutoff_time: Optional[Union[pd.DataFrame, pd.Series]] = None,
    training_window: Optional[Union[str, int]] = None,
    approximate: Optional[str] = None,
    chunk_size: Optional[int] = None,
    n_jobs: int = 1,
    dask_kwargs: Optional[Dict[str, Any]] = None,
    verbose: bool = False,
    return_variable_types: Optional[List[str]] = None,
    progress_callback: Optional[Callable] = None,
    include_cutoff_time: bool = True
) -> Tuple[pd.DataFrame, List[Any]]:
    """
    Generate features for a target entity in an EntitySet using Deep Feature Synthesis (DFS).
    
    Args:
        entityset: EntitySet to calculate features on.
        target_entity: Entity to calculate features for.
        agg_primitives: List of aggregation primitives to apply.
        trans_primitives: List of transform primitives to apply.
        allowed_paths: List of paths to allow through the entity set.
        max_depth: Maximum depth of features to create.
        ignore_entities: List of entities to ignore.
        ignore_variables: Dict of entities and variables to ignore.
        seed_features: List of features to use as a starting point.
        drop_contains: List of strings to check for in feature names to drop.
        drop_exact: List of exact feature names to drop.
        where_primitives: List of primitives to apply with a where clause.
        max_features: Maximum number of features to create.
        cutoff_time: Cutoff time for time-dependent features.
        training_window: Window of time to use for training.
        approximate: Method to use for approximation.
        chunk_size: Size of chunks for parallel processing.
        n_jobs: Number of parallel jobs to run.
        dask_kwargs: Dictionary of keyword arguments for dask.
        verbose: Whether to display progress.
        return_variable_types: Types of variables to return.
        progress_callback: Function to call with progress updates.
        include_cutoff_time: Whether to include cutoff time in the returned dataframe.
        
    Returns:
        A tuple of (feature_matrix, feature_defs) where feature_matrix is a pandas DataFrame
        and feature_defs is a list of feature definitions.
    """
    ...

def calculate_feature_matrix(
    features: List[Any],
    entityset: Optional[EntitySet] = None,
    cutoff_time: Optional[Union[pd.DataFrame, pd.Series]] = None,
    instance_ids: Optional[List[Any]] = None,
    training_window: Optional[Union[str, int]] = None,
    approximate: Optional[str] = None,
    cutoff_time_in_index: bool = False,
    chunk_size: Optional[int] = None,
    n_jobs: int = 1,
    dask_kwargs: Optional[Dict[str, Any]] = None,
    verbose: bool = False,
    progress_callback: Optional[Callable] = None
) -> pd.DataFrame:
    """
    Calculate a feature matrix for a list of features.
    
    Args:
        features: List of features to calculate.
        entityset: EntitySet to calculate features on.
        cutoff_time: Cutoff time for time-dependent features.
        instance_ids: List of instance IDs to calculate features for.
        training_window: Window of time to use for training.
        approximate: Method to use for approximation.
        cutoff_time_in_index: Whether to include cutoff time in the index.
        chunk_size: Size of chunks for parallel processing.
        n_jobs: Number of parallel jobs to run.
        dask_kwargs: Dictionary of keyword arguments for dask.
        verbose: Whether to display progress.
        progress_callback: Function to call with progress updates.
        
    Returns:
        A pandas DataFrame with the calculated feature values.
    """
    ...

def list_primitives() -> pd.DataFrame:
    """
    Get a list of all primitives in Featuretools.
    
    Returns:
        A pandas DataFrame with information about all primitives.
    """
    ...

def load_features(filepath: str) -> List[Any]:
    """
    Load features from a file.
    
    Args:
        filepath: Path to the file to load features from.
        
    Returns:
        A list of feature definitions.
    """
    ...

def save_features(features: List[Any], filepath: str) -> None:
    """
    Save features to a file.
    
    Args:
        features: List of features to save.
        filepath: Path to save features to.
    """
    ...

# Version information
__version__: str 