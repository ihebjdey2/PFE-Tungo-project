class Utilisateur {
  final int id;
  final String nom;
  final String prenom;
  final String email;
  final String image;
  final String role;
  final String? numeroDeTelephone;
  final DateTime dateInscription;

  Utilisateur({
    required this.id,
    required this.nom,
    required this.prenom,
    required this.email,
    required this.image,
    required this.role,
    this.numeroDeTelephone,
    required this.dateInscription,
  });

  factory Utilisateur.fromJson(Map<String, dynamic> json) {
    return Utilisateur(
      id: json['id'],
      nom: json['nom'],
      prenom: json['prenom'],
      email: json['email'],
      image: json['image'],
      role: json['role'],
      numeroDeTelephone: json['numeroDeTelephone'],
      dateInscription: DateTime.parse(json['dateInscription']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nom': nom,
      'prenom': prenom,
      'email': email,
      'image': image,
      'role': role,
      'numeroDeTelephone': numeroDeTelephone,
      'dateInscription': dateInscription.toIso8601String(),
    };
  }
}
