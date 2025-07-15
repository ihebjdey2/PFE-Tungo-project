class Colis {
  final int id;
  final int clientId;
  final int? chauffeurId;
  final int stationDepartId;
  final int stationArriveeId;
  final String description;
  final double poids;
  final double? prix;
  final String statut;
  final DateTime? dateEnvoi;
  final DateTime? dateLivraison;
  final String? codeRetrait;
  final String? nomDestinataire;
  final String? numeroDestinataire;

  Colis({
    required this.id,
    required this.clientId,
    this.chauffeurId,
    required this.stationDepartId,
    required this.stationArriveeId,
    required this.description,
    required this.poids,
    this.prix,
    required this.statut,
    this.dateEnvoi,
    this.dateLivraison,
    this.codeRetrait,
    this.nomDestinataire,
    this.numeroDestinataire,
  });

  factory Colis.fromJson(Map<String, dynamic> json) {
    return Colis(
      id: json['id'],
      clientId: json['client_id'],
      chauffeurId: json['chauffeur_id'],
      stationDepartId: json['station_depart_id'],
      stationArriveeId: json['station_arrivee_id'],
      description: json['description'],
      poids: (json['poids'] as num).toDouble(),
      prix: json['prix'] != null ? (json['prix'] as num).toDouble() : null,
      statut: json['statut'],
      dateEnvoi: json['date_envoi'] != null ? DateTime.parse(json['date_envoi']) : null,
      dateLivraison: json['date_livraison'] != null ? DateTime.parse(json['date_livraison']) : null,
      codeRetrait: json['code_retrait'],
      nomDestinataire: json['nom_destinataire'],
      numeroDestinataire: json['numero_destinataire'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'client_id': clientId,
      'chauffeur_id': chauffeurId,
      'station_depart_id': stationDepartId,
      'station_arrivee_id': stationArriveeId,
      'description': description,
      'poids': poids,
      'prix': prix,
      'statut': statut,
      'date_envoi': dateEnvoi?.toIso8601String(),
      'date_livraison': dateLivraison?.toIso8601String(),
      'code_retrait': codeRetrait,
      'nom_destinataire': nomDestinataire,
      'numero_destinataire': numeroDestinataire,
    };
  }
}
