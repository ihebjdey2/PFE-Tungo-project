import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/colis.dart';
import '../utils/constants.dart';

class ColisService {
  final String baseUrl = '${ApiConstants.baseUrl}/colis';

  /// 🚀 Créer un colis (envoie une Map)
  Future<bool> createColis(Map<String, dynamic> colisData, String token) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token"
      },
      body: jsonEncode(colisData),
    );

    if (response.statusCode == 201) {
      return true;
    } else {
      throw Exception('Erreur création colis (${response.statusCode})');
    }
  }

  /// 📋 Liste des colis du client connecté (via token)
  Future<List<Colis>> getColisClient(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/client'),
      headers: {
        "Authorization": "Bearer $token"
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Colis.fromJson(json)).toList();
    } else {
      throw Exception('Erreur lors de la récupération des colis du client');
    }
  }
    /// 📄 Détails d’un colis spécifique envoyé par le client
  Future<Colis?> getColisByIdForClient(int colisId, String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/detail/$colisId'),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> data = jsonDecode(response.body);
      return Colis.fromJson(data);
    } else {
      throw Exception('Erreur lors de la récupération du colis ($colisId)');
    }
  }

}

