class Itineraire {
  final int id;
  final Map<String, dynamic> villeDepart; // ✅ Correction : Map au lieu de String
  final Map<String, dynamic> villeArrivee; // ✅ Correction : Map au lieu de String
  final double distance;
  final String dureeEstimee;
  final double tarifBase;

  Itineraire({
    required this.id,
    required this.villeDepart,
    required this.villeArrivee,
    required this.distance,
    required this.dureeEstimee,
    required this.tarifBase,
  });

  factory Itineraire.fromJson(Map<String, dynamic> json) {
    return Itineraire(
      id: json['id'] ?? 0,
      villeDepart: json['ville_1'] ?? {'id': 0, 'nom': 'Inconnu'}, // ✅ Prend un Map
      villeArrivee: json['ville_2'] ?? {'id': 0, 'nom': 'Inconnu'}, // ✅ Prend un Map
      distance: (json['distance'] as num?)?.toDouble() ?? 0.0,
      dureeEstimee: json['duree_estimee'] ?? '00:00:00',
      tarifBase: (json['tarif_base'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
