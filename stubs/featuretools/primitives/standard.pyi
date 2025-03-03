from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union
import pandas as pd
import numpy as np
from datetime import datetime

# Base classes for primitives
class PrimitiveBase:
    """Base class for all primitives in Featuretools."""
    name: str
    description: str
    input_types: List[str]
    return_type: str
    
    def __init__(self, name: str, description: str, input_types: List[str], return_type: str) -> None: ...
    
    def get_function(self) -> Callable: ...
    
    def get_name(self) -> str: ...
    
    def __call__(self, *args: Any, **kwargs: Any) -> Any: ...

class TransformPrimitive(PrimitiveBase):
    """Feature for transforming or combining values in a single entity."""
    
    def __init__(self, name: str, description: str, input_types: List[str], return_type: str) -> None: ...

class AggregationPrimitive(PrimitiveBase):
    """Feature for aggregating values from multiple instances in a related entity."""
    
    def __init__(self, name: str, description: str, input_types: List[str], return_type: str) -> None: ...

# Transform Primitives
class Absolute(TransformPrimitive):
    """Computes the absolute value of a number."""
    
    def __init__(self) -> None: ...

class AddNumeric(TransformPrimitive):
    """Add two numbers."""
    
    def __init__(self) -> None: ...

class SubtractNumeric(TransformPrimitive):
    """Subtract two numbers."""
    
    def __init__(self) -> None: ...

class MultiplyNumeric(TransformPrimitive):
    """Multiply two numbers."""
    
    def __init__(self) -> None: ...

class DivideNumeric(TransformPrimitive):
    """Divide two numbers."""
    
    def __init__(self) -> None: ...

class Negate(TransformPrimitive):
    """Negate a number."""
    
    def __init__(self) -> None: ...

class CumSum(TransformPrimitive):
    """Calculates the cumulative sum of a numeric column."""
    
    def __init__(self) -> None: ...

class CumMax(TransformPrimitive):
    """Calculates the cumulative maximum of a numeric column."""
    
    def __init__(self) -> None: ...

class CumMin(TransformPrimitive):
    """Calculates the cumulative minimum of a numeric column."""
    
    def __init__(self) -> None: ...

class PercentChange(TransformPrimitive):
    """Calculates the percent change between values."""
    
    def __init__(self) -> None: ...

class TimeSince(TransformPrimitive):
    """Time since the datetime."""
    
    def __init__(self, unit: str = "seconds") -> None: ...

class Day(TransformPrimitive):
    """Extract the day from a datetime."""
    
    def __init__(self) -> None: ...

class Month(TransformPrimitive):
    """Extract the month from a datetime."""
    
    def __init__(self) -> None: ...

class Year(TransformPrimitive):
    """Extract the year from a datetime."""
    
    def __init__(self) -> None: ...

class Weekday(TransformPrimitive):
    """Extract the weekday from a datetime."""
    
    def __init__(self) -> None: ...

class Hour(TransformPrimitive):
    """Extract the hour from a datetime."""
    
    def __init__(self) -> None: ...

class Minute(TransformPrimitive):
    """Extract the minute from a datetime."""
    
    def __init__(self) -> None: ...

class Second(TransformPrimitive):
    """Extract the second from a datetime."""
    
    def __init__(self) -> None: ...

class IsNull(TransformPrimitive):
    """For each value, return whether it is null."""
    
    def __init__(self) -> None: ...

class NotNull(TransformPrimitive):
    """For each value, return whether it is not null."""
    
    def __init__(self) -> None: ...

class StringLength(TransformPrimitive):
    """Calculate the length of a string."""
    
    def __init__(self) -> None: ...

class Contains(TransformPrimitive):
    """Check if a string contains a substring."""
    
    def __init__(self, substring: str) -> None: ...

class NumWords(TransformPrimitive):
    """Count the number of words in a string."""
    
    def __init__(self) -> None: ...

# Aggregation Primitives
class Sum(AggregationPrimitive):
    """Sum of a column."""
    
    def __init__(self) -> None: ...

class Min(AggregationPrimitive):
    """Minimum of a column."""
    
    def __init__(self) -> None: ...

class Max(AggregationPrimitive):
    """Maximum of a column."""
    
    def __init__(self) -> None: ...

class Mean(AggregationPrimitive):
    """Mean of a column."""
    
    def __init__(self) -> None: ...

class Median(AggregationPrimitive):
    """Median of a column."""
    
    def __init__(self) -> None: ...

class Count(AggregationPrimitive):
    """Count of non-null values in a column."""
    
    def __init__(self) -> None: ...

class NumUnique(AggregationPrimitive):
    """Number of unique elements in a column."""
    
    def __init__(self) -> None: ...

class Mode(AggregationPrimitive):
    """Most common element in a column."""
    
    def __init__(self) -> None: ...

class StandardDeviation(AggregationPrimitive):
    """Standard deviation of a column."""
    
    def __init__(self) -> None: ...

class Variance(AggregationPrimitive):
    """Variance of a column."""
    
    def __init__(self) -> None: ...

class Skew(AggregationPrimitive):
    """Skewness of a column."""
    
    def __init__(self) -> None: ...

class Kurtosis(AggregationPrimitive):
    """Kurtosis of a column."""
    
    def __init__(self) -> None: ...

class Percentile(AggregationPrimitive):
    """Percentile of a column."""
    
    def __init__(self, percentile: float = 0.5) -> None: ...

class NMostCommon(AggregationPrimitive):
    """N most common elements in a column."""
    
    def __init__(self, n: int = 3) -> None: ...

class NMostUnique(AggregationPrimitive):
    """N most unique elements in a column."""
    
    def __init__(self, n: int = 3) -> None: ...

class FirstTimeSince(AggregationPrimitive):
    """Time since the first datetime in a column."""
    
    def __init__(self, unit: str = "seconds") -> None: ...

class LastTimeSince(AggregationPrimitive):
    """Time since the last datetime in a column."""
    
    def __init__(self, unit: str = "seconds") -> None: ...

class TimeSinceLast(AggregationPrimitive):
    """Time since the previous instance of each value in a column."""
    
    def __init__(self, unit: str = "seconds") -> None: ...

class AvgTimeBetween(AggregationPrimitive):
    """Average time between instances of each value in a column."""
    
    def __init__(self, unit: str = "seconds") -> None: ... 