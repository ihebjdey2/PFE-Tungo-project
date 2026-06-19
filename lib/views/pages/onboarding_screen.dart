import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_svg/flutter_svg.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({Key? key}) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, String>> onboardingData = [
    {
      "image": "assets/images/onboarding1.svg",
      "title": "Bienvenue sur Tungo",
      "description": "Cherchez et réservez facilement vos trajets interurbains en Tunisie."
    },
    {
      "image": "assets/images/onboarding2.svg",
      "title": "Réservez en un clic",
      "description": "Choisissez votre transport : louage, bus ou train, rapidement et en toute sécurité."
    },
    {
      "image": "assets/images/onboarding3.svg",
      "title": "Suivi en temps réel",
      "description": "Suivez votre chauffeur et vos colis directement depuis l’application."
    },
    {
      "image": "assets/images/onboarding4.svg",
      "title": "Paiement sécurisé",
      "description": "Payez vos réservations en toute sécurité et recevez vos tickets instantanément."
    },
  ];

  void _completeOnboarding() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setBool("onboarding_complete", true);
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, "/login");
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    itemCount: onboardingData.length,
                    onPageChanged: (int index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
                        child: Column(
                          children: [
                            Expanded(
                              child: SvgPicture.asset(
                                onboardingData[index]["image"]!,
                                width: double.infinity,
                                height: 300,
                                fit: BoxFit.contain,
                              ),
                            ),
                            const SizedBox(height: 25),
                            Text(
                              onboardingData[index]["title"]!,
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: primaryColor,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 15),
                            Text(
                              onboardingData[index]["description"]!,
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey[700],
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Dots indicators
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    onboardingData.length,
                    (index) => AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.symmetric(horizontal: 5),
                      width: _currentPage == index ? 24 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _currentPage == index ? primaryColor : Colors.grey[300],
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 25),

                // Bouton Suivant / Commencer
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Container(
                    width: double.infinity,
                    height: 50,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: LinearGradient(
                        colors: [primaryColor, primaryColor.withOpacity(0.8)],
                      ),
                    ),
                    child: ElevatedButton(
                      onPressed: () {
                        if (_currentPage == onboardingData.length - 1) {
                          _completeOnboarding();
                        } else {
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 700),
                            curve: Curves.easeInOut,
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        _currentPage == onboardingData.length - 1 ? "Commencer" : "Suivant",
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
              ],
            ),

            // Flèche Retour en haut à gauche
            if (_currentPage > 0)
              Positioned(
                top: 20,
                left: 16,
                child: GestureDetector(
                  onTap: () {
                    _pageController.previousPage(
                      duration: const Duration(milliseconds: 500),
                      curve: Curves.easeInOut,
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.grey.withOpacity(0.3),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.arrow_back,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
