import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import '../utils/constants.dart';

class AuthService {
  final String baseUrl = ApiConstants.baseUrl;
  final logger = Logger();

 // Inscription (Signup) 
  Future<Map<String, dynamic>?> signup({
    required String nom,
    required String prenom,
    required String email,
    required String motDePasse,
    String? adresse,
    String languePreference = 'fr',
    String? numeroDeTelephone,
    File? image, 
  }) async {
    final url = Uri.parse('$baseUrl/clients/auth/signup');
    try {
      // Préparer la requête multipart
      final request = http.MultipartRequest('POST', url);
      request.headers.addAll({'Content-Type': 'multipart/form-data'});

      // Ajouter les champs texte
      request.fields['nom'] = nom;
      request.fields['prenom'] = prenom;
      request.fields['email'] = email;
      request.fields['motDePasse'] = motDePasse;
      if (adresse != null) request.fields['adresse'] = adresse;
      request.fields['languePreference'] = languePreference;
      if (numeroDeTelephone != null) request.fields['numeroDeTelephone'] = numeroDeTelephone;

      
      if (image != null) {
        final imageFile = await http.MultipartFile.fromPath('image', image.path);
        request.files.add(imageFile);
      }

      // Envoyer la requête
      final streamedResponse = await request.send().timeout(Duration(seconds: 10));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 201) {
        return jsonDecode(response.body); // Retourne le token et les infos utilisateur
      } else {
        logger.e("Erreur lors de l'inscription : ${response.statusCode} - ${response.body}");
        throw Exception('Inscription échouée. Veuillez réessayer.');
      }
    } catch (e) {
      logger.e("Exception lors de l'inscription", e);
      throw Exception('Erreur réseau ou interne. Veuillez réessayer.');
    }
  }


  // Connexion (Signin)
  Future<Map<String, dynamic>?> signin({
    required String email,
    required String motDePasse,
  }) async {
    final url = Uri.parse('$baseUrl/clients/auth/signin');
    try {
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'motDePasse': motDePasse}),
          )
          .timeout(Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body); // Retourne le token et les infos utilisateur
      } else if (response.statusCode == 401) {
        throw Exception('Identifiants incorrects.');
      } else {
        logger.e("Erreur lors de la connexion : ${response.statusCode} - ${response.body}");
        throw Exception('Connexion échouée. Veuillez réessayer.');
      }
    } catch (e) {
      logger.e("Exception lors de la connexion", e);
      throw Exception('Erreur réseau ou interne. Veuillez réessayer.');
    }
  }

  
  // Demande de réinitialisation (correction de l'URL)
Future<Map<String, dynamic>> forgotPassword(String email) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/utilisateur/auth/request-reset'), // URL corrigée
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: json.encode({'email': email}),
    );

    final responseData = json.decode(response.body);

    return {
      'success': response.statusCode == 200,
      'message': responseData['message'] ?? 'Erreur inconnue',
      'data': responseData,
    };
  } catch (e) {
    logger.e('Erreur API forgotPassword: $e');
    return {
      'success': false,
      'message': 'Erreur de connexion au serveur',
      'data': null,
    };
  }
}

// Réinitialisation du mot de passe (correction de l'URL)
Future<Map<String, dynamic>> resetPassword({
  required String token,
  required String newPassword,
}) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/utilisateur/auth/reset-password'), // URL corrigée
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: json.encode({
        'token': token,
        'newPassword': newPassword,
      }),
    );

    final responseData = json.decode(response.body);

    return {
      'success': response.statusCode == 200,
      'message': responseData['message'] ?? 'Erreur inconnue',
      'data': responseData,
    };
  } catch (e) {
    logger.e('Erreur API resetPassword: $e');
    return {
      'success': false,
      'message': 'Erreur de connexion au serveur',
      'data': null,
    };
  }
}
}

