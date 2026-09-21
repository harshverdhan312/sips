import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sips_app/core/network/api_client.dart';
import 'package:sips_app/models/placement_prediction.dart';
import 'package:sips_app/repositories/api_sips_repository.dart';
import 'package:sips_app/providers/sips_providers.dart';

class FakeApiClient extends ApiClient {
  dynamic getResponse;
  dynamic postResponse;
  String? lastGetPath;
  String? lastPostPath;

  @override
  Future<dynamic> get(String path, {Map<String, String>? queryParams}) async {
    lastGetPath = path;
    return getResponse;
  }

  @override
  Future<dynamic> post(String path, {dynamic body}) async {
    lastPostPath = path;
    return postResponse;
  }
}

void main() {
  group('PlacementPrediction Model Tests', () {
    test('PlacementPrediction.fromBackendJson deserializes full ML response structure', () {
      final json = {
        '_id': 'pred_123',
        'collegeId': 'col_456',
        'studentId': 'stu_789',
        'placementProbability': 0.842,
        'decisionThreshold': 0.5,
        'predictedClass': 1,
        'predictedLabel': 'Placed',
        'modelVersion': 'rf-v1.0.0',
        'createdAt': '2026-09-21T12:00:00.000Z',
      };

      final model = PlacementPrediction.fromBackendJson(json);
      expect(model.id, 'pred_123');
      expect(model.collegeId, 'col_456');
      expect(model.studentId, 'stu_789');
      expect(model.placementProbability, 0.842);
      expect(model.decisionThreshold, 0.5);
      expect(model.predictedClass, 1);
      expect(model.predictedLabel, 'Placed');
      expect(model.modelVersion, 'rf-v1.0.0');
      expect(model.createdAt, isNotNull);
    });

    test('PlacementPrediction.fromBackendJson handles default/fallback values safely', () {
      final json = <String, dynamic>{};
      final model = PlacementPrediction.fromBackendJson(json);
      expect(model.id, '');
      expect(model.placementProbability, 0.0);
      expect(model.decisionThreshold, 0.5);
      expect(model.predictedClass, 0);
      expect(model.predictedLabel, '');
      expect(model.modelVersion, '');
      expect(model.createdAt, isNull);
    });
  });

  group('ApiSipsRepository Placement Prediction Tests', () {
    test('getLatestPlacementPrediction returns null when backend returns null prediction', () async {
      final fakeApi = FakeApiClient();
      fakeApi.getResponse = {'success': true, 'prediction': null};
      final repo = ApiSipsRepository(fakeApi);

      final pred = await repo.getLatestPlacementPrediction();
      expect(fakeApi.lastGetPath, '/api/student/analytics/placement/prediction');
      expect(pred, isNull);
    });

    test('getLatestPlacementPrediction maps valid prediction when returned by backend', () async {
      final fakeApi = FakeApiClient();
      fakeApi.getResponse = {
        'success': true,
        'prediction': {
          '_id': 'pred_abc',
          'collegeId': 'col_1',
          'studentId': 'stu_1',
          'placementProbability': 0.78,
          'decisionThreshold': 0.5,
          'predictedClass': 1,
          'predictedLabel': 'Placed',
          'modelVersion': 'v2',
        }
      };
      final repo = ApiSipsRepository(fakeApi);

      final pred = await repo.getLatestPlacementPrediction();
      expect(pred, isNotNull);
      expect(pred!.id, 'pred_abc');
      expect(pred.placementProbability, 0.78);
      expect(pred.predictedLabel, 'Placed');
    });

    test('requestPlacementPrediction sends POST and returns parsed prediction', () async {
      final fakeApi = FakeApiClient();
      fakeApi.postResponse = {
        'success': true,
        'prediction': {
          '_id': 'pred_new',
          'collegeId': 'col_1',
          'studentId': 'stu_1',
          'placementProbability': 0.91,
          'decisionThreshold': 0.5,
          'predictedClass': 1,
          'predictedLabel': 'Placed',
          'modelVersion': 'v2',
        }
      };
      final repo = ApiSipsRepository(fakeApi);

      final pred = await repo.requestPlacementPrediction();
      expect(fakeApi.lastPostPath, '/api/student/analytics/placement/predict');
      expect(pred.id, 'pred_new');
      expect(pred.placementProbability, 0.91);
      expect(pred.predictedClass, 1);
    });
  });

  group('PlacementPredictionNotifier Tests', () {
    test('PlacementPredictionNotifier loads latest prediction on initialization', () async {
      final fakeApi = FakeApiClient();
      fakeApi.getResponse = {
        'success': true,
        'prediction': {
          '_id': 'pred_init',
          'collegeId': 'col_1',
          'studentId': 'stu_1',
          'placementProbability': 0.65,
          'decisionThreshold': 0.5,
          'predictedClass': 1,
          'predictedLabel': 'Placed',
        }
      };
      final repo = ApiSipsRepository(fakeApi);

      final container = ProviderContainer(
        overrides: [
          sipsRepositoryProvider.overrideWithValue(repo),
        ],
      );

      // Await loadPrediction explicitly
      await container.read(placementPredictionProvider.notifier).loadPrediction();
      final state = container.read(placementPredictionProvider);
      expect(state.hasValue, true);
      expect(state.value?.id, 'pred_init');
      expect(state.value?.placementProbability, 0.65);
    });
  });
}
