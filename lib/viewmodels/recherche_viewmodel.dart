import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../services/recherche_service.dart';
import '../models/recherche.dart';
import '../models/chauffeur_position.dart';

class RechercheViewModel extends ChangeNotifier {
  final RechercheService _rechercheService = RechercheService();
  final Logger _logger = Logger();

  // États internes
  bool _isLoading = false;
  String? _errorMessage;
  List<ChauffeurPosition> _chauffeursDisponibles = [];
  Recherche? _rechercheActuelle;
  List<Map<String, dynamic>> _villes = [];
  int? _pointDepartId;  // ID du point de départ sélectionné
  int? _destinationId;  // ID de la destination sélectionnée
  
  Map<String, dynamic>? _stationDepart;
  Map<String, dynamic>? _stationArrivee;
  // Getters
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<ChauffeurPosition> get chauffeursDisponibles => _chauffeursDisponibles;
  Recherche? get rechercheActuelle => _rechercheActuelle;
  List<Map<String, dynamic>> get villes => _villes;
  int? get pointDepartId => _pointDepartId;
  int? get destinationId => _destinationId;

  Map<String, dynamic>? get stationDepart => _stationDepart;
  Map<String, dynamic>? get stationArrivee => _stationArrivee;
  // 🔹 Réinitialiser les erreurs
  void clearErrorMessage() {
    if (_errorMessage != null) {
      _errorMessage = null;
      _logger.i("Erreur réinitialisée.");
      notifyListeners();
    }
  }

  // 🔹 Mettre à jour l'état de chargement
  void _setLoading(bool loading) {
    if (_isLoading == loading) return;
    _isLoading = loading;
    _logger.i("État de chargement mis à jour: $_isLoading");
    notifyListeners();
  }

  // 🔹 Mettre à jour un message d'erreur
  void _setError(String? error) {
    _errorMessage = error;
    _logger.e("Erreur: $_errorMessage");
    notifyListeners();
  }

  // 🔹 Récupérer la liste des villes
  Future<void> fetchVilles() async {
    _setLoading(true);
    _setError(null);
    try {
      _villes = await _rechercheService.getVilles();
      if (_villes.isEmpty) {
        _setError('Aucune ville disponible.');
      }
      notifyListeners();
    } catch (e) {
      _setError("Erreur lors du chargement des villes: ${e.toString()}");
    } finally {
      _setLoading(false);
    }
  }

  // 🔹 Sélectionner un point de départ
  void setPointDepart(int? villeId) {
    if (villeId != null && villeId != _destinationId) {
      _pointDepartId = villeId;
      _logger.i("Point de départ sélectionné: $_pointDepartId");
      notifyListeners();
    } else {
      _setError("Le point de départ doit être différent de la destination.");
    }
  }

  // 🔹 Sélectionner une destination
  void setDestination(int? villeId) {
    if (villeId != null && villeId != _pointDepartId) {
      _destinationId = villeId;
      _logger.i("Destination sélectionnée: $_destinationId");
      notifyListeners();
    } else {
      _setError("La destination doit être différente du point de départ.");
    }
  }

  // 🔹 Vider les chauffeurs affichés (ex: en cas de changement de recherche)
  void clearChauffeurs() {
    _chauffeursDisponibles = [];
    notifyListeners();
  }

  // 🔹 Créer une recherche de trajet
  Future<bool> createRecherche(String token) async {
  _setLoading(true);
  _setError(null);

  if (_pointDepartId == null || _destinationId == null) {
    _setError("Veuillez sélectionner un point de départ et une destination.");
    _setLoading(false);
    return false;
  }

  _logger.i("🚀 Création/Mise à jour d'une recherche: départ=$_pointDepartId, destination=$_destinationId");

  try {
    final recherche = await _rechercheService.createRecherche(
      token,
      _pointDepartId!, 
      _destinationId!,
    );

    if (recherche != null) {
      _rechercheActuelle = recherche;
      _logger.i("✅ Recherche mise à jour avec succès: ${_rechercheActuelle?.toJson()}");
      notifyListeners();

      // 🔹 Mise à jour automatique des chauffeurs
      await fetchChauffeursDisponibles(token);  
      return true;
    } else {
      _setError("Échec de la mise à jour de la recherche. Veuillez réessayer.");
      return false;
    }
  } catch (e) {
    _setError("Erreur lors de la mise à jour de la recherche : ${e.toString()}");
    return false;
  } finally {
    _setLoading(false);
  }
}



  // 🔹 Obtenir les chauffeurs disponibles pour un itinéraire
Future<List<ChauffeurPosition>> fetchChauffeursDisponibles(String token) async {
  _setLoading(true);
  _setError(null);

  if (_pointDepartId == null || _destinationId == null) {
    _setError("Veuillez sélectionner un point de départ et une destination.");
    _setLoading(false);
    return [];
  }

  _logger.i("Recherche de chauffeurs: départ=$_pointDepartId, destination=$_destinationId");

  try {
    // 🔹 Appel API avec le token
    final chauffeurs = await _rechercheService.getChauffeursDisponibles(_pointDepartId!, _destinationId!);

    if (chauffeurs.isNotEmpty) {
      _chauffeursDisponibles = chauffeurs;
      _logger.i("${chauffeurs.length} chauffeurs trouvés.");
    } else {
      _chauffeursDisponibles = [];
      _setError("Aucun chauffeur disponible pour cet itinéraire.");
    }

    notifyListeners();
    return chauffeurs;
  } catch (e) {
    _setError("Erreur lors de la récupération des chauffeurs: ${e.toString()}");
    return [];
  } finally {
    _setLoading(false);
  }
}



  // 🔹 Annuler une recherche active
  Future<bool> cancelRecherche(String token) async {
    _setLoading(true);
    _setError(null);

    if (_rechercheActuelle == null) {
      _setError("Aucune recherche en cours.");
      _setLoading(false);
      return false;
    }

    _logger.i("Annulation de la recherche en cours...");

    try {
      final success = await _rechercheService.cancelRecherche();

      if (success) {
        _rechercheActuelle = null;
        _chauffeursDisponibles = [];
        _logger.i("Recherche annulée avec succès.");
        notifyListeners();
        return true;
      } else {
        _setError("Échec de l'annulation de la recherche.");
        return false;
      }
    } catch (e) {
      _setError("Erreur lors de l'annulation de la recherche: ${e.toString()}");
      return false;
    } finally {
      _setLoading(false);
    }
  }


  Future<void> fetchStationsPourTrajet() async {
  if (_pointDepartId == null || _destinationId == null) {
    _setError("Veuillez sélectionner un point de départ et une destination.");
    return;
  }

  _setLoading(true);
  _setError(null);

  try {
    final stations = await _rechercheService.getStationsPourTrajet(_pointDepartId!, _destinationId!);
    if (stations != null) {
      _stationDepart = stations['station_depart'];
      _stationArrivee = stations['station_arrivee'];
      notifyListeners();
    } else {
      _setError("Aucune station trouvée pour cet itinéraire.");
    }
  } catch (e) {
    _setError("Erreur lors de la récupération des stations : ${e.toString()}");
  } finally {
    _setLoading(false);
  }
}



}
