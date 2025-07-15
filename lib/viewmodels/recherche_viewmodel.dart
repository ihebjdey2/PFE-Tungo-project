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

  // Pour la sélection via la carte
  bool _selectionCartePourDepart = true;
  bool get selectionCartePourDepart => _selectionCartePourDepart;

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

  void clearErrorMessage() {
    if (_errorMessage != null) {
      _errorMessage = null;
      notifyListeners();
    }
  }

  void _setLoading(bool loading) {
    if (_isLoading == loading) return;
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _errorMessage = error;
    notifyListeners();
  }

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

  void setPointDepart(int? villeId) {
    if (villeId != null && villeId != _destinationId) {
      _pointDepartId = villeId;
      notifyListeners();
    } else {
      _setError("Le point de départ doit être différent de la destination.");
    }
  }

  void setDestination(int? villeId) {
    if (villeId != null && villeId != _pointDepartId) {
      _destinationId = villeId;
      notifyListeners();
    } else {
      _setError("La destination doit être différente du point de départ.");
    }
  }

  void clearChauffeurs() {
    _chauffeursDisponibles = [];
    notifyListeners();
  }

  Future<bool> createRecherche(String token) async {
    _setLoading(true);
    _setError(null);

    if (_pointDepartId == null || _destinationId == null) {
      _setError("Veuillez sélectionner un point de départ et une destination.");
      _setLoading(false);
      return false;
    }

    try {
      final recherche = await _rechercheService.createRecherche(
        token,
        _pointDepartId!,
        _destinationId!,
      );

      if (recherche != null) {
        _rechercheActuelle = recherche;
        notifyListeners();
        await fetchChauffeursDisponibles(token);
        return true;
      } else {
        _setError("Échec de la mise à jour de la recherche.");
        return false;
      }
    } catch (e) {
      _setError("Erreur lors de la mise à jour de la recherche : ${e.toString()}");
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<List<ChauffeurPosition>> fetchChauffeursDisponibles(String token) async {
    _setLoading(true);
    _setError(null);

    if (_pointDepartId == null || _destinationId == null) {
      _setError("Veuillez sélectionner un point de départ et une destination.");
      _setLoading(false);
      return [];
    }

    try {
      final chauffeurs = await _rechercheService.getChauffeursDisponibles(_pointDepartId!, _destinationId!);

      if (chauffeurs.isNotEmpty) {
        _chauffeursDisponibles = chauffeurs;
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

  Future<bool> cancelRecherche(String token) async {
    _setLoading(true);
    _setError(null);

    if (_rechercheActuelle == null) {
      _setError("Aucune recherche en cours.");
      _setLoading(false);
      return false;
    }

    try {
      final success = await _rechercheService.cancelRecherche();

      if (success) {
        _rechercheActuelle = null;
        _chauffeursDisponibles = [];
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

  // === Sélection via la carte ===
  void changerModeCarte({required bool pourDepart}) {
    _selectionCartePourDepart = pourDepart;
    notifyListeners();
  }

  void selectionnerDepuisCarte(int villeId) {
    if (_selectionCartePourDepart) {
      setPointDepart(villeId);
    } else {
      setDestination(villeId);
    }
  }
}
