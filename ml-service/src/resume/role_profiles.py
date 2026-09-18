ROLE_PROFILES = {
    "data scientist": [
        "python",
        "sql",
        "data analysis",
        "machine learning",
        "statistics",
        "data visualization",
    ],
    "machine learning engineer": [
        "python",
        "machine learning",
        "deep learning",
        "sql",
        "git",
        "docker",
    ],
    "data analyst": [
        "python",
        "sql",
        "data analysis",
        "statistics",
        "excel",
        "data visualization",
    ],
    "full stack developer": [
        "javascript",
        "html",
        "css",
        "react",
        "node.js",
        "sql",
        "git",
    ],
}


def get_role_profile(role: str) -> list[str]:
    """Return the required skills for a supported job role."""
    if not isinstance(role, str):
        raise TypeError("Role must be a string.")

    normalized_role = " ".join(role.strip().lower().split())

    if not normalized_role:
        raise ValueError("Role must not be empty.")

    if normalized_role not in ROLE_PROFILES:
        raise ValueError(f"Unsupported role: {role}")

    return ROLE_PROFILES[normalized_role].copy()


def get_supported_roles() -> list[str]:
    """Return all supported job roles."""
    return list(ROLE_PROFILES.keys())
