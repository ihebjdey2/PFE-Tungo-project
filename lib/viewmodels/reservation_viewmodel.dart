import 'package:flutter/material.dart';
import '../services/reservation_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';

class ReservationViewModel extends ChangeNotifier {
  final ReservationService _reservationService = ReservationService();
  final Logger _logger = Logger();

  bool _isLoading = false;
  String? _errorMessage;
  List<Map<String, dynamic>> _reservations = [];
  Map<String, dynamic>? _currentReservation; // 🔹 Stocke la réservation actuelle


  // Getters
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<Map<String, dynamic>> get reservations => _reservations;
  Map<String, dynamic>? get currentReservation => _currentReservation;

  // 🔹 Mettre à jour l'état de chargement
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // 🔹 Mettre à jour un message d'erreur
  void _setError(String? error) {
    _errorMessage = error;
    notifyListeners();
  }

  // 🔹 Créer une réservation
  Future<bool> createReservation({
  required String token,
  required int chauffeurId,
  required int villeDepartId,
  required int villeDestinationId,
  required int  nombre_places,
}) async {
  _setLoading(true);
  _setError(null);

  try {
    final reservation = await _reservationService.createReservation(
      token: token,
      chauffeurId: chauffeurId,
      villeDepartId: villeDepartId,
      villeDestinationId: villeDestinationId,
      nombre_places: nombre_places,
    );

    if (reservation != null) {
      _logger.i("✅ Réservation créée avec succès: $reservation");
      _reservations.add(reservation); // 🔹 Ajouter la réservation correctement
      notifyListeners();
      return true;
    } else {
      _setError("Échec de la réservation. Veuillez réessayer.");
      return false;
    }
  } catch (e) {
    _setError("Erreur lors de la réservation : ${e.toString()}");
    return false;
  } finally {
    _setLoading(false);
  }
}


 // 🔹 Récupérer la réservation actuelle du client
 Future<void> fetchCurrentReservation() async {
  _setLoading(true);
  _setError(null);

  try {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token'); // 🔹 Récupère le token comme fetchProfile()
    
    if (token == null) {
      _setError("Token manquant. Veuillez vous reconnecter.");
      return;
    }

    _logger.i("📢 Token utilisé pour la réservation : $token");

    final reservation = await _reservationService.getCurrentReservation(token);
    if (reservation != null) {
       _logger.i("✅ Réservation récupérée : $reservation"); // Log des données complètes
      if (reservation['statut'] != null) {
        _logger.d("📊 Statut de la réservation : ${reservation['statut']}");
      }
      _currentReservation = reservation;
      notifyListeners();
    } else {
      _logger.w("❌ Aucune réservation trouvée.");
      _setError("Aucune réservation en cours.");
    }
  } catch (e) {
    _setError("⛔ Erreur lors de la récupération de la réservation : $e");
  } finally {
    _setLoading(false);
  }
}


Future<bool> cancelCurrentReservation() async {
  _setLoading(true);
  _setError(null);

  try {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token == null || _currentReservation == null) {
      _setError("Aucune réservation en cours ou token manquant.");
      return false;
    }

    final success = await _reservationService.cancelReservation(
      token,
      _currentReservation!['id'],
    );

    if (success) {
      _currentReservation = null;
      notifyListeners();
      return true;
    } else {
      _setError("Impossible d'annuler la réservation.");
      return false;
    }
  } catch (e) {
    _setError("Erreur lors de l'annulation : ${e.toString()}");
    return false;
  } finally {
    _setLoading(false);
  }
}



Future<void> fetchReservationHistory() async {
  _setLoading(true);
  _setError(null);

  try {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token == null) {
      _setError("Token manquant. Veuillez vous reconnecter.");
      return;
    }

    final history = await _reservationService.getReservationHistory(token);
    if (history != null) {
      _reservations = history;
      notifyListeners();
    } else {
      _setError("Aucune réservation passée trouvée.");
    }
  } catch (e) {
    _setError("Erreur lors de la récupération de l'historique : ${e.toString()}");
  } finally {
    _setLoading(false);
  }
}

  // 🔹 Créer une réservation de véhicule
  Future<bool> createVehiculeReservation({
    required String token,
    required int villeDepartId,
    required int villeDestinationId,
    required DateTime dateReservation,
    required TimeOfDay heureDepart,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      // Formater la date au format YYYY-MM-DD
      final formattedDate = "${dateReservation.year}-${dateReservation.month.toString().padLeft(2, '0')}-${dateReservation.day.toString().padLeft(2, '0')}";
      
      // Formater l'heure au format HH:mm:ss
      final formattedTime = "${heureDepart.hour.toString().padLeft(2, '0')}:${heureDepart.minute.toString().padLeft(2, '0')}:00";

      _logger.i("📅 Date formatée : $formattedDate");
      _logger.i("⏰ Heure formatée : $formattedTime");

      final reservation = await _reservationService.createVehiculeReservation(
        token: token,
        villeDepartId: villeDepartId,
        villeDestinationId: villeDestinationId,
        dateReservation: formattedDate,
        heureDepart: formattedTime,
      );

      if (reservation != null) {
        _logger.i("✅ Réservation de véhicule créée avec succès: $reservation");
        _currentReservation = reservation;
        notifyListeners();
        return true;
      } else {
        _setError("Échec de la réservation de véhicule. Veuillez réessayer.");
        return false;
      }
    } catch (e) {
      _logger.e("⛔ Erreur lors de la réservation de véhicule : $e");
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

}