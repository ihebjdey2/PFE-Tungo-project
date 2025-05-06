import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/profile_service.dart';
import 'dart:io';

class ProfileViewModel extends ChangeNotifier {
  final ProfileService _profileService = ProfileService();

  bool _isLoading = false;
  String? _errorMessage;
  Map<String, dynamic>? _profileData;

  // Getters
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  Map<String, dynamic>? get profileData => _profileData;

  // Gestion de l'état de chargement
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Gestion des erreurs
  void _setError(String? error) {
    _errorMessage = error;
    notifyListeners();
  }

  // Récupérer le profil utilisateur
  Future<void> fetchProfile() async {
    _setLoading(true);
    _setError(null);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) {
        _setError("Token manquant. Veuillez vous reconnecter.");
        return;
      }

      print("Token utilisé : $token");

      final data = await _profileService.getProfile(token);
      if (data != null) {
        print("Données reçues : $data");
        _profileData = data;
        notifyListeners();
      } else {
        _setError("Impossible de charger les données du profil.");
      }
    } catch (e) {
      _setError("Erreur lors de la récupération du profil : $e");
    } finally {
      _setLoading(false);
    }
  }

  // Mettre à jour le profil utilisateur
  Future<bool> updateProfile({
    String? nom,
    String? prenom,
    String? email,
    String? adresse,
    String? languePreference,
    String? numeroDeTelephone,
    String? motDePasse,
    File? image,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) {
        _setError("Token manquant. Veuillez vous reconnecter.");
        return false;
      }

      final response = await _profileService.updateProfile(
        token: token,
        nom: nom,
        prenom: prenom,
        email: email,
        adresse: adresse,
        languePreference: languePreference,
        numeroDeTelephone: numeroDeTelephone,
        motDePasse: motDePasse,
        image: image,
      );

      if (response != null) {
        print("Profil mis à jour avec succès : $response");
        _profileData = response;
        notifyListeners();
        return true;
      } else {
        _setError("Échec de la mise à jour du profil.");
        return false;
      }
    } catch (e) {
      _setError("Erreur lors de la mise à jour du profil : $e");
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Réinitialiser les erreurs
  void clearErrorMessage() {
    _errorMessage = null;
    notifyListeners();
  }
}
