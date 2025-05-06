import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import '../utils/constants.dart';

class ReservationService {
  final String baseUrl = ApiConstants.baseUrl;
  final logger = Logger();

  // 🔹 Créer une réservation
  Future<Map<String, dynamic>?> createReservation({
  required String token,
  required int chauffeurId,
  required int villeDepartId,
  required int villeDestinationId,
  required int  nombre_places,
}) async {
  final url = Uri.parse('$baseUrl/reservations/Client/create');
  
  
  
  final requestBody = jsonEncode({
    "chauffeur_id": chauffeurId,
    "ville_depart_id": villeDepartId,
    "ville_destination_id": villeDestinationId,
    "nombre_places": nombre_places,
  });


  try {
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: requestBody,
    );

   

    if (response.statusCode == 201) {
      return jsonDecode(response.body)['reservation'];
    } else {
      throw Exception("Erreur API : ${response.statusCode} - ${response.body}");
    }
  } catch (e) {
    return null;
  }
}

 // 🔹 Récupérer la réservation actuelle du client
  Future<Map<String, dynamic>?> getCurrentReservation(String token) async {
    final url = Uri.parse('$baseUrl/reservations/Client/current');
    logger.i("📢 Appel API : $url avec le token : $token");

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      logger.i("📡 Code HTTP : ${response.statusCode}");
      logger.i("📡 Réponse brute : ${response.body}");

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['reservation'] != null) {
          logger.i("✅ Réservation API reçue : ${jsonResponse['reservation']}");
          return jsonResponse['reservation'];
        } else {
          logger.w("❌ Aucune réservation active.");
          return null;
        }
      } else if (response.statusCode == 404) {
        logger.w("❌ Réservation non trouvée (404).");
        return null;
      } else {
        throw Exception("Erreur API : ${response.statusCode} - ${response.body}");
      }
    } catch (e) {
      logger.e("⛔ Erreur API : $e");
      return null;
    }
  }


  Future<bool> cancelReservation(String token, int reservationId) async {
  final url = Uri.parse('$baseUrl/reservations/Client/cancel');
  try {
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'reservation_id': reservationId,
      }),
    );

    if (response.statusCode == 200) {
      return true;
    } else {
      throw Exception("Erreur API : ${response.statusCode} - ${response.body}");
    }
  } catch (e) {
    return false;
  }
}

Future<List<Map<String, dynamic>>?> getReservationHistory(String token) async {
  final url = Uri.parse('$baseUrl/reservations/Client/history');

  try {
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(jsonResponse['reservations']);
    } else {
      throw Exception("Erreur API : ${response.statusCode} - ${response.body}");
    }
  } catch (e) {
    return null;
  }
}


}