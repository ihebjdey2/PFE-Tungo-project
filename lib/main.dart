import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// Import des ViewModels
import 'viewmodels/auth_viewmodel.dart';
import 'viewmodels/profile_viewmodel.dart';
import 'viewmodels/recherche_viewmodel.dart';
import 'viewmodels/reservation_viewmodel.dart';


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
          '/dashboard': (context) => DashboardScreen(),
          '/profile': (context) => ProfileScreen(),
          '/recherche': (context) => RechercheScreen(),
          '/reservation-actuelle': (context) => ReservationActuelleScreen(),
          '/historique': (context) =>  HistoriqueReservationsScreen(),
          '/map': (context) => MapScreen(),


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
          return null;
        },
      ),
    );
  }
}
