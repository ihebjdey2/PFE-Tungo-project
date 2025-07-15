import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/colis_viewmodel.dart';
import '../../viewmodels/auth_viewmodel.dart';
import '../../viewmodels/recherche_viewmodel.dart';

class EnvoyerColisScreen extends StatefulWidget {
  @override
  _EnvoyerColisScreenState createState() => _EnvoyerColisScreenState();
}

class _EnvoyerColisScreenState extends State<EnvoyerColisScreen> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, dynamic> colisData = {
    "description": "",
    "poids": 0.0,
    "prix": 0.0,
    "nom_destinataire": "",
    "numero_destinataire": ""
  };

  bool isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    final colisViewModel = Provider.of<ColisViewModel>(context);
    final authViewModel = Provider.of<AuthViewModel>(context, listen: false);
    final rechercheViewModel = Provider.of<RechercheViewModel>(context, listen: false);
    final token = authViewModel.token;

    final departId = rechercheViewModel.pointDepartId;
    final destinationId = rechercheViewModel.destinationId;

    return Scaffold(
      appBar: AppBar(title: Text('Envoyer un colis')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                decoration: InputDecoration(labelText: 'Description'),
                onChanged: (value) => colisData['description'] = value,
                validator: (value) =>
                    value!.isEmpty ? 'Veuillez entrer une description' : null,
              ),
              TextFormField(
                decoration: InputDecoration(labelText: 'Poids (kg)'),
                keyboardType: TextInputType.number,
                onChanged: (value) =>
                    colisData['poids'] = double.tryParse(value) ?? 0.0,
              ),
              TextFormField(
                decoration: InputDecoration(labelText: 'Nom du destinataire'),
                onChanged: (value) =>
                    colisData['nom_destinataire'] = value,
              ),
              TextFormField(
                decoration:
                    InputDecoration(labelText: 'Numéro du destinataire'),
                keyboardType: TextInputType.phone,
                onChanged: (value) =>
                    colisData['numero_destinataire'] = value,
              ),
              const SizedBox(height: 20),
              isSubmitting
                  ? const Center(child: CircularProgressIndicator())
                  : ElevatedButton(
                      onPressed: () async {
                        if (_formKey.currentState!.validate()) {
                          if (departId == null || destinationId == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text('Veuillez sélectionner les villes.')),
                            );
                            return;
                          }

                          setState(() => isSubmitting = true);

                          final data = {
                            ...colisData,
                            "ville_depart_id": departId,
                            "ville_destination_id": destinationId
                          };

                          final success = await colisViewModel.creerColis(data, token!);

                          setState(() => isSubmitting = false);

                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(success
                                ? 'Colis envoyé avec succès'
                                : 'Erreur lors de l\'envoi du colis'),
                          ));

                          if (success) Navigator.pop(context);
                        }
                      },
                      child: const Text('Envoyer'),
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
