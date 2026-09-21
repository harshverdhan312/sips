import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/student_avatar.dart';
import '../../providers/sips_providers.dart';

class MainShellScreen extends ConsumerWidget {
  final Widget child;

  const MainShellScreen({
    super.key,
    required this.child,
  });

  int _calculateSelectedIndex(BuildContext context) {
    final String location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/home')) return 0;
    if (location.startsWith('/skills')) return 1;
    if (location.startsWith('/opportunities')) return 2;
    if (location.startsWith('/growth') || location.startsWith('/roadmap')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.go('/skills');
        break;
      case 2:
        context.go('/opportunities');
        break;
      case 3:
        context.go('/growth');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIndex = _calculateSelectedIndex(context);
    final alertsAsync = ref.watch(alertsProvider);
    final int unreadAlertsCount = alertsAsync.maybeWhen(
      data: (alerts) => alerts.where((a) => !a.isRead).length,
      orElse: () => 0,
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLowest.withValues(alpha: 0.95),
            border: const Border(
              bottom: BorderSide(color: AppColors.borderStroke, width: 1),
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 8,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  // Brand Logo Mark & Live Radar Badge
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      gradient: AppColors.cobaltGradient,
                      borderRadius: AppRadius.mdRadius,
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.insights_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          Text(
                            'SIPS',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.onSurface,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE6F8F0),
                              borderRadius: AppRadius.fullRadius,
                              border: Border.all(
                                color: const Color(0xFF10B981).withValues(alpha: 0.4),
                                width: 0.8,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 5,
                                  height: 5,
                                  decoration: const BoxDecoration(
                                    color: AppColors.emerald,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'LIVE',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF047857),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      Text(
                        'Placement Hub',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Notification Alerts Bell
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.notifications_outlined, size: 22),
                        color: AppColors.onSurfaceVariant,
                        onPressed: () => context.push('/alerts'),
                        tooltip: 'Placement Alerts',
                      ),
                      if (unreadAlertsCount > 0)
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: AppColors.error,
                              shape: BoxShape.circle,
                            ),
                            constraints: const BoxConstraints(
                              minWidth: 8,
                              minHeight: 8,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 2),
                  // User Avatar
                  Consumer(
                    builder: (context, ref, _) {
                      final profileAsync = ref.watch(studentProfileProvider);
                      final profile = profileAsync.valueOrNull;
                      return GestureDetector(
                        onTap: () => context.go('/profile'),
                        child: StudentAvatar(
                          profileImageUrl: profile?.profileImageUrl ?? '',
                          name: profile?.name ?? '',
                          size: 32,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest.withValues(alpha: 0.96),
          border: const Border(
            top: BorderSide(color: AppColors.borderStroke, width: 1),
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 16,
              offset: Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 62,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(
                  index: 0,
                  isSelected: selectedIndex == 0,
                  icon: Icons.grid_view_rounded,
                  label: 'HOME',
                  onTap: () => _onItemTapped(0, context),
                ),
                _buildNavItem(
                  index: 1,
                  isSelected: selectedIndex == 1,
                  icon: Icons.radar_rounded,
                  label: 'SKILLS',
                  onTap: () => _onItemTapped(1, context),
                ),
                _buildNavItem(
                  index: 2,
                  isSelected: selectedIndex == 2,
                  icon: Icons.work_outline_rounded,
                  label: 'JOBS',
                  onTap: () => _onItemTapped(2, context),
                ),
                _buildNavItem(
                  index: 3,
                  isSelected: selectedIndex == 3,
                  icon: Icons.trending_up_rounded,
                  label: 'GROWTH',
                  onTap: () => _onItemTapped(3, context),
                ),
                _buildNavItem(
                  index: 4,
                  isSelected: selectedIndex == 4,
                  icon: Icons.person_outline_rounded,
                  label: 'PROFILE',
                  onTap: () => _onItemTapped(4, context),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required bool isSelected,
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    final fg = isSelected ? AppColors.primary : AppColors.onSurfaceVariant;
    final bg = isSelected ? AppColors.primaryFixed.withValues(alpha: 0.6) : Colors.transparent;

    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.lgRadius,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: AppRadius.lgRadius,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: fg,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: fg,
                letterSpacing: 0.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
