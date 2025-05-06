import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';
import 'dart:io';


class AuthViewModel extends ChangeNotifier {
  final AuthService _authService = AuthService();
  bool _isLoading = false;
  String? _errorMessage;
  String? _token;

  // Getters
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get token => _token;

  // Réinitialiser les erreurs
  void clearErrorMessage() {
    _errorMessage = null;
    notifyListeners();
  }

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

  // Charger le token depuis SharedPreferences
  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    notifyListeners();
  }

  // Sauvegarder le token dans SharedPreferences
  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  // Supprimer le token
  Future<void> _removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  // Inscription
  Future<bool> signup({
    required String nom,
    required String prenom,
    required String email,
    required String motDePasse,
    String? adresse,
    String languePreference = 'fr',
    String? numeroDeTelephone,
    File? image,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _authService.signup(
        nom: nom,
        prenom: prenom,
        email: email,
        motDePasse: motDePasse,
        adresse: adresse,
        languePreference: languePreference,
        numeroDeTelephone: numeroDeTelephone,
        image: image,
      );

      if (response != null && response['token'] != null) {
        _token = response['token'];
        await _saveToken(_token!);
        return true;
      } else {
        _setError("Échec de l'inscription. Vérifiez vos informations.");
        return false;
      }
    } catch (e) {
      _setError("Erreur lors de l'inscription : $e");
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Connexion
  Future<bool> signin({required String email, required String motDePasse}) async {
    _setLoading(true);
    _setError(null);

    try {
      final response = await _authService.signin(email: email, motDePasse: motDePasse);

      if (response != null && response['token'] != null) {
        _token = response['token'];
        await _saveToken(_token!);
        return true;
      } else {
        _setError("Identifiants incorrects. Veuillez réessayer.");
        return false;
      }
    } catch (e) {
      _setError("Erreur lors de la connexion : $e");
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Déconnexion
  Future<void> logout() async {
    _token = null;
    await _removeToken();
    notifyListeners();
  }
}
