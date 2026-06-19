import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../utils/constants.dart';

class TransportService {
  final String baseUrl = ApiConstants.baseUrl;

  /// 🔍 Recherche horaires bus/train
  Future<Map<String, dynamic>> searchHoraires({
    required String token,
    required int villeDepartId,
    required int villeArriveeId,
    required String dateVoyage,
    required String typeTransport, // 'bus' ou 'train'
  }) async {
    final response = await http.post(
      Uri.parse("$baseUrl/clients/transport/recherches/recherche-transport"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "ville_depart_id": villeDepartId,
        "ville_arrivee_id": villeArriveeId,
        "date_voyage": dateVoyage,
        "type_transport": typeTransport,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception("Erreur recherche transport: ${response.body}");
    }
  }

  /// 🚌 Créer une réservation
  Future<Map<String, dynamic>> createReservation({
    required String token,
    required int horaireId,
    required int departId,
    required int arriveeId,
    required int nombrePlaces,
    required String dateVoyage,
  }) async {
    final response = await http.post(
      Uri.parse("$baseUrl/reservationTransport"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "horaire_id": horaireId,
        "depart_id": departId,
        "arrivee_id": arriveeId,
        "nombre_places": nombrePlaces,
        "date_voyage": dateVoyage,
      }),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception("Erreur création réservation: ${response.body}");
    }
  }

  /// ❌ Annuler une réservation
  Future<void> cancelReservation(int id, String token) async {
    final response = await http.delete(
      Uri.parse("$baseUrl/reservationTransport/$id"),
      headers: {"Authorization": "Bearer $token"},
    );

    if (response.statusCode != 200) {
      throw Exception("Erreur annulation réservation: ${response.body}");
    }
  }

  /// 📋 Mes réservations en cours
  Future<List<dynamic>> getMyReservations(String token) async {
    final response = await http.get(
      Uri.parse("$baseUrl/reservationTransport/client/mes-reservations"),
      headers: {"Authorization": "Bearer $token"},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception("Erreur récupération réservations: ${response.body}");
    }
  }

  /// 🕓 Historique de mes réservations
  Future<List<dynamic>> getHistoriqueReservations(String token) async {
    final response = await http.get(
      Uri.parse("$baseUrl/reservationTransport/client/historique"),
      headers: {"Authorization": "Bearer $token"},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception("Erreur récupération historique: ${response.body}");
    }
  }
}
