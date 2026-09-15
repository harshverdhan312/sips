import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../models/placement_alert.dart';
import '../../providers/sips_providers.dart';

class AlertsScreen extends ConsumerWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alertsAsync = ref.watch(alertsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: const Text('Placement Alerts & Intel'),
      ),
      body: alertsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(child: Text('Error loading alerts: $err')),
        data: (alerts) {
          final unreadCount = alerts.where((a) => !a.isRead).length;

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Intel Digest Card
                SipsCard(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.primaryFixed,
                          borderRadius: AppRadius.mdRadius,
                        ),
                        child: const Icon(Icons.campaign_rounded, color: AppColors.primary, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Real-Time Placement Telemetry',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: AppColors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$unreadCount unread updates from placement cell and AI telemetry.',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                color: AppColors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Alerts List
                ...alerts.map((alert) => _buildAlertCard(context, ref, alert)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildAlertCard(BuildContext context, WidgetRef ref, PlacementAlert alert) {
    IconData icon;
    Color iconColor;
    Color iconBg;

    switch (alert.type) {
      case AlertType.campusDrive:
        icon = Icons.domain_rounded;
        iconColor = AppColors.primary;
        iconBg = AppColors.primaryFixed;
        break;
      case AlertType.readinessBoost:
        icon = Icons.trending_up_rounded;
        iconColor = const Color(0xFF047857);
        iconBg = const Color(0xFFD1FAE5);
        break;
      case AlertType.interviewFeedback:
        icon = Icons.assignment_turned_in_rounded;
        iconColor = AppColors.secondary;
        iconBg = AppColors.secondaryFixed;
        break;
      case AlertType.skillGap:
        icon = Icons.warning_amber_rounded;
        iconColor = const Color(0xFFB45309);
        iconBg = const Color(0xFFFEF3C7);
        break;
      case AlertType.system:
        icon = Icons.info_outline_rounded;
        iconColor = AppColors.outline;
        iconBg = AppColors.surfaceContainer;
        break;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SipsCard(
        color: alert.isRead ? AppColors.surfaceContainerLowest : const Color(0xFFFBFBFF),
        borderColor: alert.isUrgent ? const Color(0xFFFCA5A5) : AppColors.borderStroke,
        padding: const EdgeInsets.all(16),
        onTap: () {
          ref.read(alertsProvider.notifier).markAsRead(alert.id);
          if (alert.actionRoute != null) {
            context.push(alert.actionRoute!);
          }
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: AppRadius.mdRadius,
                  ),
                  child: Icon(icon, color: iconColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          if (alert.isUrgent)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEE2E2),
                                borderRadius: AppRadius.fullRadius,
                              ),
                              child: Text(
                                'URGENT',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF991B1B),
                                ),
                              ),
                            )
                          else
                            const SizedBox.shrink(),
                          Text(
                            alert.timestamp,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              color: AppColors.outline,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        alert.title,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        alert.description,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: AppColors.onSurfaceVariant,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (alert.actionLabel != null && alert.actionRoute != null) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: SipsButton(
                  label: alert.actionLabel!,
                  variant: SipsButtonVariant.outline,
                  size: SipsButtonSize.small,
                  trailingIcon: Icons.arrow_forward_rounded,
                  onPressed: () {
                    ref.read(alertsProvider.notifier).markAsRead(alert.id);
                    context.push(alert.actionRoute!);
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
