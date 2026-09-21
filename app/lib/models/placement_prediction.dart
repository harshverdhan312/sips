class PlacementPrediction {
  final String id;
  final String collegeId;
  final String studentId;
  final double placementProbability;
  final double decisionThreshold;
  final int predictedClass;
  final String predictedLabel;
  final String modelVersion;
  final DateTime? createdAt;

  const PlacementPrediction({
    required this.id,
    required this.collegeId,
    required this.studentId,
    required this.placementProbability,
    required this.decisionThreshold,
    required this.predictedClass,
    required this.predictedLabel,
    required this.modelVersion,
    this.createdAt,
  });

  factory PlacementPrediction.fromBackendJson(Map<String, dynamic> json) {
    return PlacementPrediction(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      collegeId: json['collegeId'] as String? ?? '',
      studentId: json['studentId'] as String? ?? '',
      placementProbability: (json['placementProbability'] as num?)?.toDouble() ?? 0.0,
      decisionThreshold: (json['decisionThreshold'] as num?)?.toDouble() ?? 0.5,
      predictedClass: (json['predictedClass'] as num?)?.toInt() ?? 0,
      predictedLabel: json['predictedLabel'] as String? ?? '',
      modelVersion: json['modelVersion'] as String? ?? '',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'collegeId': collegeId,
      'studentId': studentId,
      'placementProbability': placementProbability,
      'decisionThreshold': decisionThreshold,
      'predictedClass': predictedClass,
      'predictedLabel': predictedLabel,
      'modelVersion': modelVersion,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  PlacementPrediction copyWith({
    String? id,
    String? collegeId,
    String? studentId,
    double? placementProbability,
    double? decisionThreshold,
    int? predictedClass,
    String? predictedLabel,
    String? modelVersion,
    DateTime? createdAt,
  }) {
    return PlacementPrediction(
      id: id ?? this.id,
      collegeId: collegeId ?? this.collegeId,
      studentId: studentId ?? this.studentId,
      placementProbability: placementProbability ?? this.placementProbability,
      decisionThreshold: decisionThreshold ?? this.decisionThreshold,
      predictedClass: predictedClass ?? this.predictedClass,
      predictedLabel: predictedLabel ?? this.predictedLabel,
      modelVersion: modelVersion ?? this.modelVersion,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
