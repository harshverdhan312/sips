import '../../../core/network/api_client.dart';
import 'models/practice_attempt.dart';
import 'models/practice_history_item.dart';
import 'models/practice_progress.dart';
import 'models/practice_question.dart';
import 'models/practice_result.dart';

abstract class PracticeRepository {
  Future<PracticeProgress> getProgress();
  Future<PracticeAttempt> createAttempt({
    required String category,
    int questionCount = 10,
    String? type,
  });
  Future<List<PracticeQuestion>> getDeliveredQuestions(String attemptId);
  Future<void> saveResponse({
    required String attemptId,
    required String questionVersionId,
    required String optionId,
  });
  Future<Map<String, dynamic>> submitAttempt(String attemptId);
  Future<PracticeResult> getResult(String attemptId);
  Future<List<PracticeHistoryItem>> getHistory({
    String? category,
    int page = 1,
    int limit = 20,
  });
}

class ApiPracticeRepository implements PracticeRepository {
  final ApiClient _client;

  ApiPracticeRepository([ApiClient? client])
      : _client = client ?? ApiClient(baseUrl: PracticeApiConfig.baseUrl);

  @override
  Future<PracticeProgress> getProgress() async {
    try {
      final res = await _client.get('/api/practice/progress');
      final data = (res is Map<String, dynamic> && res.containsKey('data')) ? res['data'] : res;
      if (data is Map<String, dynamic>) {
        return PracticeProgress.fromJson(data);
      }
      return const PracticeProgress();
    } catch (_) {
      return const PracticeProgress();
    }
  }

  @override
  Future<PracticeAttempt> createAttempt({
    required String category,
    int questionCount = 10,
    String? type,
  }) async {
    final payload = <String, dynamic>{
      'category': category,
      'questionCount': questionCount,
      'type': ?type,
    };
    final res = await _client.post('/api/practice/attempts', body: payload);
    final data = (res is Map<String, dynamic> && res.containsKey('data')) ? res['data'] : res;
    if (data is Map<String, dynamic>) {
      return PracticeAttempt.fromJson(data);
    }
    throw Exception('Failed to create practice attempt');
  }

  @override
  Future<List<PracticeQuestion>> getDeliveredQuestions(String attemptId) async {
    final res = await _client.get('/api/practice/attempts/$attemptId/questions');
    final data = (res is Map<String, dynamic> && res.containsKey('data')) ? res['data'] : res;

    dynamic rawList;
    if (data is Map<String, dynamic>) {
      rawList = data['questions'] ?? data['data'];
    } else if (data is List) {
      rawList = data;
    }

    if (rawList is List) {
      return rawList
          .whereType<Map<String, dynamic>>()
          .map((json) => PracticeQuestion.fromJson(json))
          .toList();
    }
    return [];
  }

  @override
  Future<void> saveResponse({
    required String attemptId,
    required String questionVersionId,
    required String optionId,
  }) async {
    await _client.post(
      '/api/practice/attempts/$attemptId/responses',
      body: {
        'questionVersionId': questionVersionId,
        'answerData': {'optionId': optionId},
      },
    );
  }

  @override
  Future<Map<String, dynamic>> submitAttempt(String attemptId) async {
    final res = await _client.post('/api/practice/attempts/$attemptId/submit');
    final data = (res is Map<String, dynamic> && res.containsKey('data')) ? res['data'] : res;
    if (data is Map<String, dynamic>) {
      return data;
    }
    return {};
  }

  @override
  Future<PracticeResult> getResult(String attemptId) async {
    final res = await _client.get('/api/practice/attempts/$attemptId/result');
    final data = (res is Map<String, dynamic> && res.containsKey('data')) ? res['data'] : res;
    if (data is Map<String, dynamic>) {
      return PracticeResult.fromJson(data);
    }
    throw Exception('Failed to load practice result');
  }

  @override
  Future<List<PracticeHistoryItem>> getHistory({
    String? category,
    int page = 1,
    int limit = 20,
  }) async {
    final query = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      if (category != null && category != 'ALL') 'category': category,
    };
    final res = await _client.get('/api/practice/history', queryParams: query);
    final data = (res is Map<String, dynamic> && res.containsKey('data')) ? res['data'] : res;

    dynamic rawList;
    if (data is Map<String, dynamic>) {
      rawList = data['attempts'] ?? data['history'] ?? data['items'] ?? data['data'];
    } else if (data is List) {
      rawList = data;
    }

    if (rawList is List) {
      return rawList
          .whereType<Map<String, dynamic>>()
          .map((json) => PracticeHistoryItem.fromJson(json))
          .toList();
    }
    return [];
  }
}
