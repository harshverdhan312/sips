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

  factory PlacementAlert.fromBackendJson(Map<String, dynamic> json) {
    final message = json['message'] as String? ?? 'Placement Notification';
    String title = 'Campus Placement Notice';
    String description = message;

    if (message.contains(':')) {
      final parts = message.split(':');
      title = parts[0].trim();
      description = parts.sublist(1).join(':').trim();
    }

    String timeFormatted = 'Recent';
    final createdAt = json['createdAt'];
    if (createdAt != null) {
      try {
        final dt = DateTime.parse(createdAt.toString());
        timeFormatted = '${dt.day}/${dt.month}/${dt.year}';
      } catch (_) {}
    }

    final lower = message.toLowerCase();
    String actionRoute = '/opportunities';
    String actionLabel = 'View Notice';
    AlertType type = AlertType.campusDrive;

    if (lower.contains('interview') || lower.contains('mock') || lower.contains('diagnostic') || lower.contains('feedback')) {
      actionRoute = '/mock-interview';
      actionLabel = 'Mock Interview';
      type = AlertType.interviewFeedback;
    } else if (lower.contains('skill') || lower.contains('gap') || lower.contains('radar') || lower.contains('competency')) {
      actionRoute = '/skills';
      actionLabel = 'Skill Radar';
      type = AlertType.skillGap;
    } else if (lower.contains('roadmap') || lower.contains('sprint') || lower.contains('task') || lower.contains('growth')) {
      actionRoute = '/growth';
      actionLabel = 'Growth Tasks';
      type = AlertType.readinessBoost;
    } else if (lower.contains('profile') || lower.contains('resume') || lower.contains('github') || lower.contains('account')) {
      actionRoute = '/profile';
      actionLabel = 'View Profile';
      type = AlertType.system;
    } else if (lower.contains('drive') || lower.contains('job') || lower.contains('campus') || lower.contains('hiring') || lower.contains('apply') || lower.contains('package')) {
      actionRoute = '/opportunities';
      actionLabel = 'View Opportunity';
      type = AlertType.campusDrive;
    }

    return PlacementAlert(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      title: title,
      description: description,
      timestamp: timeFormatted,
      type: type,
      actionRoute: actionRoute,
      actionLabel: actionLabel,
      isRead: false,
      isUrgent: lower.contains('urgent') || lower.contains('deadline') || lower.contains('today'),
    );
  }

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
