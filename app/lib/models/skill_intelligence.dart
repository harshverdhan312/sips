import '../core/widgets/skill_chip.dart';

class SkillItem {
  final String id;
  final String name;
  final String category; // 'Core CS', 'Frameworks', 'DevOps & Cloud', 'Database'
  final SkillStatus status;
  final int proficiency; // 0-100
  final String benchmark; // e.g. "Tier-1 target: 85%"
  final String recommendation; // e.g. "Complete 4 System Design problems"
  final double readinessImpact; // e.g. +4.5%

  const SkillItem({
    required this.id,
    required this.name,
    required this.category,
    required this.status,
    required this.proficiency,
    this.benchmark = 'Tier-1 Benchmark: 80%',
    this.recommendation = 'Practice high-frequency interview drills',
    this.readinessImpact = 3.5,
  });
}

class SkillCategoryGroup {
  final String name;
  final List<SkillItem> skills;

  const SkillCategoryGroup({
    required this.name,
    required this.skills,
  });
}
