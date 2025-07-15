import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool showBack;
  final VoidCallback? onBack;
  final List<Widget>? actions;
  final String? subtitle;
  final Widget? leading;
  final bool extended;

  const CustomAppBar({
    Key? key,
    required this.title,
    this.showBack = false,
    this.onBack,
    this.actions,
    this.subtitle,
    this.leading,
    this.extended = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final hasDrawer = Scaffold.maybeOf(context)?.hasDrawer ?? false;

    return Container(
      height: extended ? 120 : kToolbarHeight + MediaQuery.of(context).padding.top,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color.fromRGBO(103, 58, 183, 1),
            Color.fromRGBO(123, 78, 203, 1),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color.fromRGBO(103, 58, 183, 0.25),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 2,
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              if (showBack || leading != null || hasDrawer)
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.2),
                      width: 1,
                    ),
                  ),
                  child: leading ??
                      IconButton(
                        icon: Icon(
                          showBack ? Icons.arrow_back_ios_rounded : Icons.menu,
                          color: Colors.white,
                          size: 20,
                        ),
                        onPressed: () {
                              HapticFeedback.lightImpact();
                              if (showBack) {
                                if (onBack != null) {
                                  onBack!();
                                } else {
                                  Navigator.pop(context);
                                }
                              } else {
                                Scaffold.of(context).openDrawer();
                              }
                            },

                      ),
                ),

              // Title
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withOpacity(0.8),
                          fontWeight: FontWeight.w400,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ],
                ),
              ),

              // Actions ou espace équilibré à droite
              if (actions != null && actions!.isNotEmpty)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: actions!.map((action) {
                    return Container(
                      width: 44,
                      height: 44,
                      margin: const EdgeInsets.only(left: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.2),
                          width: 1,
                        ),
                      ),
                      child: action,
                    );
                  }).toList(),
                )
              else if (showBack || leading != null || hasDrawer)
                const SizedBox(width: 44), // pour équilibrer l’alignement du Row
            ],
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(
    extended ? 120 : kToolbarHeight,
  );
}
