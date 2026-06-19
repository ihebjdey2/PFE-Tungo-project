import 'package:flutter/foundation.dart';
import '../services/transport_service.dart';

class TransportViewModel extends ChangeNotifier {
  final TransportService _service = TransportService();

  bool isLoading = false;
  String? error;

  List<dynamic> horaires = [];       // résultats de recherche
  List<dynamic> reservations = [];   // réservations actuelles
  List<dynamic> historique = [];     // historique des réservations

  /// 🔍 Recherche des horaires disponibles (bus/train)
  Future<void> rechercher({
    required String token,
    required int villeDepartId,
    required int villeArriveeId,
    required String dateVoyage,
    required String typeTransport, // 'bus' ou 'train'
  }) async {
    try {
      isLoading = true;
      error = null;
      horaires = [];
      notifyListeners();

      final result = await _service.searchHoraires(
        token: token,
        villeDepartId: villeDepartId,
        villeArriveeId: villeArriveeId,
        dateVoyage: dateVoyage,
        typeTransport: typeTransport,
      );

      horaires = result["resultats"] ?? [];
    } catch (e) {
      error = "Erreur lors de la recherche : $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// 🚌 Réserver une place (bus/train)
  Future<bool> reserver({
    required String token,
    required int horaireId,
    required int departId,
    required int arriveeId,
    required int nombrePlaces,
    required String dateVoyage,
  }) async {
    try {
      isLoading = true;
      error = null;
      notifyListeners();

      final result = await _service.createReservation(
        token: token,
        horaireId: horaireId,
        departId: departId,
        arriveeId: arriveeId,
        nombrePlaces: nombrePlaces,
        dateVoyage: dateVoyage,
      );

      if (result.containsKey("reservation")) {
        reservations.add(result["reservation"]);
      }
      return true;
    } catch (e) {
      error = "Erreur lors de la réservation : $e";
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// 📋 Charger mes réservations en cours
  Future<void> fetchReservations(String token) async {
    try {
      isLoading = true;
      error = null;
      notifyListeners();

      reservations = await _service.getMyReservations(token);
    } catch (e) {
      error = "Erreur lors du chargement des réservations : $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// 🕓 Charger mon historique de réservations
  Future<void> fetchHistorique(String token) async {
    try {
      isLoading = true;
      error = null;
      notifyListeners();

      historique = await _service.getHistoriqueReservations(token);
    } catch (e) {
      error = "Erreur lors du chargement de l’historique : $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// ❌ Annuler une réservation
  Future<void> annulerReservation(String token, int id) async {
    try {
      await _service.cancelReservation(id, token);
      reservations.removeWhere((r) => r["id"] == id);
      notifyListeners();
    } catch (e) {
      error = "Erreur lors de l’annulation : $e";
    }
  }

  void clearHoraires() {
  horaires = [];
  error = null;
  isLoading = false;
  notifyListeners();
}

}
