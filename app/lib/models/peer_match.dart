class PeerMatch {
  final String id;
  final String name;
  final String roleOrBadge; // "SDE-1 Aspirant" or "Tier-1 Peer Mentor"
  final String college;
  final int matchAffinity; // 91%
  final String avatarUrl;
  final List<String> strongSkills;
  final List<String> learningSkills;
  final String currentGoal;
  final bool isAvailableNow;

  const PeerMatch({
    required this.id,
    required this.name,
    required this.roleOrBadge,
    required this.college,
    required this.matchAffinity,
    this.avatarUrl = '',
    required this.strongSkills,
    required this.learningSkills,
    required this.currentGoal,
    this.isAvailableNow = true,
  });
}
