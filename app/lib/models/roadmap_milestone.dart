enum MilestoneState {
  completed,
  inProgress,
  locked,
}

class RoadmapMilestone {
  final String id;
  final String phaseNumber; // "PHASE 01"
  final String title;
  final String description;
  final MilestoneState state;
  final int progressPercent; // 0 - 100
  final String deadline;
  final List<String> checklist;

  const RoadmapMilestone({
    required this.id,
    required this.phaseNumber,
    required this.title,
    required this.description,
    required this.state,
    required this.progressPercent,
    required this.deadline,
    required this.checklist,
  });
}
