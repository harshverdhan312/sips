import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../core/network/api_client.dart';

class StudentAvatar extends StatelessWidget {
  final String profileImageUrl;
  final String name;
  final double size;
  final VoidCallback? onTap;
  final bool showUploadOverlay;
  final bool isUploading;
  final VoidCallback? onDelete;

  const StudentAvatar({
    super.key,
    required this.profileImageUrl,
    required this.name,
    this.size = 40,
    this.onTap,
    this.showUploadOverlay = false,
    this.isUploading = false,
    this.onDelete,
  });

  String _getInitials(String input) {
    final clean = input.trim();
    if (clean.isEmpty) return 'ST';
    final parts = clean.split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    if (parts.isNotEmpty && parts[0].isNotEmpty) {
      final first = parts[0];
      return first.substring(0, first.length >= 2 ? 2 : 1).toUpperCase();
    }
    return 'ST';
  }

  String _resolveImageUrl(String url) {
    if (url.isEmpty) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    final base = ApiConfig.baseUrl.endsWith('/')
        ? ApiConfig.baseUrl.substring(0, ApiConfig.baseUrl.length - 1)
        : ApiConfig.baseUrl;
    final path = url.startsWith('/') ? url : '/$url';
    return '$base$path';
  }

  @override
  Widget build(BuildContext context) {
    final resolvedUrl = _resolveImageUrl(profileImageUrl);
    final initials = _getInitials(name);
    final fontSize = size * 0.38;

    Widget avatarContent;

    if (resolvedUrl.isNotEmpty) {
      avatarContent = ClipOval(
        child: Image.network(
          resolvedUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _buildInitialsFallback(initials, fontSize);
          },
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Container(
              width: size,
              height: size,
              color: AppColors.surfaceContainerLow,
              child: const Center(
                child: SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                ),
              ),
            );
          },
        ),
      );
    } else {
      avatarContent = _buildInitialsFallback(initials, fontSize);
    }

    Widget avatarWidget = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.25),
          width: size > 50 ? 2.5 : 1.5,
        ),
      ),
      child: avatarContent,
    );

    if (onTap != null || showUploadOverlay) {
      avatarWidget = Stack(
        alignment: Alignment.center,
        children: [
          avatarWidget,
          if (showUploadOverlay)
            Positioned.fill(
              child: Material(
                color: Colors.transparent,
                shape: const CircleBorder(),
                child: InkWell(
                  onTap: onTap,
                  customBorder: const CircleBorder(),
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isUploading ? Colors.black54 : Colors.transparent,
                    ),
                    child: isUploading
                        ? const Center(
                            child: SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            ),
                          )
                        : null,
                  ),
                ),
              ),
            ),
          if (onDelete != null && resolvedUrl.isNotEmpty && !isUploading)
            Positioned(
              top: 0,
              right: 0,
              child: GestureDetector(
                onTap: onDelete,
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.close_rounded,
                    color: Colors.white,
                    size: 12,
                  ),
                ),
              ),
            ),
        ],
      );
    }

    return avatarWidget;
  }

  Widget _buildInitialsFallback(String initials, double fontSize) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: AppColors.primaryFixed,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: GoogleFonts.plusJakartaSans(
            fontSize: fontSize,
            fontWeight: FontWeight.w800,
            color: AppColors.onPrimaryFixed,
          ),
        ),
      ),
    );
  }
}
