from src.resume.skill_catalog import DEFAULT_SKILLS, SKILL_ALIASES


def test_catalog_contains_role_and_industry_skills():
    expected_skills = {
        "python",
        "javascript",
        "sql",
        "machine learning",
        "artificial intelligence",
        "statistics",
        "excel",
        "power bi",
        "docker",
        "kubernetes",
        "postgresql",
        "mongodb",
        "aws",
        "azure",
    }

    assert expected_skills.issubset(DEFAULT_SKILLS)


def test_catalog_maps_common_aliases_to_canonical_skills():
    assert SKILL_ALIASES["js"] == "javascript"
    assert SKILL_ALIASES["ml"] == "machine learning"
    assert SKILL_ALIASES["ai"] == "artificial intelligence"
    assert SKILL_ALIASES["nodejs"] == "node.js"
    assert SKILL_ALIASES["postgres"] == "postgresql"
    assert SKILL_ALIASES["k8s"] == "kubernetes"
    assert SKILL_ALIASES["powerbi"] == "power bi"


def test_every_alias_target_exists_in_default_skills():
    assert set(SKILL_ALIASES.values()).issubset(DEFAULT_SKILLS)


def test_default_skills_are_unique_and_lowercase():
    assert len(DEFAULT_SKILLS) == len(set(DEFAULT_SKILLS))
    assert all(skill == skill.lower() for skill in DEFAULT_SKILLS)