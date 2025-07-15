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


  // Demande de réinitialisation - Version améliorée
  Future<bool> forgotPassword(String email) async {
  _setLoading(true);
  _setError(null);

  try {
    if (email.isEmpty) return _setAndReturnError('Email requis');

    if (!isValidEmail(email)) return _setAndReturnError('Format d\'email invalide');

    final result = await _authService.forgotPassword(email);

    if (result['success'] == true) {
      return true;
    } else {
      return _setAndReturnError(result['message'] ?? 'Erreur lors de la demande de réinitialisation');
    }
  } catch (e) {
    return _setAndReturnError('Erreur de connexion. Vérifiez votre connexion internet.');
  } finally {
    _setLoading(false);
  }
}


    bool _setAndReturnError(String message) {
        _setError(message);
        return false;
      }

// Réinitialisation du mot de passe
Future<bool> resetPassword({
  required String token,
  required String newPassword,
}) async {
  _setLoading(true);
  _setError(null);

  try {
    if (token.isEmpty) return _setAndReturnError('Token requis');
    if (newPassword.isEmpty) return _setAndReturnError('Mot de passe requis');
    if (newPassword.length < 6) return _setAndReturnError('Le mot de passe doit contenir au moins 6 caractères');

    final result = await _authService.resetPassword(token: token, newPassword: newPassword);

    if (result['success'] == true) {
      return true;
    } else {
      return _setAndReturnError(result['message'] ?? 'Échec de la réinitialisation');
    }
  } catch (e) {
    return _setAndReturnError('Erreur de connexion. Vérifiez votre connexion internet.');
  } finally {
    _setLoading(false);
  }
}

  // MÉTHODES UTILITAIRES SUPPLÉMENTAIRES

  // Vérifier si l'utilisateur est connecté
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  // Méthode pour valider un email
  bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }

  // Méthode pour valider un mot de passe
  Map<String, bool> validatePassword(String password) {
    return {
      'hasMinLength': password.length >= 6,
      'hasUppercase': password.contains(RegExp(r'[A-Z]')),
      'hasLowercase': password.contains(RegExp(r'[a-z]')),
      'hasDigits': password.contains(RegExp(r'[0-9]')),
      'hasSpecialCharacters': password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]')),
    };
  }

  // Obtenir la force du mot de passe (0-5)
  int getPasswordStrength(String password) {
    final validation = validatePassword(password);
    return validation.values.where((isValid) => isValid).length;
  }

  // Méthode pour nettoyer complètement l'état (utile lors de la déconnexion)
  void clearAllData() {
    _token = null;
    _errorMessage = null;
    _isLoading = false;
    notifyListeners();
  }
}