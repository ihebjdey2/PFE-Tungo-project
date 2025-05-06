import 'utilisateur.dart';

class Client {
  final int utilisateurId;
  final String adresse;
  final String languePreference;
  final Utilisateur utilisateur;

  Client({
    required this.utilisateurId,
    required this.adresse,
    required this.languePreference,
    required this.utilisateur,
  });

  // Accesseurs pour exposer les champs de Utilisateur
  String get nom => utilisateur.nom;
  String get prenom => utilisateur.prenom;
  String get email => utilisateur.email;
  String? get numeroDeTelephone => utilisateur.numeroDeTelephone;
  String get image => utilisateur.image;

  factory Client.fromJson(Map<String, dynamic> json) {
    return Client(
      utilisateurId: json['utilisateur_id'] ?? 0,
      adresse: json['adresse'] ?? '',
      languePreference: json['languePreference'] ?? 'fr',
      utilisateur: Utilisateur.fromJson(json['Utilisateur']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'utilisateur_id': utilisateurId,
      'adresse': adresse,
      'languePreference': languePreference,
      'Utilisateur': utilisateur.toJson(),
    };
  }
}
