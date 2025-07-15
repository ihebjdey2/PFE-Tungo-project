import 'package:flutter/material.dart';

class CustomFormField extends StatelessWidget {
  final String hint;
  final bool isPassword;
  final TextEditingController controller;
  final IconData icon;
  final TextInputType? keyboardType;
  final Function(String) onChanged;
  final String? Function(String?)? validator;

  const CustomFormField({
    Key? key,
    required this.hint,
    required this.controller,
    required this.icon,
    required this.onChanged,
    this.keyboardType,
    this.validator,
    this.isPassword = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: isPassword,
      onChanged: onChanged,
      validator: validator,
      decoration: InputDecoration(
        labelText: hint,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
