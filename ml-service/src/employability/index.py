import math
from numbers import Real


def calculate_employability_index(
    component_scores: dict,
    weights: dict,
) -> dict:
    """Calculate a transparent weighted index from normalized scores."""
    if set(component_scores) != set(weights):
        raise ValueError(
            "Component scores and weights must use the same keys."
        )

    normalized_scores = {}

    for component, score in component_scores.items():
        if (
            isinstance(score, bool)
            or not isinstance(score, Real)
        ):
            raise TypeError(
                "Component scores must be numbers."
            )

        normalized_score = float(score)

        if not math.isfinite(normalized_score):
            raise ValueError(
                "Component scores must be finite."
            )

        if not 0 <= normalized_score <= 100:
            raise ValueError(
                "Component scores must be between 0 and 100."
            )

        normalized_scores[component] = normalized_score

    normalized_weights = {}

    for component, weight in weights.items():
        if (
            isinstance(weight, bool)
            or not isinstance(weight, Real)
        ):
            raise TypeError(
                "Weights must be numbers."
            )

        normalized_weight = float(weight)

        if not math.isfinite(normalized_weight):
            raise ValueError(
                "Weights must be finite."
            )

        if not 0 <= normalized_weight <= 1:
            raise ValueError(
                "Weights must be between 0 and 1."
            )

        normalized_weights[component] = normalized_weight

    if not math.isclose(
        sum(normalized_weights.values()),
        1.0,
        abs_tol=1e-9,
    ):
        raise ValueError(
            "Weights must sum to 1."
        )

    contributions = {
        component: score
        * normalized_weights[component]
        for component, score
        in normalized_scores.items()
    }
    employability_index = sum(
        contributions.values()
    )

    return {
        "employability_index": employability_index,
        "component_contributions": contributions,
        "weights": normalized_weights,
    }
