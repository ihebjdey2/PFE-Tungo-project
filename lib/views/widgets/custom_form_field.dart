import 'package:flutter/material.dart';

class CustomFormField extends StatelessWidget {
  final String hint;
  final bool isPassword;
  final Function(String) onChanged;
  final String? Function(String?)? validator;

  const CustomFormField({
    Key? key,
    required this.hint,
    this.isPassword = false,
    required this.onChanged,
    this.validator,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      decoration: InputDecoration(labelText: hint),
      obscureText: isPassword,
      onChanged: onChanged,
      validator: validator,
    );
  }
}
