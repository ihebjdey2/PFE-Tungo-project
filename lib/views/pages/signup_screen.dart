import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/auth_viewmodel.dart';
import '../widgets/custom_scaffold.dart';
import '../widgets/loader.dart';
import '../widgets/error_message.dart';
import '../../theme/theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({Key? key}) : super(key: key);

  @override
  SignupScreenState createState() => SignupScreenState();
}

class SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final nomController = TextEditingController();
  final prenomController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final numeroDeTelephoneController = TextEditingController();
  final adresseController = TextEditingController();
  String languePreference = 'fr';
  File? _selectedImage;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _selectedImage = File(pickedFile.path));
    }
  }

  @override
  Widget build(BuildContext context) {
    final authViewModel = Provider.of<AuthViewModel>(context);

    return CustomScaffold(
      title: "Inscription Client",
      showBottomNavigationBar: false,
      currentIndex: 0,
      onTabChanged: (_) {},
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Card(
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                  elevation: 6,
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          const Text(
                            'Créer un compte',
                            style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary),
                          ),
                          const SizedBox(height: 24),
                          ..._buildTextFields(),
                          const SizedBox(height: 16),
                          _buildLanguePreferenceDropdown(),
                          const SizedBox(height: 16),
                          _buildImagePicker(),
                          const SizedBox(height: 20),

                          if (authViewModel.errorMessage != null)
                            ErrorMessage(authViewModel.errorMessage!),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            /// 🔥 BOUTON EN BAS DE LA PAGE
            authViewModel.isLoading
                ? const Loader()
                : SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: _onSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.person_add_alt_1, color: Colors.white),
                      label: const Text(
                        "S'inscrire",
                        style: TextStyle(
                            fontSize: 16,
                            color: Colors.white, /// 🔥 Texte blanc
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
          ],
        ),
      ),
    );
  }

  void _onSubmit() async {
    final authViewModel =
        Provider.of<AuthViewModel>(context, listen: false);
    if (_formKey.currentState?.validate() ?? false) {
      final success = await authViewModel.signup(
        nom: nomController.text.trim(),
        prenom: prenomController.text.trim(),
        email: emailController.text.trim(),
        motDePasse: passwordController.text.trim(),
        numeroDeTelephone: numeroDeTelephoneController.text.trim(),
        adresse: adresseController.text.trim(),
        languePreference: languePreference,
        image: _selectedImage,
      );

      if (!mounted) return;

      if (success) {
        Navigator.pushReplacementNamed(context, '/login',
            arguments: {'email': emailController.text.trim()});
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Inscription réussie. Veuillez vous connecter.')),
        );
      }
    }
  }

  List<Widget> _buildTextFields() {
    return [
      _buildTextField(nomController, 'Nom'),
      _buildTextField(prenomController, 'Prénom'),
      _buildTextField(emailController, 'Email',
          keyboardType: TextInputType.emailAddress),
      _buildTextField(passwordController, 'Mot de passe',
          obscureText: true),
      _buildTextField(numeroDeTelephoneController, 'Téléphone',
          keyboardType: TextInputType.phone),
      _buildTextField(adresseController, 'Adresse'),
    ];
  }

  Widget _buildTextField(TextEditingController controller, String label,
      {TextInputType keyboardType = TextInputType.text,
      bool obscureText = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        validator: (value) =>
            (value == null || value.isEmpty) ? 'Champ requis' : null,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(_getIconForLabel(label)),
          border:
              OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }

  IconData _getIconForLabel(String label) {
    switch (label.toLowerCase()) {
      case 'nom':
        return Icons.person;
      case 'prénom':
        return Icons.person_outline;
      case 'email':
        return Icons.email;
      case 'mot de passe':
        return Icons.lock;
      case 'téléphone':
        return Icons.phone;
      case 'adresse':
        return Icons.location_on;
      default:
        return Icons.input;
    }
  }

  Widget _buildLanguePreferenceDropdown() {
    return DropdownButtonFormField<String>(
      value: languePreference,
      decoration: const InputDecoration(
        labelText: 'Langue Préférée',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.language),
      ),
      items: const [
        DropdownMenuItem(value: 'ar', child: Text('Arabe')),
        DropdownMenuItem(value: 'fr', child: Text('Français')),
        DropdownMenuItem(value: 'en', child: Text('Anglais')),
      ],
      onChanged: (value) => setState(() => languePreference = value!),
    );
  }

  Widget _buildImagePicker() {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text(
        "Photo de profil",
        style: TextStyle(fontWeight: FontWeight.w600),
      ),
      const SizedBox(height: 10),

      /// --- Aperçu de l'image (déjà centré, parfait)
      Center(
        child: _selectedImage != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.file(
                  _selectedImage!,
                  height: 120,
                  width: 120,
                  fit: BoxFit.cover,
                ),
              )
            : const Icon(Icons.image, size: 80, color: Colors.grey),
      ),

      const SizedBox(height: 12),

      /// --- 🔥 BOUTON CENTRÉ ICI 🔥
      Center(
        child: ElevatedButton.icon(
          onPressed: _pickImage,
          icon: const Icon(Icons.photo, color: Colors.white),
          label: const Text(
            'Choisir une image',
            style: TextStyle(color: Colors.white),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
      ),
    ],
  );
}
}