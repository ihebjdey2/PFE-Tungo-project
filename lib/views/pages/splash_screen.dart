import 'package:flutter/material.dart';
import 'dart:ui';
import 'dart:math' as math;

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late AnimationController _particlesController;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<double> _glowAnimation;
  late Animation<double> _textSlide;
  late Animation<double> _textOpacity;
  late Animation<double> _routeAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    );

    _particlesController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat();

    // Logo avec effet de rebond moderne
    _logoScale = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.0, end: 1.15).chain(CurveTween(curve: Curves.easeOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.15, end: 1.0).chain(CurveTween(curve: Curves.elasticOut)),
        weight: 50,
      ),
    ]).animate(_controller);

    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.4, curve: Curves.easeIn),
      ),
    );

    // Effet glow pulsant
    _glowAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ),
    );

    // Texte qui glisse depuis le bas
    _textSlide = Tween<double>(begin: 50.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.5, 0.9, curve: Curves.easeOutCubic),
      ),
    );

    _textOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.5, 0.9, curve: Curves.easeIn),
      ),
    );

    // Animation de route
    _routeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.2, 0.8, curve: Curves.easeInOut),
      ),
    );

    _controller.forward();

    Future.delayed(const Duration(milliseconds: 2800), () {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/onboarding');
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _particlesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: AnimatedBuilder(
        animation: Listenable.merge([_controller, _particlesController]),
        builder: (context, child) {
          return Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF7B2CBF), // Violet moderne
                  Color(0xFF5A189A), // Violet profond
                  Color(0xFF240046), // Violet très foncé
                ],
              ),
            ),
            child: Stack(
              children: [
                // Particules animées en arrière-plan
                ...List.generate(15, (index) {
                  final offset = (index * 0.2) % 1.0;
                  final progress = (_particlesController.value + offset) % 1.0;
                  final x = size.width * (0.1 + (index % 5) * 0.2);
                  final y = size.height * progress;
                  
                  return Positioned(
                    left: x,
                    top: y,
                    child: Opacity(
                      opacity: (1.0 - progress) * 0.3,
                      child: Container(
                        width: 4 + (index % 3) * 2,
                        height: 4 + (index % 3) * 2,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.white.withOpacity(0.5),
                              blurRadius: 8,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),

                // Route animée moderne (lignes connectées)
                Positioned.fill(
                  child: Opacity(
                    opacity: _routeAnimation.value * 0.3,
                    child: CustomPaint(
                      painter: ModernRoutePainter(_routeAnimation.value),
                    ),
                  ),
                ),

                // Logo au centre avec effet glow
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Logo avec effet de glow pulsant
                      Opacity(
                        opacity: _logoOpacity.value,
                        child: Transform.scale(
                          scale: _logoScale.value,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // Glow externe
                              Container(
                                width: 180 * _glowAnimation.value,
                                height: 180 * _glowAnimation.value,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF9D4EDD).withOpacity(0.4),
                                      blurRadius: 60,
                                      spreadRadius: 20,
                                    ),
                                  ],
                                ),
                              ),
                              // Container du logo avec glassmorphism
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white.withOpacity(0.95),
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.3),
                                    width: 2,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.2),
                                      blurRadius: 30,
                                      spreadRadius: 5,
                                    ),
                                  ],
                                ),
                                child: ClipOval(
                                  child: Image.asset(
                                    "assets/icon/tungo_client.png",
                                    width: 110,
                                    height: 110,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 32),
                      
                      // Texte avec effet de slide
                      Transform.translate(
                        offset: Offset(0, _textSlide.value),
                        child: Opacity(
                          opacity: _textOpacity.value,
                          child: Column(
                            children: [
                              // Nom de la plateforme
                              ShaderMask(
                                shaderCallback: (bounds) => const LinearGradient(
                                  colors: [
                                    Colors.white,
                                    Color(0xFFE0AAFF),
                                  ],
                                ).createShader(bounds),
                                child: const Text(
                                  'TunGo',
                                  style: TextStyle(
                                    fontSize: 56,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: 3,
                                    shadows: [
                                      Shadow(
                                        blurRadius: 20,
                                        color: Colors.black26,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              // Slogan
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(20),
                                  color: Colors.white.withOpacity(0.1),
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.2),
                                    width: 1,
                                  ),
                                ),
                                child: const Text(
                                  'Voyagez en Tunisie',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.white,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Indicateur de chargement moderne en bas
                Positioned(
                  bottom: 60,
                  left: 0,
                  right: 0,
                  child: Opacity(
                    opacity: _textOpacity.value,
                    child: Center(
                      child: SizedBox(
                        width: 40,
                        height: 40,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white.withOpacity(0.5),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

// Painter pour route moderne avec lignes connectées
class ModernRoutePainter extends CustomPainter {
  final double progress;

  ModernRoutePainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.2)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    // Dessiner des lignes connectées (effet réseau routier)
    final points = [
      Offset(size.width * 0.1, size.height * 0.3),
      Offset(size.width * 0.4, size.height * 0.2),
      Offset(size.width * 0.6, size.height * 0.4),
      Offset(size.width * 0.9, size.height * 0.3),
      Offset(size.width * 0.7, size.height * 0.6),
      Offset(size.width * 0.3, size.height * 0.7),
    ];

    for (int i = 0; i < points.length - 1; i++) {
      final path = Path()
        ..moveTo(points[i].dx, points[i].dy)
        ..lineTo(points[i + 1].dx, points[i + 1].dy);

      canvas.drawPath(path, paint);

      // Points de destination
      if (progress > (i / points.length)) {
        final circlePaint = Paint()
          ..color = Colors.white.withOpacity(0.4)
          ..style = PaintingStyle.fill;

        canvas.drawCircle(points[i], 4, circlePaint);
      }
    }
  }

  @override
  bool shouldRepaint(ModernRoutePainter oldDelegate) => true;
}