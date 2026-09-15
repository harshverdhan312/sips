enum AlertType {
  campusDrive,
  readinessBoost,
  interviewFeedback,
  skillGap,
  system,
}

class PlacementAlert {
  final String id;
  final String title;
  final String description;
  final String timestamp;
  final AlertType type;
  final String? actionRoute;
  final String? actionLabel;
  final bool isRead;
  final bool isUrgent;

  const PlacementAlert({
    required this.id,
    required this.title,
    required this.description,
    required this.timestamp,
    required this.type,
    this.actionRoute,
    this.actionLabel,
    this.isRead = false,
    this.isUrgent = false,
  });

  PlacementAlert copyWith({
    String? id,
    String? title,
    String? description,
    String? timestamp,
    AlertType? type,
    String? actionRoute,
    String? actionLabel,
    bool? isRead,
    bool? isUrgent,
  }) {
    return PlacementAlert(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      timestamp: timestamp ?? this.timestamp,
      type: type ?? this.type,
      actionRoute: actionRoute ?? this.actionRoute,
      actionLabel: actionLabel ?? this.actionLabel,
      isRead: isRead ?? this.isRead,
      isUrgent: isUrgent ?? this.isUrgent,
    );
  }
}
