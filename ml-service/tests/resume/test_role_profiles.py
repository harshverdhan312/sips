import pytest

from src.resume.role_profiles import get_role_profile, get_supported_roles


def test_get_role_profile_returns_expected_skills():
    skills = get_role_profile("machine learning engineer")

    assert skills == [
        "python",
        "machine learning",
        "deep learning",
        "sql",
        "git",
        "docker",
    ]


def test_get_role_profile_normalizes_case_and_whitespace():
    skills = get_role_profile("  Data   Scientist  ")

    assert skills == [
        "python",
        "sql",
        "data analysis",
        "machine learning",
        "statistics",
        "data visualization",
    ]


def test_get_supported_roles():
    assert get_supported_roles() == [
        "data scientist",
        "machine learning engineer",
        "data analyst",
        "full stack developer",
    ]


def test_unsupported_role_raises_value_error():
    with pytest.raises(ValueError, match="Unsupported role"):
        get_role_profile("cloud engineer")


def test_empty_role_raises_value_error():
    with pytest.raises(ValueError, match="Role must not be empty"):
        get_role_profile("   ")


def test_non_string_role_raises_type_error():
    with pytest.raises(TypeError, match="Role must be a string"):
        get_role_profile(123)