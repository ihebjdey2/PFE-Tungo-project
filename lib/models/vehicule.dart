class Vehicule {
  final int id;
  final String marque;
  final String modele;
  final int annee;
  final String numeroDePlaques;
  final int capacite;
  final String statut; 


  Vehicule({
    required this.id,
    required this.marque,
    required this.modele,
    required this.annee,
    required this.numeroDePlaques,
    required this.capacite,
    required this.statut,

  });

  factory Vehicule.fromJson(Map<String, dynamic> json) {
  return Vehicule(
    id: json['id'] ?? 0,
    marque: json['marque'] ?? 'Inconnu',
    modele: json['modele'] ?? 'Inconnu',
    annee: json['annee'] ?? 2000,  // Valeur par défaut si manquante
    numeroDePlaques: json['numero_de_plaques'] ?? 'N/A',
    capacite: json['capacite'] ?? 0,
    statut: json['statut'] ?? 'disponible',
  );

  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'marque': marque,
      'modele': modele,
      'annee': annee,
      'numero_de_plaques': numeroDePlaques,
      'capacite': capacite,
      'statut': statut,
    };
  }
}
