import pytest

from src.employability.index import calculate_employability_index


def test_calculate_employability_index_returns_weighted_breakdown():
    result = calculate_employability_index(
        component_scores={
            "placement": 80,
            "resume": 70,
            "interview": 60,
        },
        weights={
            "placement": 0.40,
            "resume": 0.35,
            "interview": 0.25,
        },
    )

    assert result["employability_index"] == pytest.approx(71.5)
    assert result["component_contributions"] == {
        "placement": pytest.approx(32.0),
        "resume": pytest.approx(24.5),
        "interview": pytest.approx(15.0),
    }
    assert result["weights"] == {
        "placement": 0.40,
        "resume": 0.35,
        "interview": 0.25,
    }


def test_calculate_employability_index_rejects_mismatched_components():
    with pytest.raises(
        ValueError,
        match="Component scores and weights must use the same keys.",
    ):
        calculate_employability_index(
            component_scores={
                "placement": 80,
                "resume": 70,
            },
            weights={
                "placement": 0.60,
                "interview": 0.40,
            },
        )


@pytest.mark.parametrize(
    "invalid_score",
    [-1, 101],
)
def test_calculate_employability_index_rejects_out_of_range_scores(
    invalid_score,
):
    with pytest.raises(
        ValueError,
        match="Component scores must be between 0 and 100.",
    ):
        calculate_employability_index(
            component_scores={
                "placement": invalid_score,
                "resume": 70,
            },
            weights={
                "placement": 0.50,
                "resume": 0.50,
            },
        )


def test_calculate_employability_index_rejects_invalid_weight_total():
    with pytest.raises(
        ValueError,
        match="Weights must sum to 1.",
    ):
        calculate_employability_index(
            component_scores={
                "placement": 80,
                "resume": 70,
            },
            weights={
                "placement": 0.60,
                "resume": 0.30,
            },
        )


@pytest.mark.parametrize(
    "invalid_weight",
    [-0.1, 1.1],
)
def test_calculate_employability_index_rejects_out_of_range_weights(
    invalid_weight,
):
    with pytest.raises(
        ValueError,
        match="Weights must be between 0 and 1.",
    ):
        calculate_employability_index(
            component_scores={
                "placement": 80,
                "resume": 70,
            },
            weights={
                "placement": invalid_weight,
                "resume": 1 - invalid_weight,
            },
        )
