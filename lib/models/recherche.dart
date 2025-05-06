class Recherche {
  final int? id; // Champ optionnel
  final int clientId;
  final int pointDepartId;
  final int destinationId;
  final DateTime? heureRecherche; // Champ optionnel
  final String? pointDepartNom; // Nouveau champ pour le nom du point de départ
  final String? destinationNom; // Nouveau champ pour le nom de la destination

  Recherche({
    this.id,
    required this.clientId,
    required this.pointDepartId,
    required this.destinationId,
    this.heureRecherche,
    this.pointDepartNom,
    this.destinationNom,
  });

  factory Recherche.fromJson(Map<String, dynamic> json) {
  return Recherche(
    id: json['id'],
    clientId: json['client_id'],
    pointDepartId: json['point_depart_id'] ?? 0,  // 🔹 Prend l'ID du point de départ
    destinationId: json['destination_id'] ?? 0,  // 🔹 Prend l'ID de la destination
    pointDepartNom: json['point_depart'] ?? 'Inconnu', // 🔹 Prend le nom de la ville
    destinationNom: json['destination'] ?? 'Inconnu', // 🔹 Prend le nom de la ville
    heureRecherche: json['heure_recherche'] != null ? DateTime.tryParse(json['heure_recherche']) : null,
  );
}


  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'client_id': clientId,
      'point_depart_id': pointDepartId,
      'destination_id': destinationId,
      'heure_recherche': heureRecherche?.toIso8601String(),
      'point_depart': pointDepartNom,
      'destination': destinationNom,
    };
  }
}