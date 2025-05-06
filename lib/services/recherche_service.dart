import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/recherche.dart';
import '../models/chauffeur_position.dart';
import '../utils/constants.dart';
import 'dart:async';

class RechercheService {
  final String baseUrl = ApiConstants.baseUrl;
  final logger = Logger();

  // 🔹 Récupérer le token de l'utilisateur stocké dans SharedPreferences
  Future<String?> _getToken() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  // 🔹 Récupérer la liste des villes
  Future<List<Map<String, dynamic>>> getVilles() async {
    final url = Uri.parse('$baseUrl/clients/recherches/villes');

    try {
      final response = await http.get(url, headers: {'Content-Type': 'application/json'}).timeout(Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> villes = jsonDecode(response.body);
        return villes.map((ville) => {'id': ville['id'], 'nom': ville['nom']}).toList();
      } else {
        logger.e("Erreur récupération villes : ${response.statusCode} - ${response.body}");
        throw Exception('Impossible de récupérer les villes.');
      }
    } on TimeoutException {
      logger.e("Timeout récupération villes");
      throw Exception('Délai dépassé, veuillez réessayer.');
    } catch (e) {
      logger.e("Erreur récupération villes", e);
      throw Exception('Erreur réseau, veuillez réessayer.');
    }
  }

  // 🔹 Créer une recherche de trajet
  Future<Recherche?> createRecherche(String token, int pointDepartId, int destinationId) async {
  final url = Uri.parse('$baseUrl/clients/recherches');

  try {
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'point_depart_id': pointDepartId,
        'destination_id': destinationId,
      }),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 201 || response.statusCode == 200) {  // 🔹 Gérer la mise à jour
      final jsonResponse = jsonDecode(response.body);
      return Recherche.fromJson(jsonResponse['recherche']);  
    } else {
      final errorMessage = jsonDecode(response.body)['message'] ?? 'Erreur inconnue.';
      throw Exception(errorMessage);
    }
  } catch (e) {
    logger.e("Erreur création/mise à jour recherche", e);
    return null;
  }
}



  // 🔹 Obtenir les chauffeurs disponibles pour un itinéraire
 Future<List<ChauffeurPosition>> getChauffeursDisponibles(int pointDepartId, int destinationId) async {
  final url = Uri.parse('$baseUrl/clients/recherches/chauffeurs?point_depart_id=$pointDepartId&destination_id=$destinationId');
  String? token = await _getToken();

  if (token == null) {
    throw Exception("Utilisateur non authentifié.");
  }

  try {
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    ).timeout(Duration(seconds: 10));

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body)['data'];
      return data.map((json) => ChauffeurPosition.fromJson(json)).toList();
    } else if (response.statusCode == 404) {
      logger.w("Aucun chauffeur trouvé pour cet itinéraire.");
      return [];  // Retourner une liste vide au lieu de lever une exception
    } else {
      logger.e("Erreur récupération chauffeurs : ${response.statusCode} - ${response.body}");
      return [];  // Gérer d'autres erreurs HTTP proprement
    }
  } on TimeoutException {
    logger.e("Timeout récupération chauffeurs");
    return [];
  } catch (e) {
    logger.e("Erreur récupération chauffeurs", e);
    return [];
  }
}


  // 🔹 Annuler une recherche active
  Future<bool> cancelRecherche() async {
    final url = Uri.parse('$baseUrl/clients/recherches');
    String? token = await _getToken();

    if (token == null) {
      throw Exception("Utilisateur non authentifié.");
    }

    try {
      final response = await http.delete(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(Duration(seconds: 10));

      if (response.statusCode == 200) {
        return true;
      } else if (response.statusCode == 404) {
        logger.e("Aucune recherche en cours à annuler.");
        return false;
      } else {
        logger.e("Erreur annulation recherche : ${response.statusCode} - ${response.body}");
        throw Exception('Erreur lors de l\'annulation.');
      }
    } on TimeoutException {
      logger.e("Timeout annulation recherche");
      throw Exception('Délai dépassé, veuillez réessayer.');
    } catch (e) {
      logger.e("Erreur annulation recherche", e);
      throw Exception('Erreur inattendue.');
    }
  }


  Future<Map<String, dynamic>?> getStationsPourTrajet(int villeDepartId, int villeDestinationId) async {
  final url = Uri.parse('$baseUrl/clients/recherches/stations?ville_depart_id=$villeDepartId&ville_destination_id=$villeDestinationId');
  try {
    final response = await http.get(
      url,
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      logger.e("Erreur récupération stations : ${response.statusCode} - ${response.body}");
      return null;
    }
  } catch (e) {
    logger.e("Erreur récupération stations", e);
    return null;
  }
}

}
