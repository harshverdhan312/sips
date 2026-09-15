import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../core/widgets/sips_text_field.dart';
import '../../providers/sips_providers.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _emailController = TextEditingController(text: 'aarav.sharma@nit.ac.in');
  final _passwordController = TextEditingController(text: '••••••••••••');
  bool _obscurePassword = true;
  int _selectedTab = 0; // 0: University Email, 1: Roll No OTP
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    await ref.read(authProvider.notifier).signIn(_emailController.text, _passwordController.text);
    if (mounted) {
      setState(() => _isLoading = false);
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.go('/welcome'),
        ),
        title: const Text('Authentication'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Center(
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: AppColors.cobaltGradient,
                    borderRadius: AppRadius.lgRadius,
                  ),
                  child: const Icon(Icons.lock_outline_rounded, color: Colors.white, size: 26),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Text(
                  'Student Portal Access',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.onSurface,
                    letterSpacing: -0.4,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Center(
                child: Text(
                  'Authenticate with your verified college credentials to view live placement scores & company drives.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    color: AppColors.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Segmented Tab Picker
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: AppRadius.lgRadius,
                  border: Border.all(color: AppColors.outlineVariant, width: 1),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildTabButton(0, 'University Email'),
                    ),
                    Expanded(
                      child: _buildTabButton(1, 'Roll Number OTP'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Form Card
              SipsCard(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SipsTextField(
                      label: _selectedTab == 0 ? 'Institute Email Address' : 'College Roll / Registration No.',
                      hint: _selectedTab == 0 ? 'e.g. rollno@nit.ac.in' : 'e.g. 2022CSE042',
                      controller: _emailController,
                      prefixIcon: _selectedTab == 0 ? Icons.email_outlined : Icons.badge_outlined,
                    ),
                    const SizedBox(height: 16),
                    SipsTextField(
                      label: 'Password / Auth Token',
                      hint: 'Enter your password',
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      prefixIcon: Icons.key_outlined,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          size: 20,
                          color: AppColors.outline,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {},
                        style: TextButton.styleFrom(padding: EdgeInsets.zero),
                        child: Text(
                          'Forgot Password?',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SipsButton(
                      label: 'Sign In to Workspace',
                      isFullWidth: true,
                      size: SipsButtonSize.large,
                      isLoading: _isLoading,
                      onPressed: _handleLogin,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Demo Fast-Track Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: AppRadius.lgRadius,
                  border: Border.all(color: const Color(0xFF86EFAC), width: 1),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.flash_on_rounded, color: Color(0xFF16A34A), size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Demo Candidate Quick Access',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF15803D),
                            ),
                          ),
                          Text(
                            'Aarav Sharma • NIT CSE Final Year',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              color: const Color(0xFF166534),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SipsButton(
                      label: 'Auto Fill',
                      variant: SipsButtonVariant.emerald,
                      size: SipsButtonSize.small,
                      onPressed: () {
                        _emailController.text = 'aarav.sharma@nit.ac.in';
                        _passwordController.text = 'password123';
                        _handleLogin();
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.verified_user_outlined, size: 14, color: AppColors.outline),
                    const SizedBox(width: 6),
                    Text(
                      'Secured by Campus Placement Telemetry Shield',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        color: AppColors.outline,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabButton(int index, String title) {
    final isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.surfaceContainerLowest : Colors.transparent,
          borderRadius: AppRadius.mdRadius,
          boxShadow: isSelected
              ? [
                  const BoxShadow(
                    color: Color(0x0C000000),
                    blurRadius: 4,
                    offset: Offset(0, 1),
                  ),
                ]
              : null,
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? AppColors.onSurface : AppColors.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
