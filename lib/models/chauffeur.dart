import 'utilisateur.dart';

class Chauffeur {
  final int utilisateurId;
  final String numeroCarteIdentite;
  final String numeroDeLicence;
  final String numeroPermis;
  final DateTime dateExpirationPermis;
  final bool disponible;
  final double note;
  final Utilisateur utilisateur;

  Chauffeur({
    required this.utilisateurId,
    required this.numeroCarteIdentite,
    required this.numeroDeLicence,
    required this.numeroPermis,
    required this.dateExpirationPermis,
    this.disponible = true,
    this.note = 0.0,
    required this.utilisateur,
  });

  // Accesseurs pour exposer les champs de Utilisateur
  String get nom => utilisateur.nom;
  String get prenom => utilisateur.prenom;
  String get email => utilisateur.email;
  String? get numeroDeTelephone => utilisateur.numeroDeTelephone;
  String get image => utilisateur.image;

  factory Chauffeur.fromJson(Map<String, dynamic> json) {
    return Chauffeur(
      utilisateurId: json['utilisateur_id'] ?? 0,
      numeroCarteIdentite: json['numeroCarteIdentite'] ?? '',
      numeroDeLicence: json['numeroDeLicence'] ?? '',
      numeroPermis: json['numeroPermis'] ?? '',
      dateExpirationPermis: DateTime.parse(json['dateExpirationPermis']),
      disponible: json['disponible'] ?? true,
      note: (json['note'] as num?)?.toDouble() ?? 0.0,
      utilisateur: Utilisateur.fromJson(json['Utilisateur']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'utilisateur_id': utilisateurId,
      'numeroCarteIdentite': numeroCarteIdentite,
      'numeroDeLicence': numeroDeLicence,
      'numeroPermis': numeroPermis,
      'dateExpirationPermis': dateExpirationPermis.toIso8601String(),
      'disponible': disponible,
      'note': note,
      'Utilisateur': utilisateur.toJson(),
    };
  }
}
