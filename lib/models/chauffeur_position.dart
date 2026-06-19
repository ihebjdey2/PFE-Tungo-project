class ChauffeurPosition {
  final int chauffeurId;
  final String nom;
  final String prenom;
  final String villeDepart;
  final String villeDestination;
  final String marqueVehicule;
  final String modeleVehicule;
  final String numeroPlaque;
  final int capacite; 
  final String? image;
  final DateTime derniereMiseAJour;
    
      

  ChauffeurPosition({
    required this.chauffeurId,
    required this.nom,
    required this.prenom,
    required this.villeDepart,
    required this.villeDestination,
    required this.marqueVehicule,
    required this.modeleVehicule,
    required this.capacite,
    required this.numeroPlaque,
    this.image,
    required this.derniereMiseAJour,
  });

  factory ChauffeurPosition.fromJson(Map<String, dynamic> json) {
    return ChauffeurPosition(
      chauffeurId: json['chauffeur_id'] ?? 0,
      nom: json['nom'] ?? 'Inconnu',
      prenom: json['prenom'] ?? 'Inconnu',
      villeDepart: json['ville_depart'] ?? 'Inconnu',
      villeDestination: json['ville_destination'] ?? 'Inconnu',
      marqueVehicule: json['vehicule'] != null ? json['vehicule']['marque'] ?? 'Non spécifié' : 'Non spécifié',
      modeleVehicule: json['vehicule'] != null ? json['vehicule']['modele'] ?? 'Non spécifié' : 'Non spécifié',
      numeroPlaque: json['vehicule'] != null ? json['vehicule']['numero_de_plaques'] ?? 'N/A' : 'N/A',
      capacite: json['vehicule'] != null ? json['vehicule']['capacite'] ?? 0 : 0, 
      image: json['image'] ?? null,
      derniereMiseAJour: DateTime.tryParse(json['derniere_mise_a_jour'] ?? '') ?? DateTime.now(),
   );
  }
}
