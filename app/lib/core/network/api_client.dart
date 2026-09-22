import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_exception.dart';

class ApiConfig {
  static const String tokenKey = 'sips_auth_token';

  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get defaultBaseUrl {
    if (_envBaseUrl.isNotEmpty) {
      return _envBaseUrl;
    }
    if (kIsWeb) {
      return 'http://127.0.0.1:5000';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5000';
      }
    } catch (_) {}
    return 'http://127.0.0.1:5000';
  }

  static String baseUrl = defaultBaseUrl;
}

class ApiClient {
  final http.Client _client;
  final String _baseUrl;
  VoidCallback? onUnauthorized;

  ApiClient({
    http.Client? client,
    String? baseUrl,
    this.onUnauthorized,
  })  : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? ApiConfig.baseUrl;

  String get baseUrl => _baseUrl;

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(ApiConfig.tokenKey);
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConfig.tokenKey, token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiConfig.tokenKey);
  }

  Future<Map<String, String>> _getHeaders({bool isJson = true}) async {
    final headers = <String, String>{};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }
    final token = await getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Uri _buildUri(String path, [Map<String, String>? queryParams]) {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final normalizedBaseUrl = _baseUrl.endsWith('/')
        ? _baseUrl.substring(0, _baseUrl.length - 1)
        : _baseUrl;
    final fullUrl = '$normalizedBaseUrl$cleanPath';
    final uri = Uri.parse(fullUrl);
    if (queryParams != null && queryParams.isNotEmpty) {
      return uri.replace(queryParameters: queryParams);
    }
    return uri;
  }

  Future<dynamic> get(String path, {Map<String, String>? queryParams}) async {
    try {
      final uri = _buildUri(path, queryParams);
      final headers = await _getHeaders();
      final response = await _client.get(uri, headers: headers);
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error: ${e.toString()}');
    }
  }

  Future<dynamic> post(String path, {dynamic body}) async {
    try {
      final uri = _buildUri(path);
      final headers = await _getHeaders();
      final response = await _client.post(
        uri,
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error: ${e.toString()}');
    }
  }

  Future<dynamic> put(String path, {dynamic body}) async {
    try {
      final uri = _buildUri(path);
      final headers = await _getHeaders();
      final response = await _client.put(
        uri,
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error: ${e.toString()}');
    }
  }

  Future<dynamic> delete(String path) async {
    try {
      final uri = _buildUri(path);
      final headers = await _getHeaders();
      final response = await _client.delete(
        uri,
        headers: headers,
      );
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Network error: ${e.toString()}');
    }
  }

  static MediaType inferMediaType(String filename, [List<int>? fileBytes]) {
    // 1. Check magic bytes if fileBytes are available
    if (fileBytes != null && fileBytes.length >= 4) {
      // PDF: %PDF (% = 0x25, P = 0x50, D = 0x44, F = 0x46)
      if (fileBytes[0] == 0x25 && fileBytes[1] == 0x50 && fileBytes[2] == 0x44 && fileBytes[3] == 0x46) {
        return MediaType('application', 'pdf');
      }
      // PNG: \x89PNG
      if (fileBytes[0] == 0x89 && fileBytes[1] == 0x50 && fileBytes[2] == 0x4E && fileBytes[3] == 0x47) {
        return MediaType('image', 'png');
      }
      // JPEG: 0xFF 0xD8 0xFF
      if (fileBytes.length >= 3 && fileBytes[0] == 0xFF && fileBytes[1] == 0xD8 && fileBytes[2] == 0xFF) {
        return MediaType('image', 'jpeg');
      }
      // GIF: GIF87a or GIF89a
      if (fileBytes.length >= 3 && fileBytes[0] == 0x47 && fileBytes[1] == 0x49 && fileBytes[2] == 0x46) {
        return MediaType('image', 'gif');
      }
      // WEBP: RIFF....WEBP
      if (fileBytes.length >= 12 &&
          fileBytes[0] == 0x52 && fileBytes[1] == 0x49 && fileBytes[2] == 0x46 && fileBytes[3] == 0x46 &&
          fileBytes[8] == 0x57 && fileBytes[9] == 0x45 && fileBytes[10] == 0x42 && fileBytes[11] == 0x50) {
        return MediaType('image', 'webp');
      }
    }

    // 2. Fallback to file extension
    final parts = filename.split('.');
    final ext = parts.length > 1 ? parts.last.toLowerCase() : '';
    switch (ext) {
      case 'pdf':
        return MediaType('application', 'pdf');
      case 'jpg':
      case 'jpeg':
        return MediaType('image', 'jpeg');
      case 'png':
        return MediaType('image', 'png');
      case 'webp':
        return MediaType('image', 'webp');
      case 'gif':
        return MediaType('image', 'gif');
      default:
        return MediaType('application', 'octet-stream');
    }
  }

  static String ensureValidFilename(String filename, MediaType mediaType) {
    final hasExtension = filename.contains('.') && filename.split('.').last.isNotEmpty;
    if (hasExtension) return filename;

    if (mediaType.type == 'application' && mediaType.subtype == 'pdf') {
      return '$filename.pdf';
    } else if (mediaType.type == 'image') {
      switch (mediaType.subtype) {
        case 'png':
          return '$filename.png';
        case 'webp':
          return '$filename.webp';
        case 'gif':
          return '$filename.gif';
        case 'jpeg':
        default:
          return '$filename.jpg';
      }
    }
    return filename;
  }

  Future<dynamic> uploadMultipart(
    String path, {
    required String fieldName,
    required List<int> fileBytes,
    required String filename,
    Map<String, String>? additionalFields,
    MediaType? contentType,
  }) async {
    try {
      final uri = _buildUri(path);
      final request = http.MultipartRequest('POST', uri);

      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      if (additionalFields != null) {
        request.fields.addAll(additionalFields);
      }

      final resolvedContentType = contentType ?? inferMediaType(filename, fileBytes);
      final resolvedFilename = ensureValidFilename(filename, resolvedContentType);

      request.files.add(
        http.MultipartFile.fromBytes(
          fieldName,
          fileBytes,
          filename: resolvedFilename,
          contentType: resolvedContentType,
        ),
      );

      final streamedResponse = await _client.send(request);
      final response = await http.Response.fromStream(streamedResponse);
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Upload error: ${e.toString()}');
    }
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode == 401) {
      clearToken();
      onUnauthorized?.call();
      final errorMsg = _extractErrorMessage(response);
      throw ApiException(
        message: errorMsg ?? 'Unauthorized. Please sign in again.',
        statusCode: 401,
      );
    }

    dynamic responseBody;
    if (response.body.isNotEmpty) {
      try {
        responseBody = jsonDecode(response.body);
      } catch (_) {
        responseBody = response.body;
      }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return responseBody;
    }

    final message = _extractErrorMessage(response) ?? 'HTTP ${response.statusCode} error';
    throw ApiException(
      message: message,
      statusCode: response.statusCode,
      details: responseBody,
    );
  }

  String? _extractErrorMessage(http.Response response) {
    try {
      if (response.body.isNotEmpty) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          return decoded['message'] as String? ?? decoded['error'] as String?;
        }
      }
    } catch (_) {}
    return null;
  }
}
