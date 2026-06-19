import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../viewmodels/transport_viewmodel.dart';
import '../../viewmodels/auth_viewmodel.dart';
import '../../viewmodels/recherche_viewmodel.dart';

class RechercheTransportScreen extends StatefulWidget {
  const RechercheTransportScreen({super.key});

  @override
  State<RechercheTransportScreen> createState() =>
      _RechercheTransportScreenState();
}

class _RechercheTransportScreenState extends State<RechercheTransportScreen> {
  final _dateController = TextEditingController();
  late String typeTransport = 'bus'; // fallback si aucun type passé

  Map<String, dynamic>? _villeDepart;
  Map<String, dynamic>? _villeArrivee;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final rechercheVM =
          Provider.of<RechercheViewModel>(context, listen: false);
      rechercheVM.fetchVilles();

      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      if (args != null && args.containsKey('type')) {
        typeTransport = args['type'] ?? 'bus';
      }
      setState(() {});
    });
  }

  @override
  void dispose() {
    _dateController.dispose();
    super.dispose();
  }

  String _calculerDuree(String heureDepart, String heureArrivee) {
    try {
      final format = DateFormat("HH:mm:ss");
      final depart = format.parse(heureDepart);
      final arrivee = format.parse(heureArrivee);

      Duration duree = arrivee.difference(depart);
      if (duree.isNegative) {
        duree = duree + const Duration(days: 1);
      }
      final heures = duree.inHours;
      final minutes = duree.inMinutes.remainder(60);

      return "${heures}h${minutes.toString().padLeft(2, '0')}";
    } catch (_) {
      return "--h--";
    }
  }

  String _safeHour(String s) {
    if (s.isEmpty) return "--:--";
    return s.length >= 5 ? s.substring(0, 5) : s;
  }

  bool get _isFormValid =>
      _villeDepart != null &&
      _villeArrivee != null &&
      _dateController.text.isNotEmpty;

  Future<void> _onSearchPressed(TransportViewModel vm, String token) async {
    if (!_isFormValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Veuillez remplir tous les champs")),
      );
      return;
    }

    await vm.rechercher(
      token: token,
      villeDepartId: _villeDepart!['id'],
      villeArriveeId: _villeArrivee!['id'],
      dateVoyage: _dateController.text,
      typeTransport: typeTransport,
    );
  }

  void _clearFormAndResults(TransportViewModel vm) {
    setState(() {
      _villeDepart = null;
      _villeArrivee = null;
      _dateController.clear();
    });
    vm.clearHoraires();
  }

  @override
  Widget build(BuildContext context) {
    final vm = Provider.of<TransportViewModel>(context);
    final authVM = Provider.of<AuthViewModel>(context, listen: false);
    final rechercheVM = Provider.of<RechercheViewModel>(context);

    final token = authVM.token ?? "";
    final primary = Colors.purple;
    final surface = Colors.white;

    return WillPopScope(
      onWillPop: () async {
        _clearFormAndResults(vm); // clear when user goes back
        return true; // allow pop
      },
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        appBar: AppBar(
          title: Text("Recherche ${typeTransport.toUpperCase()}"),
          centerTitle: true,
          backgroundColor: primary,
          elevation: 0,
        ),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // Formulaire Card
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 2,
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _buildVilleDropdown(
                              rechercheVM,
                              hint: "Ville de départ",
                              value: _villeDepart,
                              icon: Icons.location_on,
                              onChanged: (val) =>
                                  setState(() => _villeDepart = val),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildVilleDropdown(
                              rechercheVM,
                              hint: "Ville d'arrivée",
                              value: _villeArrivee,
                              icon: Icons.flag,
                              onChanged: (val) =>
                                  setState(() => _villeArrivee = val),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _dateController,
                              readOnly: true,
                              onTap: () async {
                                final DateTime? pickedDate =
                                    await showDatePicker(
                                  context: context,
                                  initialDate: DateTime.now(),
                                  firstDate: DateTime.now(),
                                  lastDate: DateTime(2100),
                                );
                                if (pickedDate != null) {
                                  setState(() {
                                    _dateController.text =
                                        DateFormat('yyyy-MM-dd')
                                            .format(pickedDate);
                                  });
                                }
                              },
                              decoration: InputDecoration(
                                labelText: "Date de voyage",
                                prefixIcon: const Icon(Icons.calendar_today),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                filled: true,
                                fillColor: surface,
                                suffixIcon: _dateController.text.isNotEmpty
                                    ? IconButton(
                                        icon: const Icon(Icons.clear),
                                        onPressed: () =>
                                            setState(() => _dateController.clear()),
                                      )
                                    : null,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          ConstrainedBox(
                            constraints: const BoxConstraints(minWidth: 100),
                            child: ElevatedButton.icon(
                              onPressed: _isFormValid
                                  ? () => _onSearchPressed(vm, token)
                                  : null,
                              icon: const Icon(Icons.search),
                              label: const Text("Rechercher"),
                              style: ElevatedButton.styleFrom(
                                foregroundColor: Colors.white,
                                backgroundColor: primary,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              "Sélectionnez villes et date, puis appuyez sur Rechercher.",
                              style:
                                  TextStyle(color: Colors.grey[600], fontSize: 12),
                            ),
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Résultats / états
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  child: vm.isLoading
                      ? _buildLoading()
                      : vm.error != null
                          ? _buildError(vm, token)
                          : vm.horaires.isEmpty
                              ? _buildEmpty(token)
                              : _buildResults(vm, token),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Helper widgets pour loading, error, empty, results
  Widget _buildLoading() => const Center(
        key: ValueKey('loading'),
        child: CircularProgressIndicator(),
      );

  Widget _buildError(TransportViewModel vm, String token) => Center(
        key: const ValueKey('error'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(vm.error ?? "Une erreur est survenue",
                style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => _onSearchPressed(vm, token),
              icon: const Icon(Icons.refresh),
              label: const Text("Réessayer"),
            )
          ],
        ),
      );

  Widget _buildEmpty(String token) => Center(
        key: const ValueKey('empty'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.schedule, size: 72, color: Colors.grey[400]),
            const SizedBox(height: 12),
            Text("Aucun horaire trouvé",
                style: TextStyle(fontSize: 18, color: Colors.grey[700])),
            const SizedBox(height: 8),
            Text("Essayez une autre date ou itinéraire.",
                style: TextStyle(color: Colors.grey[600]))
          ],
        ),
      );

  Widget _buildResults(TransportViewModel vm, String token) => ListView.separated(
        key: const ValueKey('results'),
        padding: const EdgeInsets.only(bottom: 24),
        itemCount: vm.horaires.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final h = vm.horaires[index];
          final heureDepart = (h['heure_depart'] ?? "--:--:--") as String;
          final heureArrivee = (h['heure_arrivee'] ?? "--:--:--") as String;
          final duree = _calculerDuree(heureDepart, heureArrivee);

          final departNom = h['depart'] ?? (_villeDepart?['nom'] ?? "-");
          final arriveeNom = h['arrivee'] ?? (_villeArrivee?['nom'] ?? "-");
          final prix = h['prix']?.toString() ?? "?";
          final capacite = h['capacite']?.toString() ?? "-";
          final horaireId = h['horaire_id'];

          String compagnieNom = "";
          if (h['compagnie'] is Map) {
            compagnieNom = (h['compagnie']['nom'] ?? h['compagnie']['name'])
                    ?.toString() ??
                "";
          } else {
            compagnieNom =
                (h['compagnie_nom'] ?? h['compagnieName'] ?? "").toString();
          }

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 3,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (compagnieNom.isNotEmpty) ...[
                      Row(
                        children: [
                          const Icon(Icons.business,
                              size: 18, color: Colors.deepPurple),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              compagnieNom,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Colors.deepPurple,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ],
                    Row(
                      children: [
                        Flexible(
                          flex: 3,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _safeHour(heureDepart),
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                departNom,
                                style: const TextStyle(fontSize: 12),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          flex: 2,
                          child: Column(
                            children: [
                              Text(duree,
                                  style: const TextStyle(color: Colors.grey)),
                              const SizedBox(height: 4),
                              const Icon(Icons.arrow_forward_ios,
                                  size: 14, color: Colors.grey),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          flex: 3,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                _safeHour(heureArrivee),
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                arriveeNom,
                                style: const TextStyle(fontSize: 12),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(height: 1),
                    const SizedBox(height: 8),
                    Wrap(
                      runSpacing: 8,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      alignment: WrapAlignment.spaceBetween,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.green[50],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: RichText(
                                text: TextSpan(
                                  text: prix,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                    fontSize: 16,
                                  ),
                                  children: const [
                                    TextSpan(
                                      text: " TND",
                                      style: TextStyle(
                                          fontWeight: FontWeight.normal,
                                          color: Colors.black54,
                                          fontSize: 12),
                                    )
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Chip(
                              label: Text("Places: $capacite"),
                              backgroundColor: Colors.grey[100],
                            ),
                          ],
                        ),
                        const Spacer(),
                        ConstrainedBox(
                          constraints: const BoxConstraints(minWidth: 100),
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              foregroundColor: Colors.white,
                              backgroundColor: Colors.deepPurple,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8)),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 12),
                            ),
                            onPressed: () async {
                              final ok = await vm.reserver(
                                token: token,
                                horaireId: horaireId,
                                departId: _villeDepart!['id'],
                                arriveeId: _villeArrivee!['id'],
                                nombrePlaces: 1,
                                dateVoyage: _dateController.text,
                              );
                              if (ok && mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content:
                                          Text("Réservation effectuée !")),
                                );
                              } else if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content:
                                          Text("Échec de la réservation")),
                                );
                              }
                            },
                            child: const Text("Réserver"),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );

  Widget _buildVilleDropdown(
    RechercheViewModel rechercheVM, {
    required String hint,
    required Map<String, dynamic>? value,
    required IconData icon,
    required void Function(Map<String, dynamic>?) onChanged,
  }) {
    return LayoutBuilder(builder: (context, constraints) {
      final maxW = constraints.maxWidth;
      return ConstrainedBox(
        constraints: BoxConstraints(minWidth: 0, maxWidth: maxW),
        child: DropdownButtonFormField<Map<String, dynamic>>(
          isExpanded: true,
          value: value,
          hint: Text(hint, overflow: TextOverflow.ellipsis),
          items: rechercheVM.villes
              .map((ville) => DropdownMenuItem<Map<String, dynamic>>(
                    value: ville,
                    child: Text(
                      ville['nom'] ?? "-",
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ))
              .toList(),
          selectedItemBuilder: (context) {
            return rechercheVM.villes.map((ville) {
              final name = ville['nom'] ?? "-";
              return Align(
                alignment: Alignment.centerLeft,
                child: Tooltip(
                  message: name,
                  child: Text(
                    name,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              );
            }).toList();
          },
          onChanged: onChanged,
          decoration: InputDecoration(
            isDense: true,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
            prefixIcon: Icon(icon, size: 20),
            prefixIconConstraints:
                const BoxConstraints(minWidth: 36, minHeight: 36),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
      );
    });
  }
}
