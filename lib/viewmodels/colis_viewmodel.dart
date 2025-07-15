import 'package:flutter/foundation.dart';
import '../models/colis.dart';
import '../services/colis_service.dart';

class ColisViewModel extends ChangeNotifier {
  final ColisService _colisService = ColisService();

  /// 🌀 État général
  bool isLoading = false;
  String? errorMessage;

  /// 📦 Liste des colis du client
  List<Colis> _colisClient = [];
  bool _isLoadingClient = false;

  List<Colis> get colisClient => _colisClient;
  bool get isLoadingClient => _isLoadingClient;

  /// 🚀 Créer un colis (ville_depart_id, etc.)
  Future<bool> creerColis(Map<String, dynamic> colisData, String token) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final result = await _colisService.createColis(colisData, token);
      return result;
    } catch (e) {
      errorMessage = 'Erreur: ${e.toString()}';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// 📋 Récupérer les colis du client connecté
  Future<void> fetchColisClient(String token) async {
    _isLoadingClient = true;
    notifyListeners();

    try {
      _colisClient = await _colisService.getColisClient(token);
    } catch (e) {
      debugPrint('Erreur fetchColisClient: $e');
      _colisClient = [];
    }

    _isLoadingClient = false;
    notifyListeners();
  }

    /// 📄 Récupérer les détails d’un colis spécifique
  Future<Colis?> getColisDetails(int colisId, String token) async {
    try {
      isLoading = true;
      notifyListeners();

      final colis = await _colisService.getColisByIdForClient(colisId, token);
      return colis;
    } catch (e) {
      errorMessage = 'Erreur récupération colis : ${e.toString()}';
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

}
