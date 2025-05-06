import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/auth_viewmodel.dart';

class SignupScreen extends StatefulWidget {
  @override
  _SignupScreenState createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController nomController = TextEditingController();
  final TextEditingController prenomController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController numeroDeTelephoneController = TextEditingController();
  final TextEditingController adresseController = TextEditingController();
  String languePreference = 'fr'; // Valeur par défaut
  File? _selectedImage; // Variable pour stocker l'image sélectionnée

  // Méthode pour sélectionner une image
  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authViewModel = Provider.of<AuthViewModel>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inscription Client'),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.purple, Colors.white],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16.0),
                ),
                elevation: 8.0,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Créer un nouveau compte',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        ..._buildTextFields(),
                        const SizedBox(height: 16),
                        _buildLanguePreferenceDropdown(),
                        const SizedBox(height: 16),
                        _buildImagePicker(), // Ajout du champ pour sélectionner une image
                        const SizedBox(height: 20),
                        authViewModel.isLoading
                            ? const CircularProgressIndicator()
                            : ElevatedButton(
                                onPressed: () async {
                                  if (_formKey.currentState?.validate() ?? false) {
                                    final success = await authViewModel.signup(
                                      nom: nomController.text.trim(),
                                      prenom: prenomController.text.trim(),
                                      email: emailController.text.trim(),
                                      motDePasse: passwordController.text.trim(),
                                      numeroDeTelephone: numeroDeTelephoneController.text.trim(),
                                      adresse: adresseController.text.trim(),
                                      languePreference: languePreference,
                                      image: _selectedImage, // Passez l'image ici
                                    );

                                    if (success) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Inscription réussie. Connectez-vous.'),
                                        ),
                                      );
                                      Navigator.pushReplacementNamed(context, '/login', arguments: {'email': emailController.text.trim()});
                                    } else {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(authViewModel.errorMessage ?? 'Erreur inconnue.'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                    }
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  minimumSize: const Size(double.infinity, 50),
                                ),
                                child: const Text('S\'inscrire'),
                              ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Champs de texte
  List<Widget> _buildTextFields() {
    return [
      _buildTextField(
        controller: nomController,
        label: 'Nom',
        validator: (value) => value == null || value.isEmpty ? 'Veuillez entrer votre nom.' : null,
      ),
      const SizedBox(height: 16),
      _buildTextField(
        controller: prenomController,
        label: 'Prénom',
        validator: (value) => value == null || value.isEmpty ? 'Veuillez entrer votre prénom.' : null,
      ),
      const SizedBox(height: 16),
      _buildTextField(
        controller: emailController,
        label: 'Email',
        keyboardType: TextInputType.emailAddress,
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Veuillez entrer votre email.';
          }
          if (!RegExp(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").hasMatch(value)) {
            return 'Entrez un email valide (ex: exemple@gmail.com).';
          }
          return null;
        },
      ),
      const SizedBox(height: 16),
      _buildTextField(
        controller: passwordController,
        label: 'Mot de passe',
        obscureText: true,
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Veuillez entrer un mot de passe.';
          }
          if (value.length < 6) {
            return 'Le mot de passe doit contenir au moins 6 caractères.';
          }
          return null;
        },
      ),
      const SizedBox(height: 16),
      _buildTextField(
        controller: numeroDeTelephoneController,
        label: 'Numéro de téléphone',
        keyboardType: TextInputType.phone,
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Veuillez entrer votre numéro de téléphone.';
          }
          if (!RegExp(r"^\+?\d{8,15}$").hasMatch(value)) {
            return 'Entrez un numéro de téléphone valide (ex: +21612345678).';
          }
          return null;
        },
      ),
      const SizedBox(height: 16),
      _buildTextField(
        controller: adresseController,
        label: 'Adresse',
        validator: (value) => value == null || value.isEmpty ? 'Veuillez entrer votre adresse.' : null,
      ),
    ];
  }

  // Menu déroulant pour la langue préférée
  Widget _buildLanguePreferenceDropdown() {
    return DropdownButtonFormField<String>(
      value: languePreference,
      items: const [
        DropdownMenuItem(value: 'ar', child: Text('Arabe')),
        DropdownMenuItem(value: 'fr', child: Text('Français')),
        DropdownMenuItem(value: 'en', child: Text('Anglais')),
      ],
      onChanged: (value) {
        setState(() {
          languePreference = value!;
        });
      },
      decoration: const InputDecoration(
        labelText: 'Langue Préférée',
        border: OutlineInputBorder(),
      ),
    );
  }

  // Champ pour sélectionner une image
  Widget _buildImagePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_selectedImage != null)
          Center(
            child: Image.file(
              _selectedImage!,
              height: 150,
              width: 150,
              fit: BoxFit.cover,
            ),
          ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: _pickImage,
          icon: const Icon(Icons.photo),
          label: const Text('Choisir une image'),
        ),
      ],
    );
  }

  // Champ de texte générique
  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType keyboardType = TextInputType.text,
    bool obscureText = false,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
    );
  }
}
