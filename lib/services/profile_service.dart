import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import '../utils/constants.dart';

class ProfileService {
  final String baseUrl = ApiConstants.baseUrl;
  final logger = Logger();

  // Récupération des informations du profil
  Future<Map<String, dynamic>?> getProfile(String token) async {
    final url = Uri.parse('$baseUrl/clients/auth/me');
    try {
      final response = await http
          .get(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body); // Retourne les informations utilisateur
      } else {
        logger.e("Erreur lors de la récupération du profil : ${response.statusCode} - ${response.body}");
        throw Exception('Impossible de récupérer le profil.');
      }
    } catch (e) {
      logger.e("Exception lors de la récupération du profil", e);
      throw Exception('Erreur réseau ou interne. Veuillez réessayer.');
    }
  }

  // Mise à jour des informations du profil avec image
  Future<Map<String, dynamic>?> updateProfile({
    required String token,
    String? nom,
    String? prenom,
    String? email,
    String? adresse,
    String? languePreference,
    String? numeroDeTelephone,
    String? motDePasse,
    File? image, // Ajout du paramètre image
  }) async {
    final url = Uri.parse('$baseUrl/clients/auth/profile');
    try {
      // Préparer la requête multipart
      final request = http.MultipartRequest('PUT', url);
      request.headers['Authorization'] = 'Bearer $token';

      // Ajouter les champs texte
      if (nom != null) request.fields['nom'] = nom;
      if (prenom != null) request.fields['prenom'] = prenom;
      if (email != null) request.fields['email'] = email;
      if (adresse != null) request.fields['adresse'] = adresse;
      if (languePreference != null) request.fields['languePreference'] = languePreference;
      if (numeroDeTelephone != null) request.fields['numeroDeTelephone'] = numeroDeTelephone;
      if (motDePasse != null) request.fields['motDePasse'] = motDePasse;

      // Ajouter l'image si elle est fournie
      if (image != null) {
        final imageFile = await http.MultipartFile.fromPath('image', image.path);
        request.files.add(imageFile);
      }

      // Envoyer la requête
      final streamedResponse = await request.send().timeout(Duration(seconds: 10));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return jsonDecode(response.body); // Retourne les informations mises à jour
      } else {
        logger.e("Erreur lors de la mise à jour du profil : ${response.statusCode} - ${response.body}");
        throw Exception('Mise à jour du profil échouée.');
      }
    } catch (e) {
      logger.e("Exception lors de la mise à jour du profil", e);
      throw Exception('Erreur réseau ou interne. Veuillez réessayer.');
    }
  }
}
