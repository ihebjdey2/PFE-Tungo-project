import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:provider/provider.dart';
import 'package:svg_path_parser/svg_path_parser.dart';
import 'package:xml/xml.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../viewmodels/recherche_viewmodel.dart';
import 'chauffeurs_disponibles_screen.dart';
import 'reservation_vehicule.dart';

class RegionPath {
  final String id;
  final String name;
  final Path path;

  RegionPath({required this.id, required this.name, required this.path});
}

class CarteTestScreen extends StatefulWidget {
  const CarteTestScreen({super.key});

  @override
  State<CarteTestScreen> createState() => _CarteTestScreenState();
}

class _CarteTestScreenState extends State<CarteTestScreen> {
  final GlobalKey _paintKey = GlobalKey();
  List<RegionPath> regions = [];
  RegionPath? selectedDepart;
  RegionPath? selectedDestination;
  bool selectingDepart = true;

  @override
  void initState() {
    super.initState();
    _loadRegions();
  }

  Future<void> _loadRegions() async {
    final svgString = await rootBundle.loadString('assets/images/tn.svg');
    final doc = XmlDocument.parse(svgString);
    final List<RegionPath> regionList = [];

    for (final pathElem in doc.findAllElements('path')) {
      final id = pathElem.getAttribute('id');
      final name = pathElem.getAttribute('name') ?? id;
      final d = pathElem.getAttribute('d');

      if (id != null && name != null && d != null) {
        final path = parseSvgPath(d);
        regionList.add(RegionPath(id: id, name: name, path: path));
      }
    }

    setState(() {
      regions = regionList;
    });
  }

  void _onTap(Offset tapPosition) {
    final renderBox = _paintKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null) return;

    final Size size = renderBox.size;
    const double originalWidth = 1000;
    const double originalHeight = 1000;

    final double scaleX = size.width / originalWidth;
    final double scaleY = size.height / originalHeight;
    final Matrix4 matrix4 = Matrix4.identity()..scale(scaleX, scaleY);
    final Matrix4 inverse = Matrix4.inverted(matrix4);

    final Offset transformedPosition = MatrixUtils.transformPoint(inverse, tapPosition);

    for (final region in regions) {
      if (region.path.contains(transformedPosition)) {
        setState(() {
          if (selectingDepart) {
            if (region == selectedDestination) {
              _showSnackBar("Cette région est déjà choisie comme destination.");
              return;
            }
            selectedDepart = region;
            selectingDepart = false;
          } else {
            if (region == selectedDepart) {
              _showSnackBar("Vous avez déjà choisi cette région comme départ.");
              return;
            }
            selectedDestination = region;
          }
        });
        break;
      }
    }
  }

  Future<String> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  void _navigateToChauffeursDisponiblesScreen(BuildContext context, String token, int pointDepartId, int destinationId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChauffeursDisponiblesScreen(
          pointDepartId: pointDepartId,
          destinationId: destinationId,
          token: token,
        ),
      ),
    );
  }

 void _showTypeReservationDialog(BuildContext context, String token, int pointDepartId, int destinationId) {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        content: SingleChildScrollView(  // 🔁 Ajout ici
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Choisir le type de réservation',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.purple,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 20),
              _buildTypeOption(
                context,
                'Réservation avec chauffeur',
                'Choisir parmi les chauffeurs disponibles',
                Icons.person,
                () {
                  Navigator.pop(context);
                  _navigateToChauffeursDisponiblesScreen(context, token, pointDepartId, destinationId);
                },
              ),
              const SizedBox(height: 16),
              _buildTypeOption(
                context,
                'Réservation de véhicule',
                'Réserver un véhicule pour votre trajet',
                Icons.directions_car,
                () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ReservationVehiculeScreen(
                        pointDepartId: pointDepartId,
                        destinationId: destinationId,
                        token: token,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
              _buildTypeOption(
                context,
                'Envoyer un colis',
                'Faire livrer un colis à une autre ville',
                Icons.local_shipping,
                () {
                  Navigator.pop(context);
                  Navigator.pushNamed(
                    context,
                    '/envoyer-colis',
                    arguments: {
                      'station_depart_id': pointDepartId,
                      'station_arrivee_id': destinationId,
                    },
                  );
                },
              ),
            ],
          ),
        ),
      );
    },
  );
}


  Widget _buildTypeOption(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.2),
              spreadRadius: 1,
              blurRadius: 3,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.purple.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.purple, size: 30),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.purple)),
                  const SizedBox(height: 4),
                  Text(subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      )),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, color: Colors.purple, size: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final rechercheVM = Provider.of<RechercheViewModel>(context);

    return Scaffold(
      backgroundColor: Colors.grey[200],
      appBar: AppBar(
        title: const Text('Recherche sur Carte'),
        centerTitle: true,
        backgroundColor: Colors.purple,
        elevation: 0,
      ),
      body: regions.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      return InteractiveViewer(
                        minScale: 0.8,
                        maxScale: 4.0,
                        panEnabled: true,
                        scaleEnabled: true,
                        child: GestureDetector(
                          onTapUp: (details) {
                            final RenderBox renderBox =
                                _paintKey.currentContext?.findRenderObject()
                                    as RenderBox;
                            final Offset localOffset =
                                renderBox.globalToLocal(details.globalPosition);
                            _onTap(localOffset);
                          },
                          child: CustomPaint(
                            key: _paintKey,
                            painter: _CartePainter(
                              regions: regions,
                              selectedDepart: selectedDepart,
                              selectedDestination: selectedDestination,
                            ),
                            child: Container(
                              width: constraints.maxWidth,
                              height: constraints.maxHeight,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                if (selectedDepart != null || selectedDestination != null)
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(
                      'Départ : ${selectedDepart?.name ?? "---"} | Destination : ${selectedDestination?.name ?? "---"}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: ElevatedButton(
                    onPressed: () async {
                      final token = await getToken();

                      if (selectedDepart == null || selectedDestination == null) {
                        _showSnackBar("Veuillez sélectionner les deux régions.");
                        return;
                      }

                      rechercheVM.setPointDepart(int.parse(selectedDepart!.id));
                      rechercheVM.setDestination(int.parse(selectedDestination!.id));

                      final success = await rechercheVM.createRecherche(token);

                      if (success) {
                        await rechercheVM.fetchStationsPourTrajet();
                        _showTypeReservationDialog(
                          context,
                          token,
                          int.parse(selectedDepart!.id),
                          int.parse(selectedDestination!.id),
                        );
                      } else {
                        _showSnackBar(rechercheVM.errorMessage ?? "Erreur lors de la création.");
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      backgroundColor: Colors.purple,
                    ),
                    child: const Text(
                      'Créer une Recherche',
                      style: TextStyle(fontSize: 16, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _CartePainter extends CustomPainter {
  final List<RegionPath> regions;
  final RegionPath? selectedDepart;
  final RegionPath? selectedDestination;

  _CartePainter({
    required this.regions,
    required this.selectedDepart,
    required this.selectedDestination,
  });

  @override
  void paint(Canvas canvas, Size size) {
    const double originalWidth = 1000;
    const double originalHeight = 1000;
    final double scaleX = size.width / originalWidth;
    final double scaleY = size.height / originalHeight;
    final Matrix4 matrix4 = Matrix4.identity()..scale(scaleX, scaleY);

    final Paint normalPaint = Paint()..color = Colors.grey.shade300;
    final Paint departPaint = Paint()..color = Colors.purple;
    final Paint destPaint = Paint()..color = Colors.green;
    final Paint borderPaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.7;

    for (final region in regions) {
      final Path transformedPath = region.path.transform(matrix4.storage);
      final Paint fillPaint = (region == selectedDepart)
          ? departPaint
          : (region == selectedDestination)
              ? destPaint
              : normalPaint;

      canvas.drawPath(transformedPath, fillPaint);
      canvas.drawPath(transformedPath, borderPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
