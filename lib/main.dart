import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// Import des ViewModels
import 'viewmodels/auth_viewmodel.dart';
import 'viewmodels/profile_viewmodel.dart';
import 'viewmodels/recherche_viewmodel.dart';
import 'viewmodels/reservation_viewmodel.dart';
import 'viewmodels/colis_viewmodel.dart';


// Import des écrans
import 'views/pages/login_screen.dart';
import 'views/pages/signup_screen.dart';
import 'views/pages/dashboard_screen.dart';
import 'views/pages/profile_screen.dart';
import 'views/pages/recherche_screen.dart';
import 'views/pages/chauffeurs_disponibles_screen.dart';
import 'views/pages/reservation_actuelle_screen.dart';
import 'views/pages/historique_reservations_screen.dart';
import 'views/pages/map_screen .dart';
import 'views/pages/reset_password_screen.dart';
import 'views/pages/forgot_password_screen.dart';
import 'views/pages/EnvoyerColisScreen.dart'; 
import 'views/pages/carte_test_screen.dart'; 
import 'views/pages/mes_colis_screen.dart'; 
import 'views/pages/suivi_colis_screen.dart'; 


void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialiser AuthViewModel pour charger le token utilisateur
  final authViewModel = AuthViewModel();
  await authViewModel.loadToken();

  runApp(MyApp(authViewModel: authViewModel));
}

class MyApp extends StatelessWidget {
  final AuthViewModel authViewModel;

  const MyApp({Key? key, required this.authViewModel}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthViewModel>.value(value: authViewModel),
        ChangeNotifierProvider(create: (_) => ProfileViewModel()),
        ChangeNotifierProvider(create: (_) => RechercheViewModel()),
        ChangeNotifierProvider(create: (_) => ReservationViewModel()), 
        ChangeNotifierProvider(create: (_) => ColisViewModel()), 

      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Réservation Louage',
        theme: ThemeData(
          primarySwatch: Colors.purple,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        initialRoute: '/login', // Toujours commencer par l'écran de connexion
        routes: {
          '/login': (context) => LoginScreen(),
          '/signup': (context) => SignupScreen(),
          '/forgot-password': (context) => ForgotPasswordScreen(),
          '/reset-password': (context) {
            final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
            return ResetPasswordScreen(token: args?['token'] ?? '');
          },
          '/dashboard': (context) => DashboardScreen(),
          '/profile': (context) => ProfileScreen(),
          '/envoyer-colis': (context) =>  EnvoyerColisScreen(), 
          '/recherche': (context) => RechercheScreen(),
          '/reservation-actuelle': (context) => ReservationActuelleScreen(),
          '/historique': (context) =>  HistoriqueReservationsScreen(),
          '/map': (context) => MapScreen(),
          '/carte-test': (context) => CarteTestScreen(),
          '/colis': (context) => MesColisScreen(),


        },
        // Gestion dynamique des routes
        onGenerateRoute: (settings) {
          if (settings.name == '/chauffeurs-disponibles') {
            final args = settings.arguments as Map<String, dynamic>;
            return MaterialPageRoute(
              builder: (context) => ChauffeursDisponiblesScreen(
                pointDepartId: args['pointDepart'],
                destinationId: args['destination'],
                token: args['token'],
              ),
            );
          }
          if (settings.name == '/suivi-colis') {
    final args = settings.arguments as Map<String, dynamic>;
    return MaterialPageRoute(
      builder: (context) => SuiviColisScreen(colis: args),
    );
  }
          return null;
        },
        
      ),
    );
  }
}
